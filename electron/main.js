import { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage, dialog, shell } from 'electron'
import { createRequire } from 'module'
import path from 'path'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import DiscordRPC from 'discord-rpc'
import { Buffer } from 'buffer'
import fs from 'fs'
import process from 'process'
import { exec } from 'child_process'

let isConnecting = false
let msSocket = null
let msConnected = false
let hasEverConnected = false
let hasEmittedDisconnect = false

let lastMessageTime = 0
const MESSAGE_THROTTLE_MS = 10

const clientId = '1480805181405925427' 
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

ipcMain.handle('get-current-theme-css', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json')
    let themeId = 'hollywood-classic'
    
    if (fs.existsSync(settingsPath)) {
      const data = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'))
      themeId = data.selectedTheme || 'hollywood-classic'
    }
    
    const cssPath = path.join(__dirname, `renderer/default-themes/_prebuilt-${themeId}.css`)
    if (fs.existsSync(cssPath)) {
      return fs.readFileSync(cssPath, 'utf-8')
    }
  } catch (err) {

  }
  return null
})

rpc.login({ clientId }).catch(console.error)

import net from 'net'

const IpcTypes = {
    IPC_EXECUTE: 0,
    IPC_SETTING: 1
};

const MessageTypes = {
    PRINT: 1,
    ERROR: 2
};

function msConnect(port = 5553) {
    let didEmitDisconnect = false

    function emitDisconnect() {
        if (!msConnected) return
        if (hasEmittedDisconnect) return

        hasEmittedDisconnect = true
        msConnected = false
        msSocket = null

        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('macsploit:disconnected')
        }
    }

    return new Promise((resolve, reject) => {
        const socket = new net.Socket()
        socket.setKeepAlive(true)
        
        const timeout = setTimeout(() => {
            socket.destroy()
            reject(new Error('Connection timeout'))
        }, 3000)

        socket.connect(port, '127.0.0.1', () => {
            clearTimeout(timeout)
            msSocket = socket
            msConnected = true
            hasEverConnected = true
            hasEmittedDisconnect = false

            resolve({ pid: null })
        })

        socket.on('data', (data) => {
            const type = data[0];
            if (type !== MessageTypes.PRINT && type !== MessageTypes.ERROR) return;

            try {
                if (data.length < 16) return;
                const length = data.subarray(8, 16).readBigUInt64LE();
                
                const message = data.subarray(16, 16 + Number(length)).toString("utf-8");
                
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('macsploit:message', { 
                        type: 'output', 
                        message: message 
                    })
                }
            } catch (err) {

            }
        })

        socket.on('error', (err) => {
            clearTimeout(timeout)
            isConnecting = false

            if (!msConnected) {
                reject(err)
                return
            }

            emitDisconnect()
        })

        socket.on('close', () => {
            isConnecting = false

            if (msConnected) {
                emitDisconnect()
            }
        })

        socket.on('end', () => {

        })
    })
}

function msDisconnect() {
    if (msSocket) {
        msSocket.destroy() 
        msSocket = null
        msConnected = false
    }
}

function msSend(script) {
    if (!msSocket || !msConnected) {
        throw new Error('Not connected to MacSploit')
    }
    return new Promise((resolve, reject) => {
        const encoded = Buffer.from(script, 'utf-8');
        const length = encoded.length;
        
        const data = Buffer.alloc(16 + length + 1);
        data.writeUInt8(IpcTypes.IPC_EXECUTE, 0);
        data.writeInt32LE(length, 8);
        data.write(script, 16, 'utf-8');


        
        msSocket.write(data, (err) => {
            if (err) {

                reject(err)
            } else {

                resolve()
            }
        })
    })
}

ipcMain.handle('settings:save', async (_, settings) => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json')
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2))
    return { success: true }
  } catch (err) {

    return { success: false, error: err.message }
  }
})

