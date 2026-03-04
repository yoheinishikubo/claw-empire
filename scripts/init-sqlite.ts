import fs from "node:fs";
import path from "node:path";
import { createRunInTransaction, nowMs } from "../server/modules/bootstrap/helpers";
import { applyBaseSchema } from "../server/modules/bootstrap/schema/base-schema";
import { initializeOAuthRuntime } from "../server/modules/bootstrap/schema/oauth-runtime";
import { applyDefaultSeeds } from "../server/modules/bootstrap/schema/seeds";
import { applyTaskSchemaMigrations } from "../server/modules/bootstrap/schema/task-schema-migrations";
import { initializeDatabaseRuntime } from "../server/db/runtime";

type Options = {
  dbPath: string;
  help: boolean;
};

const DEFAULT_DB_PATH = "./claw-empire.sqlite";
const SUFFIXES = ["", "-wal", "-shm"];

function parseArgs(argv: string[]): Options {
  const result: Options = { dbPath: DEFAULT_DB_PATH, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      result.help = true;
      return result;
    }
    if (arg === "--db-path" && argv[i + 1]) {
      result.dbPath = argv[++i] as string;
      continue;
    }
    console.error(`Unknown option: ${arg}`);
    result.help = true;
    return result;
  }
  return result;
}

function printUsage(): void {
  console.log("Usage: pnpm tsx scripts/init-sqlite.ts [--db-path <path>] [--help]");
  console.log("Reset the runtime sqlite files and reapply schema/seeds.");
  console.log("If the database already exists, the files are removed before recreation.");
  console.log("Default path: ./claw-empire.sqlite (creates WAL/SHM alongside it)");
}

function removeExistingFiles(resolvedPath: string): string[] {
  if (!resolvedPath) return [];
  const dir = path.dirname(resolvedPath);
  if (dir && dir !== ".") {
    fs.mkdirSync(dir, { recursive: true });
  }

  const removed: string[] = [];
  for (const suffix of SUFFIXES) {
    const candidate = resolvedPath + suffix;
    if (fs.existsSync(candidate)) {
      fs.rmSync(candidate, { force: true });
      removed.push(candidate);
    }
  }
  return removed;
}

async function main(): Promise<void> {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    printUsage();
    return;
  }

  const normalizedDbPath = path.resolve(process.cwd(), options.dbPath);
  if (normalizedDbPath === "" || normalizedDbPath === null) {
    throw new Error("Cannot resolve sqlite path");
  }

  const removedFiles = removeExistingFiles(normalizedDbPath);
  if (removedFiles.length > 0) {
    console.log("Removed existing sqlite files:");
    for (const removed of removedFiles) {
      console.log(`  - ${removed}`);
    }
  } else {
    console.log("No existing sqlite artifacts found.");
  }

  process.env.DB_PATH = normalizedDbPath;

  const runtime = initializeDatabaseRuntime();
  const db = runtime.db;
  const runInTransaction = createRunInTransaction(db);

  try {
    console.log("Applying schema and seeds...");
    applyBaseSchema(db);
    initializeOAuthRuntime({ db, nowMs, runInTransaction });
    applyTaskSchemaMigrations(db);
    applyDefaultSeeds(db);
    console.log(`Database initialized at: ${runtime.dbPath}`);
  } finally {
    db.close();
  }
}

main().catch((error) => {
  console.error("Failed to initialize sqlite database:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
