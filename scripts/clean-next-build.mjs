import { rm } from "node:fs/promises";
import { resolve } from "node:path";

const buildDirectory = resolve(process.cwd(), ".next");

await rm(buildDirectory, { recursive: true, force: true });
console.log("Cleared the previous Next.js build output.");
