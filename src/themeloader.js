import { loader } from '@monaco-editor/react'

//nigger

const themeModules = {
    'cool-kid': () => import('./styles/prebuilt-themes/_prebuilt-coolkid.css?inline'),
    'elysian-fields': () => import('./styles/prebuilt-themes/_prebuilt-elysian-fields.css?inline'),
    'freeman': () => import('./styles/prebuilt-themes/_prebuilt-freeman.css?inline'),
    'hazy-trips': () => import('./styles/default-themes/hazy-trips/hazy-trip.scss?inline'),
    'hollywood-classic': () => import('./styles/prebuilt-themes/_prebuilt-hollywood-classic.css?inline'),
    'hollywood-dark': () => import('./styles/default-themes/hollywood-dark/hollywood-dark.scss?inline'),
    'hollywood-fluent': () => import('./styles/default-themes/hollywood-fluent/hw-fluent.scss?inline'),
    'hollywood-glass': () => import('./styles/prebuilt-themes/_prebuilt-hollywood-glass.css?inline'),
    'hollywood-light': () => import('./styles/prebuilt-themes/_prebuilt-hollywood-light.css?inline'),
    'hollywood-novo': () => import('./styles/prebuilt-themes/_prebuilt-hollywood-novo.css?inline'),
    'kyoto': () => import('./styles/prebuilt-themes/_prebuilt-kyoto.css?inline'),
    'neon': () => import('./styles/prebuilt-themes/_prebuilt-neon.css?inline'),
    'seven': () => import('./styles/prebuilt-themes/_prebuilt-seven.css?inline'),
    'unikoi': () => import('./styles/prebuilt-themes/_prebuilt-unikoi.css?inline'),
}

const themeJsonLoaders = {
    'cool-kid': () => import('./styles/default-themes/coolkid/theme.json'),
    'elysian-fields': () => import('./styles/default-themes/elysian-fields/theme.json'),
    'freeman': () => import('./styles/default-themes/freeman/theme.json'),
    'hazy-trips': () => import('./styles/default-themes/hazy-trips/theme.json'),
    'hollywood-classic': () => import('./styles/default-themes/hollywood-classic/theme.json'),
    'hollywood-dark': () => import('./styles/default-themes/hollywood-dark/theme.json'),
    'hollywood-fluent': () => import('./styles/default-themes/hollywood-fluent/theme.json'),
    'hollywood-glass': () => import('./styles/default-themes/hollywood-glass/theme.json'),
    'hollywood-light': () => import('./styles/default-themes/hollywood-light/theme.json'),
    'hollywood-novo': () => import('./styles/default-themes/hollywood-novo/theme.json'),
    'kyoto': () => import('./styles/default-themes/kyoto/theme.json'),
    'neon': () => import('./styles/default-themes/neon/theme.json'),
    'seven': () => import('./styles/default-themes/seven/theme.json'),
    'unikoi': () => import('./styles/default-themes/unikoi/theme.json'),
}

const editorJsonLoaders = {
    'elysian-fields': () => import('./styles/default-themes/elysian-fields/editor.json'),
    'freeman': () => import('./styles/default-themes/freeman/editor.json'),
    'hollywood-classic': () => import('./styles/default-themes/hollywood-classic/editor.json'),
    'hollywood-fluent': () => import('./styles/default-themes/hollywood-fluent/editor.json'),
    'hollywood-novo': () => import('./styles/default-themes/hollywood-novo/editor.json'),
    'kyoto': () => import('./styles/default-themes/kyoto/editor.json'),
    'neon': () => import('./styles/default-themes/neon/editor.json'),
    'unikoi': () => import('./styles/default-themes/unikoi/editor.json'),
}

const iconJsonLoaders = {
    'freeman': () => import('./styles/default-themes/freeman/icons.json'),
    'hollywood-fluent': () => import('./styles/default-themes/hollywood-fluent/icons.json'),
    'hollywood-novo': () => import('./styles/default-themes/hollywood-novo/icons.json'),
}

