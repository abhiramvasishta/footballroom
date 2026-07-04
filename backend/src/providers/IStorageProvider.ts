import { Readable } from 'stream';

export interface FileMetadata {
  size: number;
  mimeType: string;
}

export interface IStorageProvider {
  /**
   * Initialize or authenticate the provider.
   */
  init(): Promise<void>;

  /**
   * Get metadata for a file.
   */
  getMetadata(fileId: string): Promise<FileMetadata>;

  /**
   * Get a readable stream for a specific byte range.
   */
  getStream(fileId: string, start: number, end: number): Promise<Readable>;
}
