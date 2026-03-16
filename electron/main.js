import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog } from 'electron'
import { createRequire } from 'module'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import DiscordRPC from 'discord-rpc'
import { Buffer } from 'buffer'
import fs from 'fs'
import process from 'process'

const clientId = '1480805181405925427' // from discord.com/developers
DiscordRPC.register(clientId)
const rpc = new DiscordRPC.Client({ transport: 'ipc' })

const require = createRequire(
    import.meta.url)
const __filename = fileURLToPath(
    import.meta.url)
const __dirname = dirname(__filename)

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow = null
let tray = null
let logStream = null

ipcMain.on('set-discord-activity', async(event, tabName) => {
    if (!rpc) return

    await rpc.setActivity({
        details: `Editing ${tabName || 'Untitled tab'}`,
        state: 'Synapse V3',
        largeImageKey: 'logo',
        largeImageText: 'Synapse V3',
        startTimestamp: new Date(),
        instance: false,
    })
})

rpc.login({ clientId }).catch(console.error)

// ─── CONSOLE LOG TO FILE ─────────────────────────────────────────────────────
function startLogFile() {
    const logPath = join(app.getPath('userData'), 'console.log')
    logStream = fs.createWriteStream(logPath, { flags: 'a' })
    logStream.write(`\n--- Session started: ${new Date().toISOString()} ---\n`)
}

function stopLogFile() {
    if (logStream) {
        logStream.end()
        logStream = null
    }
}

// ─── TRAY ─────────────────────────────────────────────────────────────────────
function buildTrayIcon() {
    // Must be PNG -- SVG is NOT supported by nativeImage.
    // DO NOT call .resize() -- it blurs via bilinear downsampling.
    // Supply tray.png (16x16) AND tray@2x.png (32x32) side by side in public/assets/.
    // Electron auto-picks tray@2x.png on Retina, giving a crisp result.
    // setTemplateImage(true) = macOS inverts black pixels for dark/light menu bar.
    const base = isDev ?
        join(__dirname, '../public/assets') :
        join(process.resourcesPath, 'assets')

    let icon
    try {
        icon = nativeImage.createFromPath(join(base, 'tray.png'))
        if (icon.isEmpty()) throw new Error('file not found or unreadable')
    } catch (err) {
        console.warn('[Tray] Icon load failed:', err.message)
        icon = nativeImage.createEmpty()
    }
    icon.setTemplateImage(true)
    return icon
}

function hideToTray() {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.hide()
    if (process.platform === 'darwin') app.dock.hide()
}

function showWindow() {
    if (!mainWindow || mainWindow.isDestroyed()) return
    mainWindow.show()
    mainWindow.focus()
    if (process.platform === 'darwin') app.dock.show()
}

function buildContextMenu() {
    return Menu.buildFromTemplate([{
            label: 'Show Synapse X',
            click: () => showWindow(),
        },
        { type: 'separator' },
        {
            label: 'Quit',
            click: () => {
                app.isQuitting = true
                app.quit()
            },
        },
    ])
}

function createTray() {
    if (tray) return

    tray = new Tray(buildTrayIcon())
    tray.setToolTip('Synapse X')
    tray.setContextMenu(buildContextMenu())

    // Left-click: toggle window visibility
    tray.on('click', () => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
            hideToTray()
        } else {
            showWindow()
        }
    })
}

function destroyTray() {
    if (tray) {
        tray.destroy()
        tray = null
    }
}

// ─── CREATE WINDOW ────────────────────────────────────────────────────────────
function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 820,
        minWidth: 600,
        minHeight: 400,
        useContentSize: true,
        frame: false,
        transparent: false,
        backgroundColor: '#1c1917',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, 'preload.cjs'),
        },
    })

    if (isDev) {
        mainWindow.loadURL('http://localhost:5173')
        mainWindow.webContents.openDevTools({ mode: 'detach' })
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    // When the window is actually destroyed, null the reference so tray
    // click handler doesn't call methods on a destroyed object
    mainWindow.on('destroyed', () => {
        mainWindow = null
    })

    // OS minimize button → hide to tray instead (only if tray exists)
    mainWindow.on('minimize', (e) => {
        if (tray) {
            e.preventDefault()
            hideToTray()
        }
    })

    // Close event handler
    mainWindow.on('close', (e) => {
        // Real quit in progress — let it through
        if (app.isQuitting) return

        // Tray active — hide instead of closing
        if (tray) {
            e.preventDefault()
            mainWindow.hide()
            if (process.platform === 'darwin') app.dock.hide()
            return
        }

        // No tray — confirm quit
        e.preventDefault()
        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['Quit', 'Cancel'],
            defaultId: 1,
            cancelId: 1,
            title: 'Quit Synapse X',
            message: 'Are you sure you want to quit?',
        })
        if (choice === 0) {
            app.isQuitting = true
            app.quit()
        }
    })
}

// ─── DEEP LINK (synx://) ──────────────────────────────────────────────────────
// Register as the handler for synx:// URLs.
// On Windows/Linux this uses the second-instance event.
// On macOS this uses the open-url event.
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('synx', process.execPath, [process.argv[1]])
    }
} else {
    app.setAsDefaultProtocolClient('synx')
}

