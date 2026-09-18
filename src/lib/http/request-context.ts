import { headers } from "next/headers";

export async function getRequestId() {
  return (await headers()).get("x-request-id") ?? crypto.randomUUID();
}
