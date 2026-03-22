import { loader } from '@monaco-editor/react'

/**
 * FIXED THEME LOADER
 * 
 * Key fixes:
 * 1. Corrected theme ID mappings (hazy-trips -> hazy-trip)
 * 2. Better error handling and logging
 * 3. Proper fallback detection
 * 4. Validates theme data before applying
 */

const THEMES = {
  'cool-kid': { dir: 'coolkid', css: '_prebuilt-coolkid' },
  'elysian-fields': { dir: 'elysian-fields', css: '_prebuilt-elysian-fields' },
  'freeman': { dir: 'freeman', css: '_prebuilt-freeman' },
  'hazy-trip': { dir: 'hazy-trip', css: '_prebuilt-hazy-trip' }, // FIXED: was 'hazy-trips'
  'hollywood-classic': { dir: 'hollywood-classic', css: '_prebuilt-hollywood-classic' },
  'hollywood-dark': { dir: 'hollywood-dark', css: '_prebuilt-hollywood-dark' },
  'hollywood-fluent': { dir: 'hollywood-fluent', css: '_prebuilt-hw-fluent' },
  'hollywood-glass': { dir: 'hollywood-glass', css: '_prebuilt-hollywood-glass' },
  'hollywood-light': { dir: 'hollywood-light', css: '_prebuilt-hollywood-light' },
  'hollywood-novo': { dir: 'hollywood-novo', css: '_prebuilt-hollywood-novo' },
  'kyoto': { dir: 'kyoto', css: '_prebuilt-kyoto' },
  'midnight': { dir: 'midnight', css: '_prebuilt-midnight' },
  'mist': { dir: 'mist', css: '_prebuilt-mist' },
  'neon': { dir: 'neon', css: '_prebuilt-neon' },
  'nixday': { dir: 'nixday', css: '_prebuilt-nixday' },
  'nixday-hc': { dir: 'nixday-hc', css: '_prebuilt-nixday-hc' },
  'rome': { dir: 'rome', css: '_prebuilt-rome' },
  'scarlet': { dir: 'scarlet', css: '_prebuilt-scarlet' },
  'seven': { dir: 'seven', css: '_prebuilt-seven' },
  'slate': { dir: 'slate', css: '_prebuilt-slate' },
  'unikoi': { dir: 'unikoi', css: '_prebuilt-unikoi' },
  'ware': { dir: 'ware', css: '_prebuilt-ware' },
}

// Auto-generate loaders from config
const cssLoaders = {}
const themeJsonLoaders = {}
const editorJsonLoaders = {}

Object.entries(THEMES).forEach(([id, cfg]) => {
  cssLoaders[id] = () => import(`./renderer/default-themes/${cfg.css}.css?inline`)
  themeJsonLoaders[id] = () => import(`./styles/default-themes/${cfg.dir}/theme.json`)
  
  editorJsonLoaders[id] = async () => {
    try {
      const module = await import(`./styles/default-themes/${cfg.dir}/editor.json`)
      return module
    } catch (e) {
      console.warn(`[Loader] editor.json not found for ${id}: ${e.message}`)
      throw e
    }
  }
})

/**
 * Get all available theme IDs
 */
export function getAvailableThemes() {
  return Object.keys(THEMES).sort()
}

/**
 * Convert 'cool-kid' -> 'Cool Kid'
 */
