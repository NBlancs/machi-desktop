import { app, BrowserWindow, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs/promises'

// Set app name and App User Model ID for Windows Notifications
app.name = 'Matchi'
if (process.platform === 'win32') {
  app.setAppUserModelId('Matchi')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))



// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

// Register IPC handlers once
ipcMain.on('window-minimize', () => {
  win?.minimize()
})

ipcMain.on('window-close', () => {
  win?.close()
})

ipcMain.handle('window-toggle-always-on-top', () => {
  if (win) {
    const isTop = !win.isAlwaysOnTop()
    win.setAlwaysOnTop(isTop, 'screen-saver') // keeps it on top of most windows
    return isTop
  }
  return false
})

ipcMain.handle('window-get-always-on-top', () => {
  return win ? win.isAlwaysOnTop() : false
})

// IPC storage handlers for persistence
let storageCache: Record<string, any> | null = null

function getStoragePath() {
  return path.join(app.getPath('userData'), 'storage.json')
}

async function loadStorageCache(): Promise<Record<string, any>> {
  if (storageCache !== null) return storageCache
  try {
    const filePath = getStoragePath()
    const content = await fs.readFile(filePath, 'utf-8')
    storageCache = JSON.parse(content)
  } catch (err: any) {
    storageCache = {}
  }
  return storageCache || {}
}

async function saveStorageCache() {
  if (storageCache === null) return
  try {
    const filePath = getStoragePath()
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, JSON.stringify(storageCache, null, 2), 'utf-8')
  } catch (err) {
    console.error('Failed to save storage cache to disk:', err)
  }
}

ipcMain.handle('store-get', async (_event, key: string) => {
  const cache = await loadStorageCache()
  return cache[key] ?? null
})

ipcMain.handle('store-set', async (_event, key: string, value: any) => {
  const cache = await loadStorageCache()
  cache[key] = value
  await saveStorageCache()
  return true
})

function createWindow() {
  win = new BrowserWindow({
    width: 400,
    height: 600,
    resizable: false,
    frame: false,
    backgroundColor: '#FFFBDE',
    icon: path.join(process.env.VITE_PUBLIC, 'Logo_256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.whenReady().then(createWindow)