function buildCSSMap(css) {
    const map = {}
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '')
    const blockRe = /([^{}]+)\{([^{}]*)\}/g
    let m
    while ((m = blockRe.exec(stripped)) !== null) {
        const rawSel = m[1].trim()
        const body = m[2]
        const sels = rawSel.split(',').map(s => s.trim()).filter(Boolean)
        const declRe = /([\w-]+)\s*:\s*([^;]+)/g
        let d
        while ((d = declRe.exec(body)) !== null) {
            const prop = d[1].trim()
            const val = d[2].trim()
            for (const sel of sels) {
                map[`${sel}|${prop}`] = val
            }
        }
    }
    return map
}

function getProp(map, sel, prop) {
    return map[`${sel}|${prop}`] || null
}

function toHex(val) {
    if (!val) return null
    val = val.trim()

    if (val.startsWith('var(')) return null

    if (val.includes('gradient')) {
        let depth = 0,
            cur = '',
            tokens = []
        const inner = val.slice(val.indexOf('(') + 1, val.lastIndexOf(')'))
        for (const ch of inner) {
            if (ch === '(') depth++
                else if (ch === ')') depth--
                    if (ch === ',' && depth === 0) { tokens.push(cur.trim());
                        cur = '' } else cur += ch
        }
        tokens.push(cur.trim())
        for (const t of tokens) {
            if (!t || /^to\s/.test(t) || t === 'transparent') continue
            const h = toHex(t)
            if (h) return h
        }
        return null
    }

    const named = { black: '#000000', white: '#ffffff', transparent: null, none: null, inherit: null }
    if (val in named) return named[val]

    if (/^#[0-9a-fA-F]{3}$/.test(val))
        return '#' + [val[1], val[2], val[3]].map(c => c + c).join('')

    if (/^#[0-9a-fA-F]{6}$/.test(val)) return val.toLowerCase()

    const rgb = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\)/)
    if (rgb) {
        if (rgb[4] !== undefined && parseFloat(rgb[4]) === 0) return 'transparent'
        return '#' + [rgb[1], rgb[2], rgb[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')
    }

    return null
}

function isColorDark(hex) {
    if (!hex || hex === 'transparent') return true
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
}

function extractColors(map) {
    const bg_ = (...sels) => { for (const s of sels) { const v = toHex(getProp(map, s, 'background')) || toHex(getProp(map, s, 'background-color')); if (v) return v } return null }
    const fg_ = (...sels) => { for (const s of sels) { const v = toHex(getProp(map, s, 'color')); if (v) return v } return null }
    const bd_ = (...sels) => { for (const s of sels) { const v = toHex(getProp(map, s, 'border-color')) || toHex(getProp(map, s, 'border')); if (v) return v } return null }

    const bg =
        bg_('body', 'html, body', 'html') ||
        bg_('#application') ||
        bg_('.hw-multimenu .pages') ||
        null

    const fg =
        fg_('html, body', 'body', 'html') ||
        null

    const textbox =
        bg_('.hw-textbox') ||
        null

    const border =
        bd_('.hw-textbox .inner') ||
        bd_('.hw-editor-tab') ||
        bd_('.hw-titlebar') ||
        null

    const accent = bg_('.hw-checkbox.on') || null
    const titlebar = bg_('.hw-titlebar') || null
    const tabSelect = bg_('.hw-editor-tab.select') || null
    const tabBorder = bd_('.hw-editor-tab') || border
    const navSelect = bg_('.hw-navigationbar .entry.select') || null
    const btn = bg_('.hw-button') || null
    const btnBorder = bd_('.hw-button') || null
    const dialog = bg_('.hw-dialog') || bg_('.hw-changelog') || null
    const progressCapBg = bg_('.hw-progress-view .caption') || null
    const multimenuBg = bg_('.hw-multimenu .list') || null
    const multimenuPages = bg_('.hw-multimenu .pages') || null
    const dropdownBg = bg_('.hw-dropdown .selector') || bg_('.hw-dropdown .list') || null
    const consoleBg = bg_('.console-contents') || null
    const consoleHeaderBg = bg_('.console-header') || null

    const capSel = '.editor-sidebar-category .category-caption, .editor-sidebar-category .module-caption, .tree .category-caption, .tree .module-caption'
    const captionBg = bg_(capSel) || null
    const captionBorder = bd_(capSel) || null

    return {
        bg,
        fg,
        textbox,
        border,
        accent,
        titlebar,
        tabSelect,
        tabBorder,
        navSelect,
        btn,
        btnBorder,
        dialog,
        progressCapBg,
        multimenuBg,
        multimenuPages,
        dropdownBg,
        consoleBg,
        consoleHeaderBg,
        captionBg,
        captionBorder,
    }
}

let lspInitialized = false

export async function initLSP() {
    if (lspInitialized) return
    lspInitialized = true

    const monaco = await loader.init()

    const baseUrl = new URL('./', location.href)
    const createAssetUrl = (path) => new URL(path, baseUrl).href

    const luaFiles = [
        'lua-types/synapse.luau',
        'lua-types/env.luau',
        'lua-types/meta.luau',
        'lua-types/3rd/testez.luau',
        'lua-types/3rd/roact.luau',
        'lua-types/3rd/roactrodux.luau',
        'lua-types/3rd/rodux.luau',
    ]

    for (const path of luaFiles) {
        try {
            const url = createAssetUrl(path)
            const res = await fetch(url)
            if (!res.ok) continue
            const text = await res.text()
            const uri = monaco.Uri.parse(`file:///${path}`)
            const existing = monaco.editor.getModel(uri)
            if (!existing) monaco.editor.createModel(text, 'lua', uri)
            else existing.setValue(text)
        } catch (e) {
            console.warn('[LSP] Failed to load', path, e)
        }
    }

    try {
        const res = await fetch(createAssetUrl('lua-types/synapse.json'))
        if (!res.ok) throw new Error(`404: ${res.url}`)
        const completions = await res.json()
        monaco.languages.registerCompletionItemProvider('lua', {
            provideCompletionItems: () => ({
                suggestions: Object.entries(completions).map(([label, detail]) => ({
                    label,
                    kind: monaco.languages.CompletionItemKind.Function,
                    detail: typeof detail === 'string' ? detail.slice(0, 100) : '',
                    documentation: { value: typeof detail === 'string' ? detail : '' },
                    insertText: label,
                }))
            })
        })
    } catch (e) {
        console.warn('[LSP] Failed to load synapse.json', e)
    }
}

export async function applyTheme(themeId) {
    const loaderFn = themeModules[themeId]
    if (!loaderFn) return

    try {
        const mod = await loaderFn()
        const css = mod.default

        let transparencyMode = null
        if (themeJsonLoaders[themeId]) {
            try {
                const configMod = await themeJsonLoaders[themeId]()
                transparencyMode = configMod.default?.transparencyMode || configMod.transparencyMode
            } catch (err) {}
        }

        if (window.electron && window.electron.setWindowTransparency) {
            window.electron.setWindowTransparency(!!transparencyMode, transparencyMode || 'dark')
        }

        if (transparencyMode) {
            document.documentElement.setAttribute('data-transparent', 'true')
        } else {
            document.documentElement.removeAttribute('data-transparent')
        }

        let themeEl = document.getElementById('synapse-theme')
        if (themeEl) themeEl.remove()
        themeEl = document.createElement('style')
        themeEl.id = 'synapse-theme'
        document.head.appendChild(themeEl)
        themeEl.textContent = css

        const map = buildCSSMap(css)
        const c = extractColors(map)

        const lv = (name) => {
            const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
            if (transparencyMode && val === 'transparent') return 'transparent'
            return val || null
        }

        if (!c.bg) {
            const surface = lv('--surface')
            if (surface === 'transparent') c.bg = 'transparent'
            else c.bg = toHex(surface) || toHex(lv('--tab-bg')) || (transparencyMode ? 'transparent' : '#1c1917')
        }
        if (!c.fg) c.fg = (c.bg === 'transparent' || isColorDark(c.bg)) ? '#fafaf9' : '#000000'
        if (!c.textbox) c.textbox = toHex(lv('--button-highlight')) || toHex(lv('--tab-bg')) || (c.bg === 'transparent' ? 'rgba(0,0,0,0.5)' : c.bg)
        if (!c.border) c.border = toHex(lv('--button-border-color')) || '#57534e'
        if (!c.accent) c.accent = toHex(lv('--button-shade-light-active')) || '#0369a1'

        if (!c.dialog) c.dialog = c.textbox
        if (!c.btn) c.btn = c.textbox
        if (!c.btnBorder) c.btnBorder = c.border
        if (!c.titlebar) c.titlebar = c.textbox
        if (!c.tabSelect) c.tabSelect = toHex(lv('--tab-bg')) || c.textbox
        if (!c.tabBorder) c.tabBorder = c.border
        if (!c.navSelect) c.navSelect = c.textbox
        if (!c.captionBg) c.captionBg = c.textbox
        if (!c.captionBorder) c.captionBorder = c.border
        if (!c.multimenuBg) c.multimenuBg = c.bg
        if (!c.multimenuPages) c.multimenuPages = c.dialog
        if (!c.dropdownBg) c.dropdownBg = c.textbox
        if (!c.progressCapBg) c.progressCapBg = c.textbox
        if (!c.consoleBg) c.consoleBg = c.bg
        if (!c.consoleHeaderBg) c.consoleHeaderBg = c.textbox

        let ov = document.getElementById('synapse-theme-overrides')
        if (ov) ov.remove()
        ov = document.createElement('style')
        ov.id = 'synapse-theme-overrides'
        document.head.appendChild(ov)

        let borderPatch = document.getElementById('synapse-theme-border-patch')
        if (borderPatch) borderPatch.remove()
        borderPatch = document.createElement('style')
        borderPatch.id = 'synapse-theme-border-patch'
        document.head.appendChild(borderPatch)
        borderPatch.textContent = `
            .sidebar.border-l, .sidebar.border-r { border-color: ${c.border} !important; border-style: solid !important; }
            .tabs-container.border-b { border-color: ${c.tabBorder} !important; border-style: solid !important; }
            .action-bar.border-t, .action-bar.border-b { border-color: ${c.border} !important; border-style: solid !important; }

            :where(.sidebar, .tabs-container, .action-bar, .ai-view, .editor-page, .editor-view, .main-container) {
                background-color: ${c.bg};
                color: ${c.fg};
            }
        `

        const skipAllOverrides = ['hazy-trips', 'seven', 'cool-kid', 'elysian-fields', 'freeman', 'hollywood-classic', 'hollywood-glass', 'hollywood-light', 'hollywood-novo', 'kyoto', 'neon', 'unikoi'].includes(themeId)

        if (!skipAllOverrides) {
            ov.textContent = `

      html, body, #root {
        background: ${c.bg} !important;
        color: ${c.fg} !important;
      }

      * { border-style: solid; }

      .editor-page,
      .editor-view,
      .editor-view .main-container,
      section.relative.flex.h-full,
      .sidebar, .tree {
        background: ${c.bg} !important;
        color: ${c.fg} !important;
      }

      .bg-black,
      .bg-stone-950, .bg-stone-900, .bg-stone-800, .bg-stone-700, .bg-stone-600,
      .bg-zinc-950, .bg-zinc-900, .bg-zinc-800, .bg-zinc-700 {
        background-color: ${c.bg} !important;
      }

      .text-white,
      .text-stone-50, .text-stone-100, .text-stone-200,
      .text-zinc-50, .text-zinc-100, .text-zinc-200 {
        color: ${c.fg} !important;
      }

      [class*="border-stone-"], [class*="border-zinc-"],
      [class*="divide-stone-"] > * + *, [class*="divide-zinc-"] > * + * {
        border-color: ${c.border} !important;
      }

      .hw-titlebar {
        background: ${c.titlebar} !important;
        color: ${c.fg} !important;
        border-bottom: 1px solid ${c.border} !important;
      }
      .hw-titlebar .control { color: ${c.fg} !important; }

      .hw-navigationbar {
        color: ${c.fg} !important;
        border-color: ${c.border} !important;
      }
      .hw-navigationbar .entry.select {
        background: ${c.navSelect} !important;
        color: ${c.fg} !important;
      }
      .hw-navigationbar .entry .selectbar { background-color: ${c.fg} !important; }

      .hw-button {
        color: ${c.fg} !important;
        border-color: ${c.border} !important;
      }

      .hw-textbox {
        background: ${c.textbox} !important;
        color: ${c.fg} !important;
      }
      .hw-textbox .caption { color: ${c.fg} !important; }

      .hw-checkbox { border: 1px solid ${c.border} !important; }
      .hw-checkbox.on {
        background: ${c.accent} !important;
        border-color: ${c.accent} !important;
      }

      .hw-dropdown { color: ${c.fg} !important; }
      .hw-dropdown .selector {
        background: ${c.dropdownBg} !important;
        color: ${c.fg} !important;
        border: 1px solid ${c.border} !important;
      }
      .hw-dropdown .list {
        background: ${c.dropdownBg} !important;
        color: ${c.fg} !important;
        border: 1px solid ${c.border} !important;
      }
      .hw-dropdown .list .highlight { background: ${c.accent} !important; }

      .hw-dialog {
        background: ${c.dialog} !important;
        color: ${c.fg} !important;
        border: 1px solid ${c.border} !important;
      }
      .hw-dialog .caption { color: ${c.fg} !important; }
      .hw-dialog .inputs {
        background: ${c.textbox} !important;
        border-top: 1px solid ${c.border} !important;
      }

      .tabs-container {
        background: ${c.bg} !important;
        border-color: ${c.tabBorder} !important;
      }
      .hw-editor-tab {
        color: ${c.fg} !important;
      }
      .hw-editor-tab.select {
        background: ${c.tabSelect} !important;
        color: ${c.fg} !important;
      }

      .action-bar {
        background: ${c.bg} !important;
        color: ${c.fg} !important;
        border-color: ${c.border} !important;
      }

      .sidebar { border-color: ${c.border} !important; }
      .module-caption,
      .category-caption,
      .editor-sidebar-category .category-caption,
      .editor-sidebar-category .module-caption,
      .tree .category-caption,
      .tree .module-caption {
        background: ${c.captionBg} !important;
        color: ${c.fg} !important;
        border-color: ${c.captionBorder} !important;
      }
      .tree .node,
      .editor-sidebar-category .node { color: ${c.fg} !important; }

      .hw-multimenu .list {
        background: ${c.multimenuBg} !important;
        border-right: 1px solid ${c.border} !important;
      }
      .hw-multimenu .list .entry {
        background: ${c.textbox} !important;
        color: ${c.fg} !important;
      }
      .hw-multimenu .list .entry::before { background: ${c.accent} !important; }
      .hw-multimenu .list .entry.select { filter: brightness(1.15) !important; }
      .hw-multimenu .pages { background: ${c.multimenuPages} !important; }
      .hw-multimenu .pages .page .category-label {
        background: ${c.textbox} !important;
        border-color: ${c.border} !important;
      }

      .hw-slider input[type=range]::-webkit-slider-runnable-track {
        background: ${c.textbox} !important;
      }
      .hw-slider input[type=range]::-webkit-slider-thumb {
        background: ${c.accent} !important;
      }

      .hw-progress-view {
        background: ${c.dialog} !important;
        color: ${c.fg} !important;
        border: 1px solid ${c.border} !important;
      }
      .hw-progress-view .caption {
        background: ${c.progressCapBg} !important;
        color: ${c.fg} !important;
        border-bottom: 1px solid ${c.border} !important;
      }

      .console-contents { background: ${c.consoleBg} !important; }
      .console-header {
        background: ${c.consoleHeaderBg} !important;
        color: ${c.fg} !important;
        border-bottom: 1px solid ${c.border} !important;
      }
    `
        }

        loader.init().then(monaco => {
            monaco.editor.defineTheme('synapse', {
                base: isColorDark(c.bg) ? 'vs-dark' : 'vs',
                inherit: true,
                rules: [],
                colors: {
                    'editor.background': c.bg,
                    'editor.foreground': c.fg,
                    'editor.lineHighlightBackground': c.textbox,
                    'editor.selectionBackground': c.btn + 'aa',
                    'editor.inactiveSelectionBackground': c.btn + '55',
                    'editorLineNumber.foreground': c.fg + '66',
                    'editorLineNumber.activeForeground': c.fg,
                    'editorCursor.foreground': c.fg,
                    'editorGutter.background': c.bg,
                    'editorWidget.background': c.dialog,
                    'editorWidget.border': c.border,
                    'editorSuggestWidget.background': c.dialog,
                    'editorSuggestWidget.border': c.border,
                    'editorSuggestWidget.foreground': c.fg,
                    'editorSuggestWidget.selectedBackground': c.btn,
                    'editorHoverWidget.background': c.dialog,
                    'editorHoverWidget.border': c.border,
                    'minimap.background': c.bg,
                    'minimapSlider.background': c.textbox + '55',
                    'minimapSlider.hoverBackground': c.textbox + 'aa',
                    'scrollbarSlider.background': c.textbox + '55',
                    'scrollbarSlider.hoverBackground': c.textbox + 'aa',
                    'scrollbarSlider.activeBackground': c.btn,
                    'editorIndentGuide.background': c.border,
                    'editorBracketMatch.background': c.btn + '44',
                    'editorBracketMatch.border': c.fg + '88',
                    'input.background': c.textbox,
                    'input.foreground': c.fg,
                    'input.border': c.border,
                    'focusBorder': c.accent,
                    'list.hoverBackground': c.btn,
                    'list.activeSelectionBackground': c.btn,
                    'list.activeSelectionForeground': c.fg,
                },
            })
            monaco.editor.setTheme('synapse')
        })

    } catch (e) {

    }
}
export function getAvailableThemes() {
    return Object.keys(themeModules);
}

export function themeIdToDisplayName(id) {
    if (id === 'cool-kid') return 'Cool Kid';
    if (id === 'elysian-fields') return 'Elysian Fields';
    if (id === 'hollywood-classic') return 'Hollywood Classic';
    if (id === 'hollywood-glass') return 'Hollywood Glass';
    if (id === 'hollywood-light') return 'Hollywood Light';
    if (id === 'hollywood-novo') return 'Hollywood Novo';
    if (id === 'hollywood-fluent') return 'Hollywood Fluent';
    return id.charAt(0).toUpperCase() + id.slice(1);
}

export async function getThemeSettings(themeId) {
    if (themeJsonLoaders[themeId]) {
        try {
            const mod = await themeJsonLoaders[themeId]()
            const themeJson = mod.default || mod
            if (themeJson.settingOverrides) {
                return {
                    id: themeJson.id || themeId,
                    name: themeJson.name || themeId,
                    ...themeJson.settingOverrides
                }
            }
            return themeJson
        } catch (e) {
            return { id: themeId }
        }
    }
    return { id: themeId }
}

export async function applyCustomCssTheme(css) {
    return false;
}

