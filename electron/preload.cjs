const { ipcMain, contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close'),
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
    saveFileDialog: (name) => ipcRenderer.invoke('dialog:saveFileDialog', name),
    saveFile: (path, data) => ipcRenderer.invoke('fs:saveFile', path, data),
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
    deleteFile: (path) => ipcRenderer.invoke('fs:deleteFile', path),
    readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
    openFile: (path) => ipcRenderer.invoke('fs:openFile', path),
    showItemInFolder: (path) => ipcRenderer.invoke('fs:showItemInFolder', path),
    setActivity: (tabName) => ipcRenderer.send('set-discord-activity', tabName),
    saveSettings: (settings) => ipcRenderer.invoke('settings:save', settings),
    loadSettings: () => ipcRenderer.invoke('settings:load'),
    getCurrentTheme: () => ipcRenderer.invoke('get-current-theme'),
    getCurrentThemeCSS: () => ipcRenderer.invoke('get-current-theme-css'),

    setAlwaysOnTop: (v) => ipcRenderer.send('win:alwaysOnTop', v),
    setTransparent: (v) => ipcRenderer.send('win:transparent', v),
    setWindowTransparency: (enabled, vibrancyType) => ipcRenderer.invoke('window:setTransparency', enabled, vibrancyType),
    restartApp: () => ipcRenderer.send('app:restart'),
    setTray: (v) => ipcRenderer.send('win:tray', v),
    setSilentLaunch: (v) => ipcRenderer.send('win:silentLaunch', v),
    getSilentLaunch: () => ipcRenderer.invoke('win:getSilentLaunch'),

    toggleLogToFile: (v) => ipcRenderer.send('log:toggle', v),
    writeLog: (m) => ipcRenderer.send('log:write', m),

    onDeepLink: (callback) => {
        ipcRenderer.on('deeplink:add-bookmark', (_, data) => {
            callback(data)
        })
    },

    notifyThemeChange: (themeName) => ipcRenderer.send('theme:change', themeName),
    onThemeChange: (callback) => {
        const handler = (_, themeName) => callback(themeName)
        ipcRenderer.on('theme:changed', handler)
        return () => ipcRenderer.removeListener('theme:changed', handler)
    },

    msAttach: (port) => ipcRenderer.invoke('macsploit:attach', port),
    msDetach: () => ipcRenderer.invoke('macsploit:detach'),
    msExecute: (script) => ipcRenderer.invoke('macsploit:execute', script),
    msIsAttached: () => ipcRenderer.invoke('macsploit:isAttached'),
    msStatus: () => ipcRenderer.invoke('macsploit:status'),
    msScan: () => ipcRenderer.invoke('macsploit:scan'),
    openConsole: () => ipcRenderer.send('console:open'),
    onMsDisconnected: (cb) => {
        ipcRenderer.on('macsploit:disconnected', cb)
        return () => ipcRenderer.removeListener('macsploit:disconnected', cb)
    },
    onMsMessage: (cb) => ipcRenderer.on('macsploit:message', (_, data) => cb(data)),
    onConsoleClear: (cb) => ipcRenderer.on('console:clear', cb),
    consoleMinimize: () => ipcRenderer.send('console:minimize'),
    consoleMaximize: () => ipcRenderer.send('console:maximize'),
    consoleClose: () => ipcRenderer.send('console:close'),

    onTask: (cb) => {
        const handler = (_, data) => cb(data)
        ipcRenderer.on('task:update', handler)
        return () => ipcRenderer.removeListener('task:update', handler)
    },
})
