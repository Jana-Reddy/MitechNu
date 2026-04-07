import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "node:child_process";

const [, , ...args] = process.argv;

if (!args.length) {
  console.error("Usage: node scripts/run-with-app-env.mjs <command> [...args]");
  process.exit(1);
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(".env.local"));
loadEnvFile(resolve("apps/web/.env.local"));

const executable = (() => {
  if (args[0].includes("/") || args[0].includes("\\")) {
    return args[0];
  }

  const localBin = resolve(
    "node_modules",
    ".bin",
    process.platform === "win32" ? `${args[0]}.cmd` : args[0]
  );

  return existsSync(localBin) ? localBin : args[0];
})();

const child = process.platform === "win32"
  ? spawn("cmd.exe", ["/d", "/s", "/c", executable, ...args.slice(1)], {
      stdio: "inherit",
      shell: false,
      env: process.env
    })
  : spawn(executable, args.slice(1), {
      stdio: "inherit",
      shell: false,
      env: process.env
    });

child.on("exit", (code) => {
  process.exit(code ?? 1);
});
