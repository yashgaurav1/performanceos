import { execSync } from "child_process";

try {
  execSync("npx tsx scripts/check-consistency-core.ts", {
    stdio: "inherit",
    env: { ...process.env, CHECK_CONSISTENCY_INNER: "1" },
  });
  process.exit(0);
} catch {
  process.exit(1);
}
