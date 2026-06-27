import { app, ipcMain, BrowserWindow } from "electron";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs/promises";
app.name = "Matchi";
if (process.platform === "win32") {
  app.setAppUserModelId("Matchi");
}
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
ipcMain.on("window-minimize", () => {
  win == null ? void 0 : win.minimize();
});
ipcMain.on("window-close", () => {
  win == null ? void 0 : win.close();
});
ipcMain.handle("window-toggle-always-on-top", () => {
  if (win) {
    const isTop = !win.isAlwaysOnTop();
    win.setAlwaysOnTop(isTop, "screen-saver");
    return isTop;
  }
  return false;
});
ipcMain.handle("window-get-always-on-top", () => {
  return win ? win.isAlwaysOnTop() : false;
});
ipcMain.on("window-set-mini-mode", (_event, isMini) => {
  if (win) {
    win.setResizable(true);
    if (isMini) {
      win.setSize(220, 310);
    } else {
      win.setSize(400, 600);
    }
    win.setResizable(false);
  }
});
let storageCache = null;
function getStoragePath() {
  return path.join(app.getPath("userData"), "storage.json");
}
async function loadStorageCache() {
  if (storageCache !== null) return storageCache;
  try {
    const filePath = getStoragePath();
    const content = await fs.readFile(filePath, "utf-8");
    storageCache = JSON.parse(content);
  } catch (err) {
    storageCache = {};
  }
  return storageCache || {};
}
async function saveStorageCache() {
  if (storageCache === null) return;
  try {
    const filePath = getStoragePath();
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(storageCache, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to save storage cache to disk:", err);
  }
}
ipcMain.handle("store-get", async (_event, key) => {
  const cache = await loadStorageCache();
  return cache[key] ?? null;
});
ipcMain.handle("store-set", async (_event, key, value) => {
  const cache = await loadStorageCache();
  cache[key] = value;
  await saveStorageCache();
  return true;
});
function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    frame: false,
    transparent: true,
    icon: path.join(process.env.VITE_PUBLIC, "Logo_256.png"),
    webPreferences: {
      preload: path.join(__dirname$1, "preload.mjs"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false
    }
  });
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
