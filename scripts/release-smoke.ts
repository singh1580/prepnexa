const baseUrl = (process.env.QA_BASE_URL ?? "http://localhost:3000").replace(/\/$/, "");
const maximumLatencyMs = Number(process.env.QA_MAX_LATENCY_MS ?? 5_000);

const publicRoutes = ["/", "/exams", "/packages", "/free-tests", "/login", "/signup", "/forgot-password", "/api/health", "/api/ready"];
const protectedRoutes = ["/dashboard", "/admin"];

async function request(path: string, expected: number | number[]) {
  try {
    const started = performance.now();
    const response = await fetch(`${baseUrl}${path}`, { redirect: "manual", signal: AbortSignal.timeout(30_000) });
    const elapsed = Math.round(performance.now() - started);
    const statuses = Array.isArray(expected) ? expected : [expected];
    const statusOk = statuses.includes(response.status);
    const latencyOk = elapsed <= maximumLatencyMs;
    const securityOk = response.headers.get("x-content-type-options") === "nosniff" && response.headers.get("x-frame-options") === "DENY";
    const location = response.headers.get("location");
    const redirectOk = response.status < 300 || response.status >= 400 || Boolean(location?.startsWith("/login"));
    const passed = statusOk && latencyOk && securityOk && redirectOk;
    console.log(`${passed ? "✓" : "✗"} ${path.padEnd(22)} ${response.status} ${elapsed}ms${location ? ` → ${location}` : ""}`);
    if (!passed) process.exitCode = 1;
  } catch (error) {
    console.log(`✗ ${path.padEnd(22)} ${error instanceof Error ? error.message : "request failed"}`);
    process.exitCode = 1;
  }
}

async function main() {
  console.log(`\nPrepNexa HTTP smoke check: ${baseUrl}\n`);
  try {
    await fetch(`${baseUrl}/api/ready`, { signal: AbortSignal.timeout(30_000) });
    for (const route of publicRoutes) await request(route, 200);
    for (const route of protectedRoutes) await request(route, [302, 303, 307, 308]);
  } catch (error) {
    console.error(`✗ App is unreachable: ${error instanceof Error ? error.message : "request failed"}`);
    process.exitCode = 1;
  }
  console.log(process.exitCode ? "\nSmoke check failed.\n" : "\nSmoke check passed. Continue with the manual Student/Admin workflow.\n");
}

void main();