// Windows/Linux: a second instance is launched with the URL as an argv entry.
// We close the second instance and forward the URL to the first.
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
    app.quit()
} else {
    app.on('second-instance', (_event, argv) => {
        const url = argv.find(a => a.startsWith('synx://'))
        if (url) handleDeepLink(url)
        if (mainWindow) showWindow()
    })
}

function handleDeepLink(url) {
    // url shape: synx://add-bookmark/<base64-encoded-JSON>
    // JSON payload: { name: string, uri: string }
    if (!mainWindow || mainWindow.isDestroyed()) return
    try {
        const withoutScheme = url.replace(/^synx:\/\//, '')
        const slashIdx = withoutScheme.indexOf('/')
        const command = slashIdx === -1 ? withoutScheme : withoutScheme.slice(0, slashIdx)
        const payload = slashIdx === -1 ? '' : withoutScheme.slice(slashIdx + 1)

        if (command === 'add-bookmark') {
            const json = Buffer.from(payload, 'base64').toString('utf8')
            const data = JSON.parse(json)
            mainWindow.webContents.send('deeplink:add-bookmark', data)
            showWindow()
        }
    } catch (err) {
        console.error('[DeepLink] Failed to handle URL:', url, err.message)
    }
}

// ─── APP LIFECYCLE ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
    createWindow()
        // Create tray on startup — matches React default useState(true)
    createTray()

    // macOS: open-url fires when the app is already running
    app.on('open-url', (event, url) => {
        event.preventDefault()
        handleDeepLink(url)
    })

    // macOS: clicking the dock icon while the window is hidden should restore it
    app.on('activate', () => {
        if (mainWindow) showWindow()
        else createWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
    app.isQuitting = true
    stopLogFile()
})

// ─── IPC HANDLERS ─────────────────────────────────────────────────────────────

// ─── CONSOLE WINDOW ───────────────────────────────────────────────────────────
let consoleWindow = null

ipcMain.on('console:open', () => {
    if (consoleWindow && !consoleWindow.isDestroyed()) {
        consoleWindow.focus()
        return
    }
    consoleWindow = new BrowserWindow({
        width: 800,
        height: 500,
        minWidth: 400,
        minHeight: 200,
        title: 'Console',
        frame: false,
        backgroundColor: '#1c1917',
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: join(__dirname, 'preload.cjs'),
        },
    })
    if (isDev) {
        consoleWindow.loadURL('http://localhost:5173/?window=console')
    } else {
        consoleWindow.loadFile(join(__dirname, '../dist/Console.html'))
    }
    consoleWindow.on('closed', () => { consoleWindow = null })
})

ipcMain.on('console:minimize', () => { if (consoleWindow && !consoleWindow.isDestroyed()) consoleWindow.minimize() })
ipcMain.on('console:maximize', () => { if (consoleWindow && !consoleWindow.isDestroyed()) consoleWindow.isMaximized() ? consoleWindow.restore() : consoleWindow.maximize() })
ipcMain.on('console:close', () => { if (consoleWindow && !consoleWindow.isDestroyed()) consoleWindow.close() })

ipcMain.on('win:minimize', () => {
    if (tray) hideToTray()
    else if (mainWindow) mainWindow.minimize()
})

ipcMain.on('win:maximize', () => {
    if (mainWindow && mainWindow.isMaximized()) mainWindow.restore()
    else if (mainWindow) mainWindow.maximize()
})

ipcMain.on('win:close', () => {
    if (tray) {
        hideToTray()
    } else {
        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['Quit', 'Cancel'],
            defaultId: 1,
            cancelId: 1,
            title: 'Quit Synapse X',
            message: 'Are you sure you want to quit?',
        })
        if (choice === 0) {
            app.isQuitting = true
            app.quit()
        }
    }
})

ipcMain.on('win:alwaysOnTop', (_, value) => {
    if (mainWindow) mainWindow.setAlwaysOnTop(value)
})

ipcMain.on('win:transparent', (_, value) => {
    const configPath = join(app.getPath('userData'), 'config.json')
    let config = {}
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')) } catch (_err) { /* ignore missing/malformed config */ }
    config.transparentWindow = value
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
})

ipcMain.on('win:tray', (_, value) => {
    if (value) createTray()
    else {
        destroyTray()
        showWindow()
    }
})

ipcMain.on('log:toggle', (_, value) => {
    if (value) startLogFile()
    else stopLogFile()
})

ipcMain.on('log:write', (_, message) => {
    if (logStream) logStream.write(`[${new Date().toISOString()}] ${message}\n`)
})

ipcMain.handle('win:getSilentLaunch', () => {
    const configPath = join(app.getPath('userData'), 'config.json')
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))
        return config.silentLaunch || false
    } catch (_err) { return false }
})

ipcMain.on('win:silentLaunch', (_, value) => {
    const configPath = join(app.getPath('userData'), 'config.json')
    let config = {}
    try { config = JSON.parse(fs.readFileSync(configPath, 'utf8')) } catch (_err) { /* ignore missing/malformed config */ }
    config.silentLaunch = value
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
})

ipcMain.handle('dialog:selectDirectory', async() => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openDirectory']
    })
    return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('fs:readDir', async(_, dirPath) => {
    try {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true })
        return entries.map(e => ({
            name: e.name,
            isDir: e.isDirectory(),
            path: join(dirPath, e.name),
        }))
    } catch (_err) { return [] }
})