import { app as n, ipcMain as s, BrowserWindow as r } from "electron";
import { fileURLToPath as c } from "node:url";
import o from "node:path";
n.name = "Matchi";
process.platform === "win32" && n.setAppUserModelId("Matchi");
const a = o.dirname(c(import.meta.url));
process.env.APP_ROOT = o.join(a, "..");
const i = process.env.VITE_DEV_SERVER_URL, f = o.join(process.env.APP_ROOT, "dist-electron"), l = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = i ? o.join(process.env.APP_ROOT, "public") : l;
let e;
s.on("window-minimize", () => {
  e == null || e.minimize();
});
s.on("window-close", () => {
  e == null || e.close();
});
s.handle("window-toggle-always-on-top", () => {
  if (e) {
    const t = !e.isAlwaysOnTop();
    return e.setAlwaysOnTop(t, "screen-saver"), t;
  }
  return !1;
});
s.handle("window-get-always-on-top", () => e ? e.isAlwaysOnTop() : !1);
function p() {
  e = new r({
    width: 400,
    height: 600,
    resizable: !1,
    frame: !1,
    backgroundColor: "#FFFBDE",
    icon: o.join(process.env.VITE_PUBLIC, "Logo_256.png"),
    webPreferences: {
      preload: o.join(a, "preload.mjs"),
      nodeIntegration: !1,
      contextIsolation: !0
    }
  }), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), i ? e.loadURL(i) : e.loadFile(o.join(l, "index.html"));
}
n.on("window-all-closed", () => {
  process.platform !== "darwin" && (n.quit(), e = null);
});
n.on("activate", () => {
  r.getAllWindows().length === 0 && p();
});
n.whenReady().then(p);
export {
  f as MAIN_DIST,
  l as RENDERER_DIST,
  i as VITE_DEV_SERVER_URL
};
