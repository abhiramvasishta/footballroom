import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { TelegramProvider } from './providers/TelegramProvider';
import { EspnProvider } from './providers/EspnProvider';
import { getVideoMetadata } from './db/firestore';

const fastify = Fastify({ logger: true, trustProxy: true });

// Initialize provider
const telegramProvider = new TelegramProvider();
const fifaProvider = new EspnProvider();

fastify.register(cors, {
  origin: '*', // Allow all origins for the SmartVideoPlayer
  methods: ['GET', 'POST', 'OPTIONS'],
});

fastify.get('/api/stream/:videoId', async (request, reply) => {
  const { videoId } = request.params as { videoId: string };
  const range = request.headers.range;

  fastify.log.info(`[Stream] Incoming request for videoId: ${videoId}, Range: ${range || 'none'}`);

  try {
    const metadata = await telegramProvider.getMetadata(videoId);
    fastify.log.info(`[Stream] Resolved videoId: ${videoId} with metadata.`);
    const videoSize = metadata.size;

    if (!range) {
      const stream = await telegramProvider.getStream(videoId, 0, videoSize - 1);
      const headers = {
        'Accept-Ranges': 'bytes',
        'Content-Length': videoSize,
        'Content-Type': metadata.mimeType,
      };
      
      console.log(`[Stream] Before reply.send(stream) [No Range]. Headers:`, headers);
      const response = reply.status(200).headers(headers).send(stream);
      
      request.raw.on('close', () => {
        console.log(`[Stream] Request closed by client (No Range)`);
        if (!stream.destroyed) stream.destroy();
      });
      return response;
    }

    const CHUNK_SIZE = 1024 * 1024 * 4;
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

    console.log(`[Stream] Before reply.send(stream) [Partial]. Headers:`, headers);

    request.raw.on('close', () => {
      console.log(`[Stream] Request closed by client (Partial). Writable ended: ${reply.raw.writableEnded}, Stream destroyed: ${stream.destroyed}`);
      if (!stream.destroyed) {
        stream.destroy();
      }
    });

    const response = reply.status(206).headers(headers).send(stream);
    console.log(`[Stream] After reply.send(stream) invoked`);
    
    return response;

  } catch (error: any) {
    console.error(`[Stream] Error processing request for videoId ${videoId}:`, error);
    if (error.stack) {
      console.error(error.stack);
    }
    reply.status(500).send('Internal Server Error');
  }
});

fastify.post('/api/telegram/resolve', async (request, reply) => {
  console.log('[server] POST /api/telegram/resolve entered');
  console.log('[server] Request body:', request.body);
  const { link } = request.body as { link: string };
  if (!link) {
    console.log('[server] Missing link, returning 400');
    reply.status(400).send({ error: 'Missing link' });
    return;
  }
  try {
    console.log(`[server] Before telegramProvider.resolveLink('${link}')`);
    const result = await telegramProvider.resolveLink(link);
    console.log(`[server] After telegramProvider.resolveLink()`);
    console.log(`[server] Created videoId: ${result.videoId}`);
    
    console.log(`[server] Before Firestore read-back check for ${result.videoId}`);
    const readBack = await getVideoMetadata(result.videoId);
    if (!readBack) {
      console.error(`[server] ERROR: Read-back failed! Firestore did NOT return the document for ${result.videoId}`);
    } else {
      console.log(`[server] SUCCESS: Read-back verified for ${result.videoId}`);
    }
    
    console.log('[server] Before reply.send(result)');
    reply.send(result);
  } catch (error: any) {
    console.error('[server] Exception caught in /api/telegram/resolve:', error);
    if (error.stack) {
      console.error('[server] Full stack trace:', error.stack);
    }
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

// --- API Cache ---
interface CacheEntry {
  data: any;
  expiresAt: number;
}
const apiCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string) {
  const entry = apiCache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.data;
  }
  return null;
}

function setCache(key: string, data: any) {
  apiCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

// --- FIFA Data Endpoints ---

fastify.get('/api/fifa/live', async (request, reply) => {
  try {
    const matches = await fifaProvider.getLiveMatches();
    reply.send(matches);
  } catch (error: any) {
    fastify.log.error(error);
    reply.status(500).send({ error: error.message || 'Failed to fetch live matches' });
  }
});

fastify.get('/api/fifa/match/:matchId', async (request, reply) => {
  try {
    const { matchId } = request.params as { matchId: string };
    
    const cached = getCached(`match_${matchId}`);
    if (cached) return reply.send(cached);

    const match = await fifaProvider.getMatchDetails(matchId);
    if (!match) {
      return reply.status(404).send({ error: 'Match not found' });
    }
    
    setCache(`match_${matchId}`, match);
    reply.send(match);
  } catch (error: any) {
    fastify.log.error(error);
    reply.status(500).send({ error: error.message || 'Failed to fetch match details' });
  }
});

fastify.get('/api/fifa/today', async (request, reply) => {
  try {
    const matches = await fifaProvider.getTodayMatches();
    reply.send(matches);
  } catch (error: any) {
    fastify.log.error(error);
    reply.status(500).send({ error: error.message || 'Failed to fetch today matches' });
  }
});

fastify.get('/api/fifa/date/:date', async (request, reply) => {
  try {
    const { date } = request.params as { date: string };
    
    const cached = getCached(`date_${date}`);
    if (cached) return reply.send(cached);

    const matches = await fifaProvider.getMatchesByDate(date);
    
    setCache(`date_${date}`, matches);
    reply.send(matches);
  } catch (error: any) {
    fastify.log.error(error);
    reply.status(500).send({ error: error.message || 'Failed to fetch matches by date' });
  }
});

fastify.get('/api/fifa/upcoming', async (request, reply) => {
  try {
    const matches = await fifaProvider.getUpcomingMatches();
    reply.send(matches);
  } catch (error: any) {
    fastify.log.error(error);
    reply.status(500).send({ error: error.message || 'Failed to fetch upcoming matches' });
  }
});

const start = async () => {
  try {
    console.log("Backend Firebase Project:", process.env.FIREBASE_PROJECT_ID);
    await telegramProvider.init();
    
    process.on("SIGTERM", async () => {
      console.log("SIGTERM");
      console.log("Disconnecting Telegram...");
      await telegramProvider.disconnect();
      process.exit(0);
    });

    process.on("SIGINT", async () => {
      console.log("SIGINT");
      console.log("Disconnecting Telegram...");
      await telegramProvider.disconnect();
      process.exit(0);
    });

    const port = parseInt(process.env.PORT || '3001', 10);
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`Server is running on http://0.0.0.0:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
