import './index.css'
import { useEffect } from 'react'
import './styles/hollywood-base.scss'
import './renderer-main.css'
import './Styles.css'
import 'iconify-icon';

function ConsoleWindow() {
  const applyConsoleTheme = async (themeName = null) => {
    console.log('[Console] Loading theme CSS...')
    const css = await window.electron?.getCurrentThemeCSS?.()
    
    if (css) {
      // Remove old theme styles
      const oldTheme = document.getElementById('console-theme')
      if (oldTheme) oldTheme.remove()
      const oldOverrides = document.getElementById('console-overrides')
      if (oldOverrides) oldOverrides.remove()
      
      // Inject the base CSS
      const styleEl = document.createElement('style')
      styleEl.id = 'console-theme'
      styleEl.textContent = css
      document.head.appendChild(styleEl)
      
      // Apply color variables from root element
      const rootEl = document.documentElement
      const computedStyle = getComputedStyle(rootEl)
      
      console.log('[Console] Theme applied successfully')
    }
    
    document.documentElement.style.height = '100%'
    document.body.style.height = '100%'
    document.body.style.margin = '0'
    const root = document.getElementById('root')
    if (root) { 
      root.style.height = '100%'
      root.style.overflow = 'hidden' 
    }
  }

  useEffect(() => {
    // Load initial theme
    applyConsoleTheme()
    
    // Listen for theme changes from main window
    const unsubscribe = window.electron?.onThemeChange?.((themeName) => {
      console.log('[Console] Theme changed event received:', themeName)
      applyConsoleTheme(themeName)
    })
    
    return () => {
      if (unsubscribe) unsubscribe()
    }
  }, [])

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      <div className="hw-titlebar flex items-center w-full h-8 shrink-0">
        <div id="titlebar-middle-text" className="pl-2">Console</div>
        <div id="controls" className="flex ml-auto z-10">
          <div className="control p-2 cursor-pointer" onClick={() => window.electron?.consoleMinimize?.()}>
            <iconify-icon icon="fluent:subtract-16-regular"></iconify-icon>
          </div>
          <div className="control p-2 cursor-pointer" onClick={() => window.electron?.consoleMaximize?.()}>
            <iconify-icon icon="fluent:maximize-16-regular"></iconify-icon>
          </div>
          <div className="control p-2 cursor-pointer" onClick={() => window.electron?.consoleClose?.()}>
            <iconify-icon icon="fluent:dismiss-16-regular"></iconify-icon>
          </div>
        </div>
      </div>

      <div className="flex flex-col w-full overflow-hidden" style={{ flex: 1 }}>
        <div className="console-header flex w-full items-center gap-2 p-1 shrink-0">
          <button className="hw-button flex items-center gap-1 rounded-md px-2 py-1">
            <iconify-icon icon="fluent:clipboard-20-filled"></iconify-icon>
            Copy
          </button>
          <button className="hw-button flex items-center gap-1 rounded-md px-2 py-1">
            <iconify-icon icon="fluent:eraser-20-filled"></iconify-icon>
            Clear
          </button>
          <div className="hw-textbox rounded-md px-2 py-1 grow">
            <div className="flex items-center gap-2 border px-1 py-0.5">
              <iconify-icon icon="fluent:search-20-filled"></iconify-icon>
              <input className="w-full bg-transparent outline-none" />
            </div>
          </div>
          <div className="flex items-center gap-2 pr-2">
            <div className="h-6 w-11 rounded-full border flex items-center">
              <div className="h-4 w-4 bg-white rounded-full ml-1"></div>
            </div>
            Autoscroll
          </div>
        </div>

        <div className="console-contents flex flex-col w-full p-1 overflow-auto" style={{ flex: 1 }}></div>
      </div>

    </div>
  )
}

export default ConsoleWindow