ipcMain.handle('settings:load', async () => {
  try {
    const settingsPath = path.join(app.getPath('userData'), 'settings.json')
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf-8')
      return JSON.parse(data)
    }
    return {}
  } catch (err) {

    return {}
  }
})

ipcMain.handle('window:setTransparency', async (_, enabled, vibrancyType = 'dark') => {
  if (!mainWindow || mainWindow.isDestroyed()) {

    return false
  }
  
  try {
    if (enabled) {
      mainWindow.setBackgroundColor('#00000000')

      
      if (process.platform === 'darwin') {
        try {
          mainWindow.setVibrancy(vibrancyType || 'appearance-based')

        } catch (err) {
          console.warn('[Transparency] Vibrancy failed, trying fallback:', err.message)
          try {
            mainWindow.setVibrancy('appearance-based')

          } catch (fallbackErr) {
            console.warn('[Transparency] Fallback vibrancy also failed:', fallbackErr.message)
          }
        }
      }
    } else {
      mainWindow.setBackgroundColor('#1c1917')

      
      if (process.platform === 'darwin') {
        try {
          mainWindow.setVibrancy(null)

        } catch (err) {
          console.warn('[Transparency] Failed to remove vibrancy:', err.message)
        }
      }
    }
    
    return true
  } catch (err) {

    return false
  }
})




ipcMain.handle('macsploit:attach', async (_, port = 5553) => {
    try {

        const result = await msConnect(port)

        return result
    } catch (err) {

        return null
    }
})

ipcMain.handle('macsploit:detach', async () => {

    msDisconnect()
    return { success: true }
})

ipcMain.handle('macsploit:execute', async (_, script) => {
    try {
        await msSend(script)
        return { success: true }
    } catch (err) {

        return { success: false, error: err.message }
    }
})

ipcMain.handle('macsploit:isAttached', () => {
    return msConnected
})

ipcMain.handle('macsploit:status', () => {
    return { connected: msConnected }
})

ipcMain.handle('macsploit:scan', async () => {

    const instances = []
    for (let port = 5553; port <= 5562; port++) {
        try {
            const socket = new net.Socket()
            await new Promise((resolve) => {
                const timeout = setTimeout(() => {
                    socket.destroy()
                    resolve()
                }, 100)
                
                socket.connect(port, '127.0.0.1', () => {
                    clearTimeout(timeout)
                    socket.destroy()
                    instances.push({ port })

                    resolve()
                })
                
                socket.on('error', () => {
                    clearTimeout(timeout)
                    resolve()
                })
            })
        } catch {}
    }

    return instances
})

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

function buildTrayIcon() {
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
            label: 'Show hollywood',
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
    tray.setToolTip('hollywood')
    tray.setContextMenu(buildContextMenu())

    tray.on('click', () => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        if (mainWindow.isVisible() && !mainWindow.isMinimized()) {
            if (mainWindow.isFocused()) {
                hideToTray()
            } else {
                showWindow()
            }
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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 500,
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
        mainWindow.webContents.on('did-finish-load', () => {
            mainWindow.webContents.openDevTools({ mode: 'detach' })
        })
    } else {
        mainWindow.loadFile(join(__dirname, '../dist/index.html'))
    }

    mainWindow.on('destroyed', () => {
        mainWindow = null
    })
    mainWindow.on('minimize', (e) => {
        if (tray) {
            e.preventDefault()
            hideToTray()
        }
    })

    mainWindow.on('close', (e) => {
        if (app.isQuitting) return

        if (tray) {
            e.preventDefault()
            mainWindow.hide()
            if (process.platform === 'darwin') app.dock.hide()
            return
        }

        e.preventDefault()
        const choice = dialog.showMessageBoxSync(mainWindow, {
            type: 'question',
            buttons: ['Quit', 'Cancel'],
            defaultId: 1,
            cancelId: 1,
            title: 'Quit hollywood',
            message: 'Are you sure you want to quit?',
        })
        if (choice === 0) {
            app.isQuitting = true
            app.quit()
        }
    })
}

if (process.defaultApp) {
    if (process.argv.length >= 2) {
        app.setAsDefaultProtocolClient('synx', process.execPath, [process.argv[1]])
    }
} else {
    app.setAsDefaultProtocolClient('synx')
}

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

    }
}

