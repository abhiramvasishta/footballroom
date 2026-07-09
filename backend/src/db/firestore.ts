import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { LRUCache } from 'lru-cache';

// Load from environment variables (compatible with Vercel and local .env)
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
// Fix private key formatting from env
const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

let credential;

if (process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  try {
    const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_JSON || '';
    const parsedSA = JSON.parse(jsonStr);
    console.log('[Firestore] Parsed FIREBASE_SERVICE_ACCOUNT keys:', Object.keys(parsedSA));
    credential = cert(parsedSA);
    console.log('[Firestore] Initialized via FIREBASE_SERVICE_ACCOUNT JSON.');
  } catch (e) {
    console.error('[Firestore] Failed to parse FIREBASE_SERVICE_ACCOUNT JSON', e);
  }
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS && process.env.GOOGLE_APPLICATION_CREDENTIALS.startsWith('{')) {
  try {
    const parsedSA = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
    console.log('[Firestore] Parsed GOOGLE_APPLICATION_CREDENTIALS keys:', Object.keys(parsedSA));
    credential = cert(parsedSA);
    console.log('[Firestore] Initialized via GOOGLE_APPLICATION_CREDENTIALS JSON string.');
  } catch (e) {
    console.error('[Firestore] Failed to parse GOOGLE_APPLICATION_CREDENTIALS JSON', e);
  }
} else if (clientEmail && privateKey) {
  credential = cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  });
  console.log('[Firestore] Initialized via separated Service Account credentials.');
} else {
  console.warn('[Firestore] Warning: Firebase Admin env vars missing. Attempting to use default credentials.');
  credential = applicationDefault();
}

if (getApps().length === 0 && credential) {
  try {
    const appOptions: any = { credential };
    if (projectId) {
      appOptions.projectId = projectId;
    }
    initializeApp(appOptions);
  } catch (e) {
    console.error('[Firestore] Failed to initialize Firebase Admin', e);
  }
}

const db = getApps().length > 0 ? getFirestore() : null;

export interface TelegramVideoMetadata {
  videoId: string;
  telegramDocumentId: string;
  telegramAccessHash: string;
  telegramFileReference: string; // Base64
  telegramDcId: number;
  telegramChannelId: string;
  telegramMessageId: string;
  mimeType?: string;
  size?: number;
  duration?: number;
  resolution?: string;
  thumbnail?: string;
  createdAt: string;
  provider: 'telegram';
}

// In-memory cache to prevent repeated Firestore reads for active streams
const metadataCache = new LRUCache<string, TelegramVideoMetadata>({
  max: 1000,
  ttl: 1000 * 60 * 60, // 1 hour
});

export const saveVideoMetadata = async (metadata: TelegramVideoMetadata): Promise<void> => {
  if (!db) throw new Error('Firestore not initialized');
  
  // Clean undefined values so Firestore doesn't crash
  const sanitizedData = Object.fromEntries(
    Object.entries(metadata).filter(([_, v]) => v !== undefined)
  );

  console.log('[Firestore] Saving document:', JSON.stringify(sanitizedData, null, 2));

  await db.collection('videos').doc(metadata.videoId).set(sanitizedData);
  metadataCache.set(metadata.videoId, metadata);
};

export const getVideoMetadata = async (videoId: string): Promise<TelegramVideoMetadata | null> => {
  if (!db) throw new Error('Firestore not initialized');
  
  const cached = metadataCache.get(videoId);
  if (cached) return cached;

  const doc = await db.collection('videos').doc(videoId).get();
  if (!doc.exists) return null;

  const data = doc.data() as TelegramVideoMetadata;
  metadataCache.set(videoId, data);
  return data;
};

// Export raw db if needed for direct queries
export { db };
