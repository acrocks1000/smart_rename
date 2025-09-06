// preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

console.log("[preload] loaded");

contextBridge.exposeInMainWorld("api", {
  selectFolder: () => ipcRenderer.invoke("select-folder"),
  scanFolder: (opts) => ipcRenderer.invoke("scan-folder", opts),
  applyRenames: (items) => ipcRenderer.invoke("apply-renames", items),

  // Backups
  pickBackup: () => ipcRenderer.invoke("pick-backup"),
  revertRenames: (backupPath) =>
    ipcRenderer.invoke("revert-renames", backupPath),
  readBackup: (backupPath) => ipcRenderer.invoke("read-backup", backupPath),
  revertSelected: (items) => ipcRenderer.invoke("revert-selected", items),

  ping: () => "pong",
});
