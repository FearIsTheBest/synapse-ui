import { ThemeLoader } from '@synllc/theme-loader'

const THEMES = {
  'cool-kid': { dir: 'coolkid', css: '_prebuilt-coolkid', entry: 'coolkid' },
  'elysian-fields': { dir: 'elysian-fields', css: '_prebuilt-elysian-fields', entry: 'elysian-fields' },
  'freeman': { dir: 'freeman', css: '_prebuilt-freeman', entry: 'freeman' },
  'hazy-trip': { dir: 'hazy-trips', css: '_prebuilt-hazy-trip', entry: 'hazy-trip' },
  'hollywood-classic': { dir: 'hollywood-classic', css: '_prebuilt-hollywood-classic', entry: 'hollywood-classic' },
  'hollywood-dark': { dir: 'hollywood-dark', css: '_prebuilt-hollywood-dark', entry: 'hollywood-dark' },
  'hollywood-fluent': { dir: 'hollywood-fluent', css: '_prebuilt-hw-fluent', entry: 'hw-fluent' },
  'hollywood-glass': { dir: 'hollywood-glass', css: '_prebuilt-hollywood-glass', entry: 'hollywood-glass' },
  'hollywood-light': { dir: 'hollywood-light', css: '_prebuilt-hollywood-light', entry: 'hollywood-light' },
  'hollywood-novo': { dir: 'hollywood-novo', css: '_prebuilt-hollywood-novo', entry: 'hollywood-novo' },
  'kyoto': { dir: 'kyoto', css: '_prebuilt-kyoto', entry: 'kyoto' },
  'midnight': { dir: 'midnight', css: '_prebuilt-midnight', entry: 'midnight' },
  'mist': { dir: 'mist', css: '_prebuilt-mist', entry: 'mist' },
  'neon': { dir: 'neon', css: '_prebuilt-neon', entry: 'neon' },
  'nixday': { dir: 'nixday', css: '_prebuilt-nixday', entry: 'nixday' },
  'nixday-hc': { dir: 'nixday-hc', css: '_prebuilt-nixday-hc', entry: 'nixday-hc' },
  'rome': { dir: 'rome', css: '_prebuilt-rome', entry: 'rome' },
  'scarlet': { dir: 'scarlet', css: '_prebuilt-scarlet', entry: 'scarlet' },
  'seven': { dir: 'seven', css: '_prebuilt-seven', entry: 'seven' },
  'slate': { dir: 'slate', css: '_prebuilt-slate', entry: 'slate' },
  'unikoi': { dir: 'unikoi', css: '_prebuilt-unikoi', entry: 'unikoi' },
  'ware': { dir: 'ware', css: '_prebuilt-ware', entry: 'ware' },
}

const prebuiltCss = import.meta.glob('./renderer/default-themes/*.css', { import: 'default', query: '?inline' })
const legacyPrebuiltCss = import.meta.glob('./styles/prebuilt-themes/*.css', { import: 'default', query: '?inline' })
const scssModules = import.meta.glob('./styles/default-themes/*/*.scss', { import: 'default', query: '?inline' })

// Prepare loaders
const cssLoaders = {}
const themeJsonLoaders = {}
const editorJsonLoaders = {}

Object.entries(THEMES).forEach(([id, cfg]) => {
  cssLoaders[id] = async () => {
    const prebuiltKey = `./renderer/default-themes/${cfg.css}.css`
    const legacyPrebuiltKey = `./styles/prebuilt-themes/${cfg.css}.css`
    const scssKey = `./styles/default-themes/${cfg.dir}/${cfg.entry}.scss`

    // CHANGED PRIORITY: Load SCSS (default themes) first, then fallback to prebuilt
    if (scssModules[scssKey]) {
      try {
        return await scssModules[scssKey]()
      } catch (e) {
        console.warn(`[Theme] SCSS failed for ${id}, attempting prebuilt fallback: ${e.message}`)
      }
    }

    if (legacyPrebuiltCss[legacyPrebuiltKey]) {
      try {
        return await legacyPrebuiltCss[legacyPrebuiltKey]()
      } catch (e) {
        console.warn(`[Theme] Legacy prebuilt CSS failed for ${id}, trying renderer build: ${e.message}`)
      }
    }

    if (prebuiltCss[prebuiltKey]) {
      try {
        return await prebuiltCss[prebuiltKey]()
      } catch (e) {
        console.warn(`[Theme] Renderer prebuilt CSS failed for ${id}: ${e.message}`)
      }
    }

    throw new Error(`No stylesheet found for theme ${id}`)
  }

  themeJsonLoaders[id] = () => import(`./styles/default-themes/${cfg.dir}/theme.json`)
  editorJsonLoaders[id] = () => import(`./styles/default-themes/${cfg.dir}/editor.json`)
})

// Setup base loader
const baseCssLoader = async () => {
  const mod = await import('./styles/hollywood-base.css?inline')
  return mod.default || mod
}

// SCSS Postfix/Fill Loader - Required for applying theme vars
const hollywoodFillLoader = async () => {
    // Correctly reference the SCSS partial now that we know where it is
    const mod = await import('./styles/hollywood-fill.scss?inline') 
    return mod.default || mod
}

// Initialize the library
// Make sure ThemeLoader is available globally or imported correctly
const themeLoader = new ThemeLoader({
  themes: THEMES,
  cssLoaders,
  themeJsonLoaders,
  editorJsonLoaders,
  baseLoader: baseCssLoader,
  fillLoader: hollywoodFillLoader // Pass this new loader
})

// Export proxied methods for compatibility
export const getAvailableThemes = () => themeLoader.getAvailableThemes()
export const applyTheme = (id) => themeLoader.applyTheme(id)
export const applyCustomCssTheme = (name, css) => themeLoader.applyCustomCssTheme(name, css)
export const themeIdToDisplayName = (id) => themeLoader.themeIdToDisplayName(id)
export const displayNameToThemeId = (name) => themeLoader.displayNameToThemeId(name)
export const getThemeSettings = (id) => {
  if (typeof themeLoader.getThemeSettings === 'function') {
    return themeLoader.getThemeSettings(id)
  }
  // Fallback if method missing in package
  return { id, ...(THEMES[id] || {}) }
}
export const initLSP = () => { if (typeof themeLoader.initLSP === 'function') themeLoader.initLSP() }



