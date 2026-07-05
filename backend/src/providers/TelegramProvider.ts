import { Readable } from 'stream';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { IStorageProvider, FileMetadata } from './IStorageProvider';
import { cache } from '../cache/ChunkCache';
import { Api } from 'telegram';
import { saveVideoMetadata, getVideoMetadata } from '../db/firestore';
import * as crypto from 'crypto';

export class TelegramProvider implements IStorageProvider {
  private client: TelegramClient;
  private readonly chunkSize = 1024 * 1024; // 1MB chunks

  constructor() {
    const apiId = parseInt(process.env.TELEGRAM_API_ID || '0');
    const apiHash = process.env.TELEGRAM_API_HASH || '';
    const stringSession = new StringSession(process.env.TELEGRAM_SESSION || '');

    if (!apiId || !apiHash) {
      console.warn('[TelegramProvider] Warning: TELEGRAM_API_ID or TELEGRAM_API_HASH not set');
    }

    this.client = new TelegramClient(stringSession, apiId, apiHash, {
      connectionRetries: 5,
    });
  }

  async init(): Promise<void> {
    await this.client.connect();
    console.log('[TelegramProvider] Connected to MTProto');
  }

  private async resolveLocation(videoId: string): Promise<Api.TypeInputFileLocation | null> {
    console.log(`[resolveLocation] Requested:`, videoId);
    try {
      const meta = await getVideoMetadata(videoId);
      console.log(`[resolveLocation] Metadata:`, meta);
      if (meta && meta.telegramDocumentId && meta.telegramAccessHash && meta.telegramFileReference) {
        console.log(`telegramDocumentId: ${meta.telegramDocumentId}`);
        console.log(`telegramAccessHash: ${meta.telegramAccessHash}`);
        console.log(`telegramFileReference length: ${meta.telegramFileReference.length}`);
        console.log(`Creating InputDocumentFileLocation...`);
        return new Api.InputDocumentFileLocation({
          id: BigInt(meta.telegramDocumentId) as any,
          accessHash: BigInt(meta.telegramAccessHash) as any,
          fileReference: Buffer.from(meta.telegramFileReference, 'base64'),
          thumbSize: '',
        });
      }
    } catch (err) {
      console.error('[TelegramProvider] Firestore lookup failed:', err);
    }

    // Fallback: old format "channelId_msgId"
    const parts = videoId.split('_');
    if (parts.length >= 2) {
      try {
        const [channelIdStr, msgIdStr] = parts;
        if (!channelIdStr || !msgIdStr) return null;

        const channelId = channelIdStr.match(/^\d+$/) ? "-100" + channelIdStr : channelIdStr;
        const channel = await this.client.getEntity(channelId);
        const messages = await this.client.getMessages(channel, {
          ids: [parseInt(msgIdStr)],
        });

        if (messages.length > 0 && messages[0].media && 'document' in messages[0].media) {
          const doc = messages[0].media.document as Api.Document;
          return new Api.InputDocumentFileLocation({
            id: doc.id,
            accessHash: doc.accessHash,
            fileReference: doc.fileReference,
            thumbSize: '',
          });
        }
      } catch (err) {
        console.error('[TelegramProvider] Error resolving location:', err);
      }
    }
    return null;
  }

  // Get metadata directly from Firestore
  async getMetadata(videoId: string): Promise<FileMetadata> {
    console.log(`[getMetadata] Requested videoId:`, videoId);
    try {
      const meta = await getVideoMetadata(videoId);
      console.log(`[getMetadata] Firestore returned:`, meta);
      if (!meta) {
        console.error(`No Firestore metadata found for`, videoId);
      }
      if (meta) {
        return {
          size: meta.size || 100000000,
          mimeType: meta.mimeType || 'video/mp4',
        };
      }
    } catch (err) {
      console.error('[TelegramProvider] Firestore metadata fetch error:', err);
    }

    // Fallback legacy
    const parts = videoId.split('_');
    if (parts.length >= 2) {
      try {
        const [channelIdStr, msgIdStr] = parts;
        const channelId = channelIdStr.match(/^\d+$/) ? "-100" + channelIdStr : channelIdStr;
        const channel = await this.client.getEntity(channelId);
        const messages = await this.client.getMessages(channel, {
          ids: [parseInt(msgIdStr)],
        });

        if (messages.length > 0 && messages[0].media && 'document' in messages[0].media) {
          const doc = messages[0].media.document as Api.Document;
          return {
            size: doc.size.toJSNumber(),
            mimeType: doc.mimeType,
          };
        }
      } catch (err) {
        console.error('[TelegramProvider] Legacy Metadata fetch error:', err);
      }
    }
    return { size: 100000000, mimeType: 'video/mp4' };
  }