export function themeIdToDisplayName(id) {
  return id
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

/**
 * Convert 'Cool Kid' -> 'cool-kid'
 */
export function displayNameToThemeId(name) {
  return name.toLowerCase().replace(/\s+/g, '-')
}

/**
 * Validate editor.json structure
 */
function isValidEditorJson(editorJson) {
  if (!editorJson) {
    console.warn('[Theme] Editor JSON is null/undefined')
    return false
  }
  
  if (!editorJson.colors || typeof editorJson.colors !== 'object') {
    console.warn('[Theme] Editor JSON missing colors object')
    return false
  }
  
  const colorCount = Object.keys(editorJson.colors).length
  if (colorCount < 10) {
    console.warn(`[Theme] Editor JSON has insufficient colors: ${colorCount}`)
    return false
  }
  
  return true
}

/**
 * Apply theme: CSS + Monaco editor theme from editor.json
 * With full cleanup and fallback support for missing editor.json
 */
export async function applyTheme(themeId) {
  if (!THEMES[themeId]) {
    console.error(`[Theme] Unknown theme: ${themeId}`)
    return false
  }

  try {
    // ========== STEP 0: FULL CLEANUP OF OLD THEME ==========
    console.log(`[Theme] Starting cleanup for ${themeId}...`)
    
    // Remove all synapse theme styles
    document.querySelectorAll('[data-synapse-theme]').forEach(el => {
      console.log(`[Theme] Removing old theme element: ${el.getAttribute('data-synapse-theme')}`)
      el.remove()
    })
    
    // Remove any leftover style tags with theme classes
    document.querySelectorAll('style[data-theme], style[class*="theme"]').forEach(el => el.remove())
    
    // Reset all CSS custom properties related to themes
    document.documentElement.style.cssText = ''
    
    console.log(`[Theme] Cleanup complete`)

    // ========== STEP 1: Load and apply CSS ==========
    console.log(`[Theme] Loading CSS for ${themeId}...`)
    let cssModule
    try {
      cssModule = await cssLoaders[themeId]()
    } catch (cssError) {
      console.error(`[Theme] Failed to load CSS for ${themeId}:`, cssError.message)
      return false
    }
    
    const css = cssModule.default || cssModule

    if (!css || typeof css !== 'string') {
      console.error(`[Theme] Invalid CSS content for ${themeId}:`, typeof css)
      return false
    }

    // Apply CSS
    const style = document.createElement('style')
    style.setAttribute('data-synapse-theme', themeId)
    style.textContent = css
    document.head.appendChild(style)
    console.log(`[Theme] ✓ CSS applied: ${themeId} (${css.length} bytes)`)

    // ========== STEP 2: Load theme metadata ==========
    let themeJson = null
    try {
      const mod = await themeJsonLoaders[themeId]()
      themeJson = mod.default || mod
      console.log(`[Theme] ✓ Metadata loaded: ${themeId}`)
    } catch (e) {
      console.warn(`[Theme] No theme.json for ${themeId}:`, e.message)
    }

    // ========== STEP 3: Load editor.json (WITH VALIDATION) ==========
    let editorJson = null
    let usedFallback = false
    
    try {
      console.log(`[Theme] Loading editor.json for ${themeId}...`)
      const mod = await editorJsonLoaders[themeId]()
      const loadedJson = mod.default || mod
      
      if (isValidEditorJson(loadedJson)) {
        editorJson = loadedJson
        console.log(`[Theme] ✓ Editor JSON loaded: ${themeId}, ${Object.keys(editorJson.colors).length} colors`)
      } else {
        console.warn(`[Theme] Invalid editor.json for ${themeId}, using fallback`)
        usedFallback = true
        editorJson = createFallbackTheme(themeId, themeJson)
      }
    } catch (e) {
      console.warn(`[Theme] Failed to load editor.json for ${themeId}: ${e.message}`)
      usedFallback = true
      editorJson = createFallbackTheme(themeId, themeJson)
    }

    // ========== STEP 4: Reset Monaco completely ==========
    try {
      const monaco = await loader.init()
      
      // Remove old synapse theme if it exists
      try {
        // Monaco doesn't have a removeTheme API, but we can just overwrite
        console.log(`[Theme] Preparing Monaco for new theme`)
      } catch (e) {
        // Ignore
      }
    } catch (e) {
      console.warn(`[Theme] Monaco initialization warning:`, e.message)
    }

    // ========== STEP 5: Apply Monaco theme ==========
    try {
      const monaco = await loader.init()
      
      // Build the complete theme object
      const monacoTheme = {
        base: editorJson.base || 'vs-dark',
        inherit: editorJson.inherit !== false,
        rules: editorJson.tokenColors || [],
        colors: editorJson.colors || {},
      }

      console.log(`[Theme] Applying Monaco theme with ${Object.keys(monacoTheme.colors).length} colors`)
      
      // Define theme
      monaco.editor.defineTheme('synapse', monacoTheme)
      
      // Set the theme globally (this applies to all editors)
      monaco.editor.setTheme('synapse')
      
      const fallbackLabel = usedFallback ? ' (using fallback)' : ''
      console.log(`[Theme] ✓ Monaco theme applied: ${themeId}${fallbackLabel}`)
    } catch (e) {
      console.error(`[Theme] Monaco apply failed for ${themeId}:`, e)
      return false
    }

    console.log(`[Theme] ✓✓✓ FULLY APPLIED: ${themeId}${usedFallback ? ' (fallback)' : ''}`)
    return true

  } catch (err) {
    console.error(`[Theme] FATAL ERROR applying ${themeId}:`, err)
    return false
  }
}

/**
 * Create a fallback Monaco theme for themes without editor.json
 * Uses theme.json metadata and intelligent defaults
 */
function createFallbackTheme(themeId, themeJson = null) {
  // Detect theme type from ID for intelligent defaults
  const isDark = !themeId.includes('light')
  
  const baseTheme = isDark ? 'vs-dark' : 'vs'
  
  // Try to extract colors from theme.json if available
  let primaryColor = '#0e639c'
  let backgroundColor = isDark ? '#1e1e1e' : '#ffffff'
  let foregroundColor = isDark ? '#d4d4d4' : '#333333'
  
  if (themeJson?.colors) {
    // Try to map common theme.json color names to editor colors
    if (themeJson.colors.primary) primaryColor = themeJson.colors.primary
    if (themeJson.colors.background) backgroundColor = themeJson.colors.background
    if (themeJson.colors.foreground) foregroundColor = themeJson.colors.foreground
    if (themeJson.colors['hw-bg']) backgroundColor = themeJson.colors['hw-bg']
    if (themeJson.colors['hw-text']) foregroundColor = themeJson.colors['hw-text']
  }
  
  // Sensible defaults for dark vs light themes
  const defaultColors = isDark ? {
    'editor.background': backgroundColor,
    'editor.foreground': foregroundColor,
    'editor.lineHighlightBackground': '#2d2d2d',
    'editor.selectionBackground': '#264f78',
    'editor.selectionHighlightBackground': '#264f78',
    'editorLineNumber.foreground': '#858585',
    'editorLineNumber.activeForeground': '#c6c6c6',
    'editorCursor.foreground': foregroundColor,
    'editorGutter.background': backgroundColor,
    'editorWidget.background': '#252526',
    'editorWidget.border': '#454545',
    'input.background': '#3c3c3c',
    'input.border': '#3c3c3c',
    'input.foreground': foregroundColor,
    'button.background': primaryColor,
    'button.foreground': '#ffffff',
    'focusBorder': primaryColor,
    'list.activeSelectionBackground': '#094771',
    'list.hoverBackground': '#2d2d2d',
    'activityBar.background': backgroundColor,
    'sideBar.background': '#252526',
    'statusBar.background': primaryColor,
    'titleBar.activeBackground': backgroundColor,
  } : {
    'editor.background': backgroundColor,
    'editor.foreground': foregroundColor,
    'editor.lineHighlightBackground': '#f3f3f3',
    'editor.selectionBackground': '#add6ff',
    'editorLineNumber.foreground': '#999999',
    'editorLineNumber.activeForeground': '#333333',
    'editorCursor.foreground': '#000000',
    'editorGutter.background': backgroundColor,
    'editorWidget.background': '#f3f3f3',
    'input.background': '#ffffff',
    'input.border': '#d0d0d0',
    'input.foreground': foregroundColor,
    'button.background': primaryColor,
    'button.foreground': '#ffffff',
    'focusBorder': primaryColor,
    'list.activeSelectionBackground': primaryColor,
    'list.hoverBackground': '#f0f0f0',
    'activityBar.background': '#f0f0f0',
    'sideBar.background': '#f8f8f8',
    'statusBar.background': primaryColor,
    'titleBar.activeBackground': backgroundColor,
  }

  console.log(`[Theme] Fallback: Creating ${isDark ? 'dark' : 'light'} theme for ${themeId}`)

  return {
    base: baseTheme,
    inherit: true,
    rules: [],
    colors: defaultColors,
  }
}

/**
 * Initialize Monaco with all available themes
 * Handles missing editor.json with fallback themes
 */
export async function initLSP(editor) {
  if (!editor) return

  try {
    loader.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor/min/vs' } })

    const monaco = await loader.init()
    const results = { success: 0, fallback: 0, failed: 0 }
    
    console.log(`[LSP] Initializing ${getAvailableThemes().length} themes...`)
    
    for (const themeId of getAvailableThemes()) {
      try {
        let editorJson = null
        let themeJson = null
        let usedFallback = false
        
        // Load theme metadata first
        try {
          const mod = await themeJsonLoaders[themeId]()
          themeJson = mod.default || mod
        } catch (e) {
          // Ignore metadata load failure
        }
        
        // Try to load editor.json
        try {
          const mod = await editorJsonLoaders[themeId]()
          const loadedJson = mod.default || mod
          
          if (isValidEditorJson(loadedJson)) {
            editorJson = loadedJson
          } else {
            usedFallback = true
            editorJson = createFallbackTheme(themeId, themeJson)
          }
        } catch (e) {
          usedFallback = true
          editorJson = createFallbackTheme(themeId, themeJson)
        }
        
        // Define the theme
        const monacoTheme = {
          base: editorJson.base || 'vs-dark',
          inherit: editorJson.inherit !== false,
          rules: editorJson.tokenColors || [],
          colors: editorJson.colors || {},
        }
        
        monaco.editor.defineTheme(themeId, monacoTheme)
        
        if (usedFallback) {
          results.fallback++
          console.log(`[LSP] ⚠ ${themeId} - using fallback`)
        } else {
          results.success++
          console.log(`[LSP] ✓ ${themeId} - loaded successfully`)
        }
      } catch (e) {
        results.failed++
        console.error(`[LSP] ✗ ${themeId} - failed:`, e.message)
      }
    }

    console.log(`[LSP] ✓✓✓ Initialized - ${results.success} full themes + ${results.fallback} fallback themes (${results.failed} failed)`)
    return results
  } catch (err) {
    console.error('[LSP] Initialization error:', err)
    throw err
  }
}

/**
 * Get cached theme settings from localStorage
 */
export function getThemeSettings(themeId) {
  try {
    const cached = localStorage.getItem(`theme_${themeId}`)
    return cached ? JSON.parse(cached) : null
  } catch {
    return null
  }
}

/**
 * Validate theme configuration
 */
export function validateThemeConfig() {
  const issues = []
  
  for (const [id, cfg] of Object.entries(THEMES)) {
    if (!cfg.dir) issues.push(`${id}: missing 'dir'`)
    if (!cfg.css) issues.push(`${id}: missing 'css'`)
  }
  
  if (issues.length > 0) {
    console.error('[Theme] Configuration issues:', issues)
    return false
  }
  
  console.log('[Theme] Configuration validated successfully')
  return true
}