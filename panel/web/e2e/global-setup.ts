import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { exe, freePort, waitForPort, writeStack } from "./stack";

// A real panel in a folder of its own: its settings, its database, tunnels run as child
// processes (no systemd needed), and the `sortun` program that goes with `sortun-panel`.
export default async function globalSetup() {
  const bin = path.resolve(process.env.SORTUN_PANEL_BIN ?? `../../target/debug/sortun-panel${exe}`);
  if (!fs.existsSync(bin)) throw new Error(`build sortun-panel first (cargo build -p sortun -p sortun-panel): ${bin}`);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "sortun-e2e-"));
  const cfg = path.join(root, "panel.toml");
  const port = await freePort();
  execFileSync(bin, ["init", "-c", cfg, "--data-dir", path.join(root, "data"), "--port", String(port)]);
  const sortun = path.join(root, "sortun");
  fs.mkdirSync(sortun);
  const text = fs
    .readFileSync(cfg, "utf8")
    .replace(/^sortun_dir = .*$/m, `sortun_dir = ${JSON.stringify(sortun)}`)
    .replace(/^services = .*$/m, 'services = "process"');
  fs.writeFileSync(cfg, text);
  const secret = /^path = "(.*)"$/m.exec(text)?.[1];
  if (!secret) throw new Error("no secret path in the settings");
  const log = fs.openSync(path.join(root, "panel.log"), "a");
  const child = spawn(bin, ["serve", "-c", cfg], { stdio: ["ignore", log, log] });
  await waitForPort(port);
  writeStack({ base: `https://127.0.0.1:${port}/${secret}/`, cfg, bin, root, pids: [child.pid ?? 0] });
}
