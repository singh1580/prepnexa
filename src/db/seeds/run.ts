import { seedRbac } from "./rbac";

async function main() {
  await seedRbac();
  console.info("RBAC seed completed.");
}

main().catch((error) => {
  console.error("RBAC seed failed.", error instanceof Error ? error.message : "Unknown error");
  process.exitCode = 1;
});
