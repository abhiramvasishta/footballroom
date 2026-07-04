import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { TelegramProvider } from './providers/TelegramProvider';

const fastify = Fastify({ logger: true });

// Initialize provider
const telegramProvider = new TelegramProvider();

fastify.register(cors, {
  origin: '*', // Allow all origins for the SmartVideoPlayer
  methods: ['GET', 'OPTIONS'],
});

fastify.get('/api/stream/:videoId', async (request, reply) => {
  const { videoId } = request.params as { videoId: string };
  const range = request.headers.range;

  fastify.log.info(`[Stream] Request for videoId: ${videoId}, Range: ${range || 'none'}`);

  try {
    const metadata = await telegramProvider.getMetadata(videoId);
    const videoSize = metadata.size;

    if (!range) {
      // If no range header, respond with 200 OK and stream the entire video
      // This is crucial for Safari and some players to check `Accept-Ranges: bytes`
      const stream = await telegramProvider.getStream(videoId, 0, videoSize - 1);
      const response = reply.status(200).headers({
        'Accept-Ranges': 'bytes',
        'Content-Length': videoSize,
        'Content-Type': metadata.mimeType,
      }).send(stream);
      
      request.raw.on('close', () => {
        if (!stream.destroyed) stream.destroy();
      });
      return response;
    }

    // Parse Range
    const CHUNK_SIZE = 1024 * 1024 * 4; // Max 4MB per request to avoid huge memory spikes per connection
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + CHUNK_SIZE - 1, videoSize - 1);

    if (start >= videoSize) {
      reply.status(416).header('Content-Range', `bytes */${videoSize}`).send();
      return;
    }

    const contentLength = end - start + 1;
    const contentRange = `bytes ${start}-${end}/${videoSize}`;

    fastify.log.info(`[Stream] Range Request: ${range} | Calculated start: ${start}, end: ${end} | Content-Range: ${contentRange}`);

    const stream = await telegramProvider.getStream(videoId, start, end);

    const headers = {
      'Content-Range': contentRange,
      'Accept-Ranges': 'bytes',
      'Content-Length': contentLength,
      'Content-Type': metadata.mimeType,
    };

    console.log(`[Stream] Before reply.send(stream). Headers:`, headers);

    // Handle client disconnects to abort streaming
    request.raw.on('close', () => {
      console.log(`[Stream] Client disconnected early. Writable ended: ${reply.raw.writableEnded}, Stream destroyed: ${stream.destroyed}`);
      if (!stream.destroyed) {
        stream.destroy();
      }
    });

    // In async route handlers, return the reply when sending a stream to prevent premature resolution
    const response = reply.status(206).headers(headers).send(stream);
    console.log(`[Stream] After reply.send(stream). Response type: typeof stream`);
    
    return response;

  } catch (error) {
    fastify.log.error(error);
    reply.status(500).send('Internal Server Error');
  }
});

fastify.post('/api/telegram/resolve', async (request, reply) => {
  const { link } = request.body as { link: string };
  if (!link) {
    reply.status(400).send({ error: 'Missing link' });
    return;
  }
  try {
    const result = await telegramProvider.resolveLink(link);
    reply.send(result);
  } catch (error: any) {
    fastify.log.error(error);
    reply.status(400).send({ error: error.message || 'Failed to resolve link' });
  }
});

fastify.get('/api/telegram/thumbnail/:docId', async (request, reply) => {
  const { docId } = request.params as { docId: string };
  const thumbBuffer = telegramProvider.getThumbnail(docId);
  if (!thumbBuffer) {
    reply.status(404).send('Thumbnail not found or expired from cache');
    return;
  }
  reply.header('Content-Type', 'image/jpeg').send(thumbBuffer);
});

const start = async () => {
  try {
    await telegramProvider.init();
    await fastify.listen({ port: 3001, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3001');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