function initializeAppFolders() {
    const userData = app.getPath('userData')
    const foldersToCreate = ['themes', 'bin', 'config', 'scripts', 'logs', 'plugins']
    
    foldersToCreate.forEach(folder => {
        const folderPath = join(userData, folder)
        try {
            if (!fs.existsSync(folderPath)) {
                fs.mkdirSync(folderPath, { recursive: true })

            }
        } catch (err) {
            console.warn(`[AppInit] Failed to create folder ${folderPath}:`, err.message)
        }
    })
    

}

app.whenReady().then(() => {
    initializeAppFolders()

    createWindow()
    createTray()

    app.on('open-url', (event, url) => {
        event.preventDefault()
        handleDeepLink(url)
    })

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
        roundedCorners: false,
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
            title: 'Quit hollywood',
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

ipcMain.handle('dialog:selectFile', async() => {
    const result = await dialog.showOpenDialog(mainWindow, {
        properties: ['openFile']
    })
    return result.canceled ? null : result.filePaths[0]
})

ipcMain.handle('dialog:saveFileDialog', async(_, defaultPath) => {
    const result = await dialog.showSaveDialog(mainWindow, {
        defaultPath: defaultPath
    })
    return result.canceled ? null : result.filePath
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

ipcMain.handle('fs:deleteFile', async(_, filePath) => {
    try {
        fs.unlinkSync(filePath)
        return { success: true }
    } catch (err) {

        return { success: false, error: err.message }
    }
})

ipcMain.handle('fs:readFile', async(_, filePath) => {
    try {
        const content = fs.readFileSync(filePath, 'utf-8')
        return content
    } catch (err) {

        return null
    }
})

ipcMain.handle('fs:openFile', async(_, filePath) => {
    try {
        require('child_process').exec(`open "${filePath}"`)
        return { success: true }
    } catch (err) {

        return { success: false, error: err.message }
    }
})

ipcMain.handle('fs:showItemInFolder', async(_, filePath) => {
    try {
        require('electron').shell.showItemInFolder(filePath)
        return { success: true }
    } catch (err) {

        return { success: false, error: err.message }
    }
})

ipcMain.handle('theme:getUserThemesDir', () => {
    const themesDir = join(app.getPath('userData'), 'themes')
    if (!fs.existsSync(themesDir)) {
        fs.mkdirSync(themesDir, { recursive: true })
    }
    return themesDir
})

ipcMain.handle('theme:listCustomThemes', async () => {
    const themesDir = join(app.getPath('userData'), 'themes')
    if (!fs.existsSync(themesDir)) return []
    
    try {
        const entries = fs.readdirSync(themesDir, { withFileTypes: true })
        const themes = []
        
        for (const entry of entries) {
            if (entry.isDirectory()) {
                const cssPath = join(themesDir, entry.name, 'theme.css')
                if (fs.existsSync(cssPath)) {
                    themes.push({
                        id: entry.name,
                        name: entry.name,
                        path: cssPath
                    })
                }
            }
        }
        return themes
    } catch (err) {

        return []
    }
})

ipcMain.handle('theme:loadCustomTheme', async (_, themePath) => {
    try {
        return fs.readFileSync(themePath, 'utf8')
    } catch (err) {

        return null
    }
})

ipcMain.handle('theme:openThemesFolder', () => {
    const themesDir = join(app.getPath('userData'), 'themes')
    if (!fs.existsSync(themesDir)) {
        fs.mkdirSync(themesDir, { recursive: true })
    }
    require('electron').shell.openPath(themesDir)
})