import { LRUCache } from 'lru-cache';
import * as fs from 'fs';
import * as path from 'path';

export class ChunkCache {
  private l1Cache: LRUCache<string, Buffer>;
  private l2Dir: string;

  constructor(l2Dir: string = './cache_data') {
    this.l2Dir = l2Dir;
    
    // Ensure L2 directory exists
    if (!fs.existsSync(this.l2Dir)) {
      fs.mkdirSync(this.l2Dir, { recursive: true });
    }

    // L1 Cache: Max 200 items (assuming 1MB chunks, that's 200MB max RAM)
    this.l1Cache = new LRUCache<string, Buffer>({
      max: 200,
      dispose: (value, key) => {
        // When evicted from L1, save to L2 if not already there
        this.writeToL2(key, value);
      }
    });
  }

  private getL2Path(key: string): string {
    return path.join(this.l2Dir, `${key}.chunk`);
  }

  private writeToL2(key: string, data: Buffer) {
    const l2Path = this.getL2Path(key);
    if (!fs.existsSync(l2Path)) {
      fs.writeFile(l2Path, data, (err) => {
        if (err) console.error(`[Cache] Failed to write L2 cache for ${key}:`, err);
      });
    }
  }

  public get(key: string): Buffer | null {
    // Check L1
    const l1Data = this.l1Cache.get(key);
    if (l1Data) return l1Data;

    // Check L2
    const l2Path = this.getL2Path(key);
    if (fs.existsSync(l2Path)) {
      try {
        const l2Data = fs.readFileSync(l2Path);
        // Promote back to L1
        this.l1Cache.set(key, l2Data);
        return l2Data;
      } catch (err) {
        console.error(`[Cache] Failed to read L2 cache for ${key}:`, err);
        return null;
      }
    }

    return null;
  }

  public set(key: string, data: Buffer): void {
    this.l1Cache.set(key, data);
  }
}

export const cache = new ChunkCache();
