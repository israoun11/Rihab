// Starts the API (tsx watch) and the Vite dev server side by side.
import { spawn } from "node:child_process";

const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const procs = [
  spawn(npm, ["run", "dev", "-w", "server"], { stdio: "inherit", shell: process.platform === "win32" }),
  spawn(npm, ["run", "dev", "-w", "client"], { stdio: "inherit", shell: process.platform === "win32" }),
];
const stop = () => { for (const p of procs) p.kill("SIGTERM"); process.exit(0); };
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
for (const p of procs) p.on("exit", (code) => { if (code) { console.error("Un processus s'est arrêté (code " + code + ")."); stop(); } });
