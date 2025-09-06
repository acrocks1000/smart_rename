import { app, BrowserWindow, ipcMain, dialog } from "electron";
import path from "node:path";
import fs from "node:fs/promises";
import fssync from "node:fs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
    height: 750,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    title: "Smart Renamer",
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
}

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ---- Helpers ----
async function listFilesRecursive(dir, recursive) {
  const out = [];
  async function walk(current) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        if (recursive) await walk(full);
      } else if (e.isFile()) {
        out.push(full);
      }
    }
  }
  await walk(dir);
  return out;
}
function commonDir(dirs) {
  if (!dirs.length) return null;
  const parts = dirs.map((d) => path.resolve(d).split(path.sep));
  const minLen = Math.min(...parts.map((p) => p.length));
  const out = [];
  for (let i = 0; i < minLen; i++) {
    const seg = parts[0][i];
    if (parts.every((p) => p[i] === seg)) out.push(seg);
    else break;
  }
  return out.length ? out.join(path.sep) : path.resolve(dirs[0]);
}

// ---- IPC ----
ipcMain.handle("select-folder", async () => {
  console.log("[main] select-folder invoked");
  const res = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (res.canceled || !res.filePaths?.[0]) return null;
  return res.filePaths[0];
});

ipcMain.handle("scan-folder", async (evt, { dir, recursive }) => {
  if (!dir) return [];
  const files = await listFilesRecursive(dir, recursive);
  return files.map((full) => ({
    full,
    base: path.basename(full),
    dir: path.dirname(full),
  }));
});

// Apply renames + auto-backup (from→to)
ipcMain.handle("apply-renames", async (evt, payload) => {
  const plan = payload
    .filter((x) => x?.dir && x?.base && x?.proposed && x.base !== x.proposed)
    .map((x) => {
      const from = path.join(x.dir, x.base);
      const to = path.join(x.dir, x.proposed);
      return { dir: x.dir, from, to };
    });

  let backupPath = null;
  if (plan.length) {
    const root = commonDir(plan.map((p) => p.dir)) || plan[0].dir;
    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `.smart-renamer-backup-${ts}.json`;
    backupPath = path.join(root, filename);
    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      items: plan.map((p) => ({ from: p.from, to: p.to })),
    };
    await fs.writeFile(backupPath, JSON.stringify(backup, null, 2), "utf8");
    console.log("[backup] wrote", backupPath);
  }

  const results = [];
  for (const p of plan) {
    try {
      if (fssync.existsSync(p.to)) throw new Error("Target already exists");
      await fs.rename(p.from, p.to);
      results.push({
        ok: true,
        from: p.from,
        to: p.to,
        dir: p.dir,
        backupPath,
      });
    } catch (e) {
      results.push({
        ok: false,
        from: p.from,
        to: p.to,
        dir: p.dir,
        error: e.message,
        backupPath,
      });
    }
  }
  return results;
});

// Pick backup file
ipcMain.handle("pick-backup", async () => {
  const res = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [{ name: "JSON", extensions: ["json"] }],
  });
  if (res.canceled || !res.filePaths?.[0]) return null;
  return res.filePaths[0];
});

// Full revert (to→from) from backup file
ipcMain.handle("revert-renames", async (evt, backupPath) => {
  const results = [];
  try {
    if (!backupPath) throw new Error("No backup path provided");
    const raw = await fs.readFile(backupPath, "utf8");
    const data = JSON.parse(raw);
    if (!Array.isArray(data.items)) throw new Error("Invalid backup format");

    for (const item of [...data.items].reverse()) {
      const { from, to } = item;
      try {
        if (!to || !from) throw new Error("Invalid mapping");
        if (!fssync.existsSync(to))
          throw new Error("Target to restore from not found");
        if (fssync.existsSync(from))
          throw new Error("Original name already exists");
        await fs.rename(to, from);
        results.push({ ok: true, restoredFrom: to, restoredTo: from });
      } catch (e) {
        results.push({
          ok: false,
          restoredFrom: to,
          restoredTo: from,
          error: e.message,
        });
      }
    }
  } catch (e) {
    results.push({ ok: false, error: e.message });
  }
  return results;
});

// Read backup JSON (for preview)
ipcMain.handle("read-backup", async (evt, backupPath) => {
  const raw = await fs.readFile(backupPath, "utf8");
  const data = JSON.parse(raw);
  if (!Array.isArray(data.items)) throw new Error("Invalid backup format");
  return data; // {version, createdAt, items:[{from,to}]}
});

// Revert only selected backup items
ipcMain.handle("revert-selected", async (evt, items) => {
  const results = [];
  if (!Array.isArray(items) || !items.length) return results;

  for (const item of [...items].reverse()) {
    const { from, to } = item;
    try {
      if (!to || !from) throw new Error("Invalid mapping");
      if (!fssync.existsSync(to))
        throw new Error("Target to restore from not found");
      if (fssync.existsSync(from))
        throw new Error("Original name already exists");
      await fs.rename(to, from);
      results.push({ ok: true, restoredFrom: to, restoredTo: from });
    } catch (e) {
      results.push({
        ok: false,
        restoredFrom: to,
        restoredTo: from,
        error: e.message,
      });
    }
  }
  return results;
});