  async resolveLink(link: string): Promise<{ videoId: string, metadata: any }> {
    console.log(`[TelegramProvider] resolveLink() entered for link: ${link}`);
    const match = link.match(/t\.me\/(?:c\/)?([a-zA-Z0-9_-]+)\/(\d+)/);
    if (!match) {
      console.error('[TelegramProvider] Invalid Telegram link format');
      throw new Error('Invalid Telegram link format');
    }

    const channelIdRaw = match[1];
    const msgId = parseInt(match[2]);

    const channelId = channelIdRaw.match(/^\d+$/) ? "-100" + channelIdRaw : channelIdRaw;
    
    console.log(`[TelegramProvider] Before await this.client.getEntity(${channelId})`);
    const channel = await this.client.getEntity(channelId);
    console.log(`[TelegramProvider] After await this.client.getEntity()`);
    
    console.log(`[TelegramProvider] Before await this.client.getMessages() for msgId: ${msgId}`);
    const messages = await this.client.getMessages(channel, { ids: [msgId] });
    console.log(`[TelegramProvider] After await this.client.getMessages(), count: ${messages.length}`);

    if (!messages.length || !messages[0].media || !('document' in messages[0].media)) {
      console.error('[TelegramProvider] Message does not contain a video/document');
      throw new Error('Message does not contain a video/document');
    }

    const doc = messages[0].media.document as Api.Document;
    console.log(`[TelegramProvider] Document extracted from message. docId: ${doc.id}`);
    
    // Extract video attributes
    let duration: number | undefined = undefined;
    let resolution: string | undefined = undefined;
    const videoAttr = doc.attributes.find(a => a.className === 'DocumentAttributeVideo') as Api.DocumentAttributeVideo;
    if (videoAttr) {
      duration = videoAttr.duration || undefined;
      resolution = (videoAttr.w && videoAttr.h) ? `${videoAttr.w}x${videoAttr.h}` : undefined;
    }

    // Cache thumbnail internally
    let hasThumbnail = false;
    if (doc.thumbs && doc.thumbs.length > 0) {
      try {
        console.log(`[TelegramProvider] Before await this.client.downloadMedia() for thumbnail`);
        const thumbBuffer = await this.client.downloadMedia(messages[0], { thumb: 0 });
        console.log(`[TelegramProvider] After await this.client.downloadMedia() for thumbnail`);
        if (thumbBuffer) {
          cache.set(`thumb_${doc.id.toString()}`, thumbBuffer as Buffer);
          hasThumbnail = true;
        }
      } catch (e: any) {
        console.error('[TelegramProvider] Failed to download thumbnail', e);
        if (e.stack) console.error('[TelegramProvider] Thumbnail download stack trace:', e.stack);
      }
    }

    // Generate short internal videoId
    const videoId = `video_${crypto.randomBytes(4).toString('hex')}`;
    const thumbnailPath = hasThumbnail ? `/api/telegram/thumbnail/${doc.id.toString()}` : undefined;

    console.log("[TelegramProvider] Saving metadata to Firestore");
    console.log({
        videoId,
        telegramDocumentId: doc.id.toString(),
        telegramAccessHash: doc.accessHash.toString(),
        telegramMessageId: msgId,
        telegramChannelId: channelIdRaw
    });

    console.log(`[TelegramProvider] Before await saveVideoMetadata()`);
    // Securely store Telegram metadata in Firestore
    await saveVideoMetadata({
      videoId,
      telegramChannelId: channelIdRaw,
      telegramMessageId: msgId.toString(),
      telegramDocumentId: doc.id.toString(),
      telegramAccessHash: doc.accessHash.toString(),
      telegramFileReference: doc.fileReference.toString('base64'),
      telegramDcId: doc.dcId,
      size: doc.size ? doc.size.toJSNumber() : undefined,
      mimeType: doc.mimeType || undefined,
      duration,
      resolution,
      thumbnail: thumbnailPath,
      createdAt: new Date().toISOString(),
      provider: 'telegram'
    });
    console.log("[TelegramProvider] After await saveVideoMetadata() - Firestore save completed successfully");

    const returnPayload = {
      videoId,
      metadata: {
        size: doc.size ? doc.size.toJSNumber() : undefined,
        mimeType: doc.mimeType || undefined,
        duration,
        resolution,
        thumbnail: thumbnailPath,
      }
    };
    console.log(`[TelegramProvider] Returning payload:`, returnPayload);
    // Return ONLY safe metadata to the frontend
    return returnPayload;
  }

  getThumbnail(docId: string): Buffer | null {
    return cache.get(`thumb_${docId}`);
  }

  async getStream(videoId: string, start: number, end: number): Promise<Readable> {
    const location = await this.resolveLocation(videoId);
    if (!location) {
      throw new Error('Video not found or invalid videoId format');
    }

    const stream = new Readable({
      read() {}
    });

    // Start streaming asynchronously
    this.streamData(videoId, location, start, end, stream).catch(err => {
      console.error('[TelegramProvider] Streaming error:', err);
      stream.destroy(err);
    });

    return stream;
  }

