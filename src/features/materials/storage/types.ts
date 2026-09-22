export type StoredObject = {
  bytes: Uint8Array;
  contentType?: string;
};

export interface PrivateObjectStorage {
  put(key: string, bytes: Uint8Array, contentType: string): Promise<void>;
  get(key: string): Promise<StoredObject>;
  delete(key: string): Promise<void>;
}
