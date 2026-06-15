import { app as a, ipcMain as r, BrowserWindow as d } from "electron";
import { fileURLToPath as g } from "node:url";
import o from "node:path";
import i from "node:fs/promises";
a.name = "Matchi";
process.platform === "win32" && a.setAppUserModelId("Matchi");
const p = o.dirname(g(import.meta.url));
process.env.APP_ROOT = o.join(p, "..");
const l = process.env.VITE_DEV_SERVER_URL, E = o.join(process.env.APP_ROOT, "dist-electron"), f = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = l ? o.join(process.env.APP_ROOT, "public") : f;
let e;
r.on("window-minimize", () => {
  e == null || e.minimize();
});
r.on("window-close", () => {
  e == null || e.close();
});
r.handle("window-toggle-always-on-top", () => {
  if (e) {
    const n = !e.isAlwaysOnTop();
    return e.setAlwaysOnTop(n, "screen-saver"), n;
  }
  return !1;
});
r.handle("window-get-always-on-top", () => e ? e.isAlwaysOnTop() : !1);
let t = null;
function u() {
  return o.join(a.getPath("userData"), "storage.json");
}
async function w() {
  if (t !== null) return t;
  try {
    const n = u(), s = await i.readFile(n, "utf-8");
    t = JSON.parse(s);
  } catch {
    t = {};
  }
  return t || {};
}
async function _() {
  if (t !== null)
    try {
      const n = u();
      await i.mkdir(o.dirname(n), { recursive: !0 }), await i.writeFile(n, JSON.stringify(t, null, 2), "utf-8");
    } catch (n) {
      console.error("Failed to save storage cache to disk:", n);
    }
}
r.handle("store-get", async (n, s) => (await w())[s] ?? null);
r.handle("store-set", async (n, s, c) => {
  const m = await w();
  return m[s] = c, await _(), !0;
});
function h() {
  e = new d({
    width: 400,
    height: 600,
    resizable: !1,
    frame: !1,
    backgroundColor: "#FFFBDE",
    icon: o.join(process.env.VITE_PUBLIC, "Logo_256.png"),
    webPreferences: {
      preload: o.join(p, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), l ? e.loadURL(l) : e.loadFile(o.join(f, "index.html"));
}
a.on("window-all-closed", () => {
  process.platform !== "darwin" && (a.quit(), e = null);
});
a.on("activate", () => {
  d.getAllWindows().length === 0 && h();
});
a.whenReady().then(h);
export {
  E as MAIN_DIST,
  f as RENDERER_DIST,
  l as VITE_DEV_SERVER_URL
};
