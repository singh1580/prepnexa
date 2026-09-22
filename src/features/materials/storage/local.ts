import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PrivateObjectStorage } from "./types";

export class LocalPrivateStorage implements PrivateObjectStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  private resolve(key: string) {
    const target = path.resolve(this.root, key);
    if (target !== this.root && !target.startsWith(`${this.root}${path.sep}`)) throw new Error("Unsafe storage key.");
    return target;
  }

  async put(key: string, bytes: Uint8Array) {
    const target = this.resolve(key);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }

  async get(key: string) {
    return { bytes: await readFile(this.resolve(key)) };
  }

  async delete(key: string) {
    await rm(this.resolve(key), { force: true });
  }
}
