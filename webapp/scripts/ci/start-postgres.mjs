import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import net from "node:net";
import { fileURLToPath } from "node:url";
import { URL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

const dataDir = path.join(root, ".pgdata");
const port = Number(process.env.PGPORT || 55432);
const user = process.env.PGUSER || "webapp";
const password = process.env.PGPASSWORD || "webapp";
const db = process.env.PGDATABASE || "webapp_test";

fs.mkdirSync(dataDir, { recursive: true });

// Lazy import so your local dev doesn't need it unless you use it
const { default: pg } = await import("@pg-embed/postgresql");

const instance = pg({
  version: "15.5.0",
  port,
  user,
  password,
  database: db,
  dataDir,
});

// Start Postgres
await instance.start();

// Wait for TCP readiness (defensive)
await new Promise((resolve, reject) => {
  const start = Date.now();
  const timeoutMs = 60_000;
  const tick = () => {
    const sock = net.connect({ host: "127.0.0.1", port }, () => {
      sock.end();
      resolve();
    });
    sock.on("error", () => {
      if (Date.now() - start > timeoutMs)
        reject(new Error("Postgres not reachable"));
      else setTimeout(tick, 500);
    });
  };
  tick();
});

// Emit env exports for the job shell to `source`
const url = new URL(
  `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(password)}@127.0.0.1:${port}/${db}`,
);
process.stdout.write(`export DATABASE_URL=${url.toString()}\n`);
process.stdout.write(
  `export PGHOST=127.0.0.1\nexport PGPORT=${port}\nexport PGUSER=${user}\nexport PGPASSWORD=${password}\nexport PGDATABASE=${db}\n`,
);

// Keep running until the job ends (so Postgres stays up)
process.stderr.write("Postgres started for CI\n");
setInterval(() => {}, 1 << 30);
