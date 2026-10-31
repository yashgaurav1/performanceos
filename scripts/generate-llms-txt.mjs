import { execSync } from "child_process";

try {
  execSync("npx tsx scripts/generate-llms-txt-core.ts", {
    stdio: "inherit",
  });
  process.exit(0);
} catch {
  process.exit(1);
}