  private async streamData(videoId: string, location: Api.TypeInputFileLocation, start: number, end: number, stream: Readable) {
    let currentOffset = start;
    let currentLocation = location;
    let chunkNum = 1;
    
    while (currentOffset <= end) {
      const chunkIndex = Math.floor(currentOffset / this.chunkSize);
      const chunkStart = chunkIndex * this.chunkSize;
      const cacheKey = `${videoId}_chunk_${chunkIndex}`;
      let chunkData = cache.get(cacheKey);

      if (!chunkData) {
        try {
          const downloadStart = Date.now();
          console.log(`[Telegram] GetFile REQUEST: offset=${chunkStart}, limit=${this.chunkSize}, startTimestamp=${downloadStart}`);
          
          const result = await this.client.invoke(new Api.upload.GetFile({
            location: currentLocation,
            offset: chunkStart as any,
            limit: this.chunkSize,
          }));
          
          const downloadFinish = Date.now();
          if (result instanceof Api.upload.File) {
            chunkData = result.bytes;
            cache.set(cacheKey, chunkData);
            console.log(`[Telegram] GetFile SUCCESS: offset=${chunkStart}, returnedBytes=${chunkData.length}, finishTimestamp=${downloadFinish}, elapsed=${downloadFinish - downloadStart}ms`);
          } else {
            throw new Error('Failed to fetch chunk from Telegram');
          }
        } catch (err: any) {
          if (err.message && err.message.includes('FILE_REFERENCE_EXPIRED')) {
            console.log('[TelegramProvider] FILE_REFERENCE_EXPIRED. Attempting to refresh metadata...');
            const meta = await getVideoMetadata(videoId);
            if (meta) {
              const channelId = meta.telegramChannelId.match(/^\d+$/) ? "-100" + meta.telegramChannelId : meta.telegramChannelId;
              const channel = await this.client.getEntity(channelId);
              const messages = await this.client.getMessages(channel, { ids: [parseInt(meta.telegramMessageId)] });
              
              if (messages.length > 0 && messages[0].media && 'document' in messages[0].media) {
                const doc = messages[0].media.document as Api.Document;
                
                meta.telegramFileReference = doc.fileReference.toString('base64');
                await saveVideoMetadata(meta);
                
                currentLocation = new Api.InputDocumentFileLocation({
                  id: doc.id,
                  accessHash: doc.accessHash,
                  fileReference: doc.fileReference,
                  thumbSize: '',
                });
                
                console.log('[TelegramProvider] Metadata refreshed successfully. Retrying chunk.');
                continue;
              }
            }
          }
          console.log(`[Telegram] GetFile ERROR: ${err.message}`);
          throw err;
        }
      }

      const offsetWithinChunk = currentOffset - chunkStart;
      const remainingBytesInRange = end - currentOffset + 1;
      const bytesToExtract = Math.min(chunkData.length - offsetWithinChunk, remainingBytesInRange);
      
      const extractedData = chunkData.slice(offsetWithinChunk, offsetWithinChunk + bytesToExtract) as Buffer;
      const bufferToPush = Buffer.isBuffer(extractedData) ? extractedData : Buffer.from(extractedData);
      
      if (currentOffset === 0) {
        console.log(`[StreamData] First chunk 32 bytes (hex): ${bufferToPush.slice(0, 32).toString('hex')}`);
        // Log explicitly if the MOOV atom is placed at the end of the file.
        // A standard web-optimized MP4 begins with ftyp followed by moov. 
        // We can check if 'moov' appears in the first chunk.
        if (bufferToPush.includes(Buffer.from('moov'))) {
          console.log(`[StreamData] MOOV atom detected near the beginning. Web playback should be optimized.`);
        } else {
          console.log(`[StreamData] WARNING: MOOV atom NOT detected in the first chunk. The MOOV atom might be at the end of the file, which prevents progressive playback until the entire file is downloaded.`);
        }
      }

      const pushTime = Date.now();
      const pushOk = stream.push(bufferToPush);
      
      console.log(`[StreamData] PUSH: chunkNum=${chunkNum}, chunkSize=${bufferToPush.length}, currentOffset=${currentOffset}, timestamp=${pushTime}, pushReturn=${pushOk}`);

      currentOffset += bytesToExtract;
      chunkNum++;

      if (bufferToPush.length === 0) break;
      
      // Removed the stream.once('drain') deadlock. 
      // A Node.js Readable stream does not emit a 'drain' event.
      // Since our requested Range is capped to 4MB max in server.ts, 
      // pushing directly into the Readable buffer synchronously is perfectly safe and highly performant.
    }

    console.log('[StreamData] Stream successfully pushed all requested chunks. Calling stream.push(null).');
    stream.push(null);
  }
}
