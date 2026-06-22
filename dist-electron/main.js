import { app as s, ipcMain as r, BrowserWindow as d } from "electron";
import { fileURLToPath as g } from "node:url";
import n from "node:path";
import i from "node:fs/promises";
s.name = "Matchi";
process.platform === "win32" && s.setAppUserModelId("Matchi");
const f = n.dirname(g(import.meta.url));
process.env.APP_ROOT = n.join(f, "..");
const l = process.env.VITE_DEV_SERVER_URL, y = n.join(process.env.APP_ROOT, "dist-electron"), p = n.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = l ? n.join(process.env.APP_ROOT, "public") : p;
let e;
r.on("window-minimize", () => {
  e == null || e.minimize();
});
r.on("window-close", () => {
  e == null || e.close();
});
r.handle("window-toggle-always-on-top", () => {
  if (e) {
    const t = !e.isAlwaysOnTop();
    return e.setAlwaysOnTop(t, "screen-saver"), t;
  }
  return !1;
});
r.handle("window-get-always-on-top", () => e ? e.isAlwaysOnTop() : !1);
r.on("window-set-mini-mode", (t, o) => {
  e && (e.setResizable(!0), o ? e.setSize(220, 310) : e.setSize(400, 600), e.setResizable(!1));
});
let a = null;
function u() {
  return n.join(s.getPath("userData"), "storage.json");
}
async function w() {
  if (a !== null) return a;
  try {
    const t = u(), o = await i.readFile(t, "utf-8");
    a = JSON.parse(o);
  } catch {
    a = {};
  }
  return a || {};
}
async function _() {
  if (a !== null)
    try {
      const t = u();
      await i.mkdir(n.dirname(t), { recursive: !0 }), await i.writeFile(t, JSON.stringify(a, null, 2), "utf-8");
    } catch (t) {
      console.error("Failed to save storage cache to disk:", t);
    }
}
r.handle("store-get", async (t, o) => (await w())[o] ?? null);
r.handle("store-set", async (t, o, c) => {
  const m = await w();
  return m[o] = c, await _(), !0;
});
function h() {
  e = new d({
    width: 400,
    height: 600,
    resizable: !1,
    frame: !1,
    transparent: !0,
    icon: n.join(process.env.VITE_PUBLIC, "Logo_256.png"),
    webPreferences: {
      preload: n.join(f, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0,
      backgroundThrottling: !1
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), l ? e.loadURL(l) : e.loadFile(n.join(p, "index.html"));
}
s.on("window-all-closed", () => {
  process.platform !== "darwin" && (s.quit(), e = null);
});
s.on("activate", () => {
  d.getAllWindows().length === 0 && h();
});
s.whenReady().then(h);
export {
  y as MAIN_DIST,
  p as RENDERER_DIST,
  l as VITE_DEV_SERVER_URL
};
