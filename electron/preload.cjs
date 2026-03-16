const { contextBridge, ipcRenderer } = require('electron')


contextBridge.exposeInMainWorld('electron', {
    // Window controls
    minimize: () => ipcRenderer.send('win:minimize'),
    maximize: () => ipcRenderer.send('win:maximize'),
    close: () => ipcRenderer.send('win:close'),
    selectDirectory: () => ipcRenderer.invoke('dialog:selectDirectory'),
    selectFile: () => ipcRenderer.invoke('dialog:selectFile'),
    saveFileDialog: (name) => ipcRenderer.invoke('dialog:saveFileDialog', name),
    saveFile: (path, data) => ipcRenderer.invoke('fs:saveFile', path, data),
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
    setActivity: (tabName) => ipcRenderer.send('set-discord-activity', tabName),

    // Settings
    setAlwaysOnTop: (v) => ipcRenderer.send('win:alwaysOnTop', v),
    setTransparent: (v) => ipcRenderer.send('win:transparent', v),
    setTray: (v) => ipcRenderer.send('win:tray', v),
    setSilentLaunch: (v) => ipcRenderer.send('win:silentLaunch', v),
    getSilentLaunch: () => ipcRenderer.invoke('win:getSilentLaunch'),

    // Logging
    toggleLogToFile: (v) => ipcRenderer.send('log:toggle', v),
    writeLog: (m) => ipcRenderer.send('log:write', m),

    onDeepLink: (callback) => {
        ipcRenderer.on('deeplink:add-bookmark', (_, data) => {
            callback(data)
        })
    },

    // MacSploit API
    msAttach: (port) => ipcRenderer.invoke('macsploit:attach', port),
    msDetach: () => ipcRenderer.invoke('macsploit:detach'),
    msExecute: (script) => ipcRenderer.invoke('macsploit:execute', script),
    msIsAttached: () => ipcRenderer.invoke('macsploit:isAttached'),
    msStatus: () => ipcRenderer.invoke('macsploit:status'),
    msScan: () => ipcRenderer.invoke('macsploit:scan'),
    openConsole: () => ipcRenderer.send('console:open'),
    onMsDisconnected: (cb) => ipcRenderer.on('macsploit:disconnected', cb),
    onMsMessage: (cb) => ipcRenderer.on('macsploit:message', (_, data) => cb(data)),
    onConsoleClear: (cb) => ipcRenderer.on('console:clear', cb),
    consoleMinimize: () => ipcRenderer.send('console:minimize'),
    consoleMaximize: () => ipcRenderer.send('console:maximize'),
    consoleClose: () => ipcRenderer.send('console:close'),

    // Task progress pushed from main process (updates, downloads, etc.)
    onTask: (cb) => ipcRenderer.on('task:update', (_, data) => cb(data)),
})
