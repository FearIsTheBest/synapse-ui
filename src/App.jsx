import './index.css'
import { useState, useEffect, useRef, useMemo } from 'react'
import React from 'react'
import { Editor, loader } from '@monaco-editor/react'
import './styles/hollywood-base.css'
const logoWhite = './assets/logo_white.svg';
const loginBgMorning = './assets/loginbgs/morning.png';
const loginBgDay = './assets/loginbgs/day.png';
const loginBgEvening = './assets/loginbgs/evening.png';
const loginBgNight = './assets/loginbgs/night.png';
import 'iconify-icon';
import { applyTheme, applyCustomCssTheme, initLSP, getThemeSettings, getAvailableThemes, themeIdToDisplayName } from './themeloader'
import Console from "./Console";
// yea
const CB = ({ value, onChange }) => (
    <div
      className={`hw-checkbox relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full cursor-pointer border transition-colors duration-200 ease-in-out ${value ? 'on' : ''}`}
      onClick={() => onChange(!value)}
    >
      <div
        className="pointer-events-none relative inline-block rounded-full h-4 w-4 transform bg-white shadow transition-all duration-200 ease-in-out"
        style={{ transform: value ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
      ></div>
    </div>
)

const OptBtn = ({ active, onClick, icon, label }) => (
    <button className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default ${active ? 'outline outline-2' : ''}`} onClick={onClick}>
      <iconify-icon icon={icon} className="flex items-center justify-center"></iconify-icon>
      <div className="hidden lg:flex">{label}</div>
    </button>
)

function FileNode({ name, path, isDir, onContextMenu, folderColors, search }) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([])

  const toggle = async (force) => {
    if (!isDir) return
    if (!open || force === true) {
      if (force === false && open) return setOpen(false);
      
      const entries = await window.electron?.readDir(path)
      setChildren(entries || [])
    }
    setOpen(v => force !== undefined ? force : !v)
  }
  useEffect(() => {
    if (search && isDir && !open) {
        toggle(true);
    }
  }, [search, isDir]);

  const iconColor = isDir ? folderColors?.[path] : undefined;

  const filteredChildren = useMemo(() => {
    if (!search) return children;
    return children.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || c.isDir
    );
  }, [children, search]);

  const isMatch = useMemo(() => {
      if (!search) return true;
      if (name.toLowerCase().includes(search.toLowerCase())) return true;
      if (isDir && filteredChildren.length > 0) return true;
      return false;
  }, [name, search, filteredChildren, isDir]);

  if (!isMatch && search) return null;

  return (
    <div className="node">
      <div>
        <div
          className="node-caption group flex items-center py-0.5 pl-1 opacity-70 hover:opacity-100 active:opacity-50 cursor-pointer"
          draggable
          onClick={() => toggle()}
          onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, path, isDir }) }}
        >
          {isDir ? (
            <iconify-icon icon="fluent:chevron-right-20-filled" className="flex items-center justify-center transition-all text-[0] opacity-0 group-hover:text-base group-hover:opacity-100" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}></iconify-icon>
          ) : (
            <iconify-icon icon="fluent:chevron-right-20-filled" className="flex items-center justify-center transition-all rotate-0 text-[0] opacity-0"></iconify-icon>
          )}
          <iconify-icon icon={isDir ? 'fluent:folder-20-filled' : 'fluent:document-20-filled'} className="flex items-center justify-center w-4 min-w-[1rem]" style={iconColor ? { color: iconColor } : (!isDir ? { color: 'rgb(96, 165, 250)' } : {})}></iconify-icon>
          <div className="ml-2 overflow-ellipsis whitespace-nowrap">
            {search ? (
                <span>
                    {name.split(new RegExp(`(${search})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === search.toLowerCase() ? <span key={i} className="bg-blue-500/30 text-blue-200">{part}</span> : part
                    )}
                </span>
            ) : name}
          </div>
        </div>
      </div>
      {(open || search) && children.length > 0 && (
        <div className="children ml-2">
          {filteredChildren
            .sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name))
            .map(child => (
              <FileNode key={child.path} {...child} onContextMenu={onContextMenu} folderColors={folderColors} search={search} />
            ))}
        </div>
      )}
    </div>
  )
}

function DirTree({ dirPath, onContextMenu, folderColors, search }) {
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState([])
  const name = dirPath.split(/[\\/]/).pop()

  const toggle = async (force) => {
    if ((!open || force === true) && (force !== false)) {
      const entries = await window.electron?.readDir(dirPath)
      setChildren(entries || [])
    }
    setOpen(v => force !== undefined ? force : !v)
  }

  useEffect(() => {
    if (search) {
      if (!open) toggle(true);
    }
  }, [search])

  const iconColor = folderColors?.[dirPath];

  const filteredChildren = useMemo(() => {
      if (!search) return children;
      
      return children.filter(c => 
          c.name.toLowerCase().includes(search.toLowerCase()) || c.isDir
      );
  }, [children, search]);
  
  const hasMatches = useMemo(() => {
     if (!search) return true;
     if (name.toLowerCase().includes(search.toLowerCase())) return true;
     return filteredChildren.length > 0;
  }, [name, search, filteredChildren]);

  if (!hasMatches && search) return null;

  return (
    <div className="node">
      <div>
        <div
          className="node-caption group flex items-center py-0.5 pl-1 opacity-70 hover:opacity-100 active:opacity-50 cursor-pointer"
          draggable
          onClick={() => toggle()}
          onContextMenu={(e) => { e.preventDefault(); onContextMenu({ x: e.clientX, y: e.clientY, path: dirPath, isDir: true }) }}
        >
          <iconify-icon icon="fluent:chevron-right-20-filled" className="flex items-center justify-center transition-all text-[0] opacity-0 group-hover:text-base group-hover:opacity-100" style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}></iconify-icon>
          <iconify-icon icon="fluent:folder-link-20-filled" className="flex items-center justify-center w-4 min-w-[1rem]" style={iconColor ? { color: iconColor } : {}}></iconify-icon>
          <div className="ml-2 overflow-ellipsis whitespace-nowrap">
            {search ? (
                <span>
                    {name.split(new RegExp(`(${search})`, 'gi')).map((part, i) => 
                        part.toLowerCase() === search.toLowerCase() ? <span key={i} className="bg-yellow-500/30 text-yellow-200">{part}</span> : part
                    )}
                </span>
            ) : name}
          </div>
        </div>
      </div>
      {(open || search) && (
        <div className="children ml-2">
          {filteredChildren
            .sort((a, b) => (b.isDir - a.isDir) || a.name.localeCompare(b.name))
            .map(child => (
              <FileNode key={child.path} {...child} onContextMenu={onContextMenu} folderColors={folderColors} search={search} />
            ))}
        </div>
      )}
    </div>
  )
}

function SynapseAIKeyDialog({ onClose, onKeySaved }) {
  const [apiKey, setApiKey] = useState('');

  const handleOk = () => {
    if (apiKey.trim()) {
      localStorage.setItem('synapseai_key', apiKey);
      onKeySaved(); 

      onClose();
    }
  };

  const handleCancel = () => {
    onClose();
  };

   return (
    <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 fixed inset-0 z-50">
      <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
        <div className="flex grow gap-4 p-4">
          <iconify-icon icon="fluent:key-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
          <div className="flex h-full flex-col gap-2">
            <div className="caption align-top text-xl font-bold">SynapseAI Key</div>
            <div>
              Input your SynapseAI key below. You can get your free key at the{' '}
              <a 
                href="https://console.groq.com/keys" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-300"
              >
                Groq Console
              </a>.
            </div>
          </div>
        </div>
        <div className="mx-2 mb-2">
          <div className="hw-textbox rounded-md px-2 py-1">
            <div className="inner flex items-center gap-2 border px-1 py-0.5">
              <input 
                className="w-full border-none bg-transparent text-inherit outline-none" 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                autoFocus
              />
            </div>
          </div>
        </div>
        <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
          <div className="ml-auto flex gap-2">
            <button 
              className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700"
              onClick={handleOk}
            >
              Ok
            </button>
            <button 
              className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-pointer hover:bg-gray-700"
              onClick={handleCancel}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const SettingsRow = ({ label, description, children, content, search }) => {
  const matches = !search || 
    label.toLowerCase().includes(search.toLowerCase()) || 
    (description && description.toLowerCase().includes(search.toLowerCase()));

  if (search && !matches) return null;

  return (
    <div className="action-container flex w-full items-center px-2 py-1 lg:px-3 lg:py-2">
      <div className="text flex flex-col">
        <div className="caption text-xs lg:text-base">{label}</div>
        <div className="description text-xs opacity-50">{description}</div>
      </div>
      <div className="ml-auto flex gap-1 lg:gap-4">
        {children || content}
      </div>
    </div>
  );
};

function App() {
  useEffect(() => {
    loader.init().then(monaco => {
      try {
        monaco.languages.registerDocumentFormattingEditProvider('lua', {
          provideDocumentFormattingEdits: (model) => {
            const lines = model.getLinesContent();
            const edits = [];
            let indentLevel = 0;
            const indentChar = '\t'; 

            for (let i = 0; i < lines.length; i++) {
              const line = lines[i];
              const trimmed = line.trim();
              
              if (trimmed.length === 0) continue; 

              if (/^(end|until|else|elseif|\}|\))/.test(trimmed)) {
                 indentLevel = Math.max(0, indentLevel - 1);
              }

              const newIndent = indentChar.repeat(indentLevel);
              const currentIndentMatch = line.match(/^\s*/);
              const currentIndent = currentIndentMatch ? currentIndentMatch[0] : '';
              
              if (currentIndent !== newIndent) {
                edits.push({
                  range: new monaco.Range(i + 1, 1, i + 1, currentIndent.length + 1),
                  text: newIndent
                });
              }

              const isBlockStart = /\b(then|do|repeat)\b\s*(--.*)?$/.test(trimmed) || 
                                   /(\{|\()\s*(--.*)?$/.test(trimmed) ||
                                   /\bfunction\b/.test(trimmed);
              
              const isInline = /\bend\b\s*(--.*)?$/.test(trimmed) || /\}\s*(--.*)?$/.test(trimmed);

              if (isBlockStart && !isInline) {
                 indentLevel++;
              } else if (/^(else|elseif)\b/.test(trimmed)) {
                 indentLevel++;
              }
            }
            return edits;
          }
        });
      } catch (e) {
        // Provider might already be registered
      }
    });
  }, []);

  const [showAiError, setShowAiError] = useState(false)

  const [msConnected, setMsConnected] = useState(false)
  const [msConnecting, setMsConnecting] = useState(false)
  const [msError, setMsError] = useState(null)
  const [msPid, setMsPid] = useState(null)
  const [injectionEnabled, setInjectionEnabled] = useState(true) 

  const [tasks, setTasks] = useState([]) 

  const taskIdRef = useRef(0)

  const addTask = (label) => {
    const id = ++taskIdRef.current
    setTasks(prev => [...prev, { id, label, status: 'running' }])
    return id
  }
  const updateTask = (id, label, status) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, label, status } : t))

    if (status === 'done' || status === 'error') {
      setTimeout(() => setTasks(prev => prev.filter(t => t.id !== id)), 2000)
    }
  }

  const msAttachingRef = useRef(false) 

  const scanIntervalRef = useRef(null)
  const lastScanFailRef = useRef(false)  

  const msAttach = async () => {
    if (msAttachingRef.current || msConnected || !injectionEnabled) return
    msAttachingRef.current = true
    setMsConnecting(true)
    setMsError(null)

    try {
      let instances = []
      try { instances = await window.electron?.msScan?.() ?? [] } catch {}
      const portsToTry = instances.length > 0
        ? instances.map(i => i.port)
        : Array.from({ length: 10 }, (_, i) => 5553 + i)

      let result = null
      for (const port of portsToTry) {
        try {
          result = await window.electron.msAttach(port)
          break
        } catch {  }
      }

      if (!result) return

      const taskId = addTask('Injecting into Roblox...')
      setMsConnected(true)
      setMsPid(result.pid ?? null)
      updateTask(taskId, result.pid ? `Attached to PID ${result.pid}` : 'Injected successfully!', 'done')
    } catch {
    } finally {
      setMsConnecting(false)
      msAttachingRef.current = false
    }
  }

  const toggleInjection = () => {
    if (injectionEnabled) {

      if (msConnected) {
        msDetach()
      }
      setInjectionEnabled(false)
    } else {

      setInjectionEnabled(true)
    }
  }

  const msDetach = async () => {
    msDetachingRef.current = true
    await window.electron?.msDetach?.()
    setMsConnected(false)
    setMsPid(null)
  }

  const msExecuteScript = (script) => {
    if (!msConnected) return
    window.electron?.msExecute?.(script)
  }

  const [activePage, setActivePage] = useState('editor');
  const [selectedTheme, setSelectedTheme] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('synapse_settings') || '{}')
      if (saved.selectedTheme) return saved.selectedTheme;
      
      // Fallback for migration
      const legacy = localStorage.getItem('selectedTheme');
      if (legacy) return legacy;
      
      return 'Hollywood Classic'
    } catch {
      return 'Hollywood Classic'
    }
  })
  const [showDialog, setShowDialog] = useState(true)
  const [showChangelog, setShowChangelog] = useState(false)
  const [gatewayVisible, setGatewayVisible] = useState(true)
  const [tabs, setTabs] = useState(() => {
    try {
      const savedTabs = localStorage.getItem('synapse_tabs');
      if (savedTabs) return JSON.parse(savedTabs);

      const savedSettings = JSON.parse(localStorage.getItem('synapse_settings') || '{}');
      const defaultContent = savedSettings.defaultTabContent || '';
       return [{ id: 1, title: 'Untitled tab', content: defaultContent }];
    } catch {
       return [{ id: 1, title: 'Untitled tab', content: '' }];
    }
  })
  const [activeTab, setActiveTab] = useState(1)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const [folderColors, setFolderColors] = useState(() => {
    try {
      const saved = localStorage.getItem('synapse_folderColors');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem('synapse_folderColors', JSON.stringify(folderColors));
  }, [folderColors]);

  const [accentDialogDetails, setAccentDialogDetails] = useState(null)
  const [enablePlugins, setEnablePlugins] = useState(false)
  const [showPluginWarning, setShowPluginWarning] = useState(false)
  const [showThemeOverride, setShowThemeOverride] = useState(false)
  const [pendingThemeSettings, setPendingThemeSettings] = useState(null)

  const [contextMenu, setContextMenu] = useState(null) 

  const [tabContextMenu, setTabContextMenu] = useState(null) 

  const [loginErrorMenu, setloginErrorMenu] = useState(null) 

  const [pendingBookmark, setPendingBookmark] = useState(null) 

  const [bookmarks, setBookmarks] = useState([])
  const [showConsole, setShowConsole] = useState(false);

  const [fsOpen, setFsOpen] = useState(true)
  const [bookmarksOpen, setBookmarksOpen] = useState(true)
  const [showAddBookmark, setShowAddBookmark] = useState(false)
  const [bookmarkInput, setBookmarkInput] = useState('')
  const [gistsOpen, setGistsOpen] = useState(true)
  const [showAiSettings, setShowAiSettings] = useState(false)

  const [aiView, setAiView] = useState('menu')          

  const [hasOpenAIKey, setHasOpenAIKey] = useState(() => !!localStorage.getItem('synapseai_key'))
  const [aiModelDropdownOpen, setAiModelDropdownOpen] = useState(false)
  const [showSynapseKeyDialog, setShowSynapseKeyDialog] = useState(false)
  const [aiMessages, setAiMessages] = useState([])      

//const [aiInput, setAiInput] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const sidebarRef = useRef(null)
  const editorsRef = useRef({})
  const modelsRef = useRef({})
  const activeTabRef = useRef(activeTab)
  const isMounted = useRef(false)

  const aiInputRef = useRef(null)
  const aiStreamBufRef = useRef('')

  const [sidebarWidth, setSidebarWidth] = useState(300)
  const [aiPanelWidth, setAiPanelWidth] = useState(300)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [sidebarPos, setSidebarPos] = useState(1) 
  const [aiStreamToEditor, setAiStreamToEditor] = useState(false)

  const getTabContent = (tabId) => modelsRef.current[tabId]?.getValue() ?? ''

  const appendToEditor = (token, tabId) => {
    const model = modelsRef.current[tabId]
    const editor = editorsRef.current[tabId]
    if (!model || !editor) return
    const lineCount = model.getLineCount()
    const col = model.getLineMaxColumn(lineCount)
    editor.executeEdits('synapseai', [{
      range: { startLineNumber: lineCount, startColumn: col, endLineNumber: lineCount, endColumn: col },
      text: token,
      forceMoveMarkers: true,
    }])
    const newLineCount = model.getLineCount()
    const newCol = model.getLineMaxColumn(newLineCount)
    editor.setPosition({ lineNumber: newLineCount, column: newCol })
    editor.revealLine(newLineCount)
  }

  const insertTokenAtCursor = (token, tabId) => {
    const editor = editorsRef.current[tabId]
    if (!editor) return
    const selection = editor.getSelection()
    editor.executeEdits('synapseai', [{ range: selection, text: token, forceMoveMarkers: true }])
    // Ensure cursor follows
    const endPos = editor.getPosition()
    editor.revealPosition(endPos)
  }


  const groqStream = async (messages, onToken) => {
    const key = localStorage.getItem('synapseai_key')
    if (!key) { setShowSynapseKeyDialog(true); return null }
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
      body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages, stream: true })
    })
    if (res.status === 401 || res.status === 402 || res.status === 403 || res.status === 429) {
      setShowAiError(true); return null
    }
    if (!res.ok) throw new Error(`API error ${res.status}`)
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    let leftover = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = leftover + decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')
      leftover = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (data === '[DONE]') continue
        try {
          const token = JSON.parse(data).choices?.[0]?.delta?.content ?? ''
          if (token) onToken(token)
        } catch {  }
      }
    }
  }

  const aiMessagesRef = useRef([])

  const setAiMessagesSynced = (val) => {
    const resolved = typeof val === 'function' ? val(aiMessagesRef.current) : val
    aiMessagesRef.current = resolved
    setAiMessages(resolved)
  }

  const parseMessage = (content) => {
    const segments = []
    const regex = /```(\w*)\n?([\s\S]*?)```/g
    let last = 0, match
    while ((match = regex.exec(content)) !== null) {
      if (match.index > last) segments.push({ type: 'text', content: content.slice(last, match.index) })
      segments.push({ type: 'code', lang: match[1] || 'lua', content: match[2] })
      last = match.index + match[0].length
    }
    if (last < content.length) segments.push({ type: 'text', content: content.slice(last) })
    return segments
  }

  const applyCodeToEditor = (code) => {
    const tabId = activeTabRef.current
    const model = modelsRef.current[tabId]
    const editor = editorsRef.current[tabId]
    if (!model || !editor) return
    editor.executeEdits('synapseai', [{ range: model.getFullModelRange(), text: code, forceMoveMarkers: true }])
    editor.setPosition({ lineNumber: 1, column: 1 })
    editor.focus()
  }

  const insertCodeAtCursor = (code) => {
    const tabId = activeTabRef.current
    const editor = editorsRef.current[tabId]
    if (!editor) return

    const selection = editor.getSelection()
    const op = {
      range: selection,
      text: code,
      forceMoveMarkers: true
    }
    editor.executeEdits('synapseai', [op])
    editor.focus()
  }

  const copyCodeToClipboard = (code) => {
    navigator.clipboard.writeText(code)
  }

  const sendAiMessage = async () => {
    const text = aiInputRef.current?.value?.trim() ?? ''
    if (!text || aiLoading) return

    const tabId = activeTabRef.current
    const editorCode = getTabContent(tabId)
    const editor = editorsRef.current[tabId]
    const selection = editor?.getSelection()
    const selectedText = selection && !selection.isEmpty() ? editor.getModel().getValueInRange(selection) : ''
    
    // Determine context based on selection or full file
    let contextNote = ''
    if (selectedText) {
      contextNote = `\n\n[User Selected Code to Modify]:\n\`\`\`lua\n${selectedText}\n\`\`\`\n\n[Full File Context (for reference references)]:\n\`\`\`lua\n${editorCode.slice(0, 2000)}\n\`\`\``
    } else {
      contextNote = editorCode.trim() 
        ? `\n\n[Current Active File Context]:\n\`\`\`lua\n${editorCode.slice(0, 3000)}${editorCode.length > 3000 ? '\n... (truncated)' : ''}\n\`\`\``
        : ''
    }

    let systemPrompt
    if (aiStreamToEditor) {
      if (selectedText) {
        systemPrompt = `You are a code refactoring engine. Replace the SELECTED code based on the user's request.
Output ONLY the replacement code. Do NOT output markdown backticks. Do NOT output conversational text.
Your output will directly replace the user's selection.` 
      } else {
        systemPrompt = `You are a code completion engine. Continue the code or insert new code at the cursor.
Output ONLY valid Lua code (or comments). Do NOT output markdown backticks. Do NOT include conversational text.`
      }
      systemPrompt += `\n${contextNote}`
    } else {
      systemPrompt = `You are SynapseAI, an intelligent coding companion for hollywood (Roblox Lua). 
Your task is to help the user write, debug, and optimize their scripts.

GUIDELINES:
- Provide concise, direct answers.
- When generating code, use \`\`\`lua blocks.
- If the user asks for a modification, show ONLY the modified parts or functions unless a full rewrite is requested.
- Do NOT repeat the user's existing code verbatim unless necessary for explanation.
- Assume the user is familiar with Lua but needs help with logic or hollywood specific APIs.

${contextNote}`
    }

    const snapshot = [...aiMessagesRef.current, { role: 'user', content: text }]
    setAiMessagesSynced([...snapshot, { role: 'assistant', content: '' }])
    if (aiInputRef.current) aiInputRef.current.value = ''
    setAiLoading(true)
    aiStreamBufRef.current = ''
    
    // Markdown stripping state, keeping track of starting backticks
    let backtickBuffer = ''
    let isStartOfStream = true

    let rafId = null
    try {
      await groqStream(
        [{ role: 'system', content: systemPrompt }, ...snapshot.map(m => ({ role: m.role, content: m.content }))],
        (token) => {
          
          if (aiStreamToEditor) {
            let processedToken = token
            
            // Markdown stripping logic
            if (isStartOfStream) {
               backtickBuffer += token
               const trimmed = backtickBuffer.trimStart()
               
               // If buffer starts with `, wait for more
               if (trimmed.startsWith('`')) {
                  const newlineIndex = backtickBuffer.indexOf('\n')
                  
                  if (newlineIndex !== -1) {
                     // We have a full line. Check if it's a code block header.
                     // A valid header is ```lua\n or just ```\n
                     if (/^```\w*\n?$/.test(backtickBuffer.slice(0, newlineIndex + 1).trim())) {
                        // It IS a header. Strip it.
                        // Output everything AFTER the newline.
                        processedToken = backtickBuffer.slice(newlineIndex + 1)
                     } else {
                        // Not a header (e.g. `local x = 1` inline code at start?), flush all.
                        processedToken = backtickBuffer
                     }
                     backtickBuffer = ''
                     isStartOfStream = false // Done scanning for start
                  } else if (backtickBuffer.length > 25) { 
                     // Too long without newline -> Not a markdown header, flush raw buffer
                     processedToken = backtickBuffer
                     backtickBuffer = ''
                     isStartOfStream = false
                  } else {
                     // Still incomplete line, wait for next token
                     return 
                  }
               } else {
                 // Does not start with `, flush immediately
                 processedToken = backtickBuffer
                 backtickBuffer = ''
                 isStartOfStream = false
               }
            }
            
            if (processedToken) {
               insertTokenAtCursor(processedToken, activeTabRef.current)
            }
          }

          aiStreamBufRef.current += token
          
          if (rafId) return
          rafId = requestAnimationFrame(() => {
            rafId = null
            const buf = aiStreamBufRef.current
            setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: buf }; return u })
          })
        }
      )
      if (rafId) cancelAnimationFrame(rafId)
      const finalBuf = aiStreamBufRef.current
      setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: finalBuf }; return u })
    } catch (err) {
      setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Error: ${err.message}` }; return u })
    } finally {
      setAiLoading(false)
    }
  }

  const explainCode = async () => {
    const tabId = activeTabRef.current
    const code = getTabContent(tabId)
    if (!code.trim() || aiLoading) return
    setAiLoading(true)
    
    // Clear editor to prepare for streaming rewrite
    const model = modelsRef.current[tabId]
    const editor = editorsRef.current[tabId]
    if (model && editor) {
      editor.pushUndoStop() // Save undo state before clearing
      editor.executeEdits('synapseai', [{ range: model.getFullModelRange(), text: '', forceMoveMarkers: true }])
      editor.setPosition({ lineNumber: 1, column: 1 })
    }

    const truncated = code.slice(0, 8000)
    const prompt = `Rewrite the following Lua script, adding helpful comments to explain the logic. Return ONLY the raw rewritten code (no markdown, no conversational text):\n\n${truncated}`
    const snapshot = [...aiMessagesRef.current, { role: 'user', content: "Add comments to my code." }]
    setAiMessagesSynced([...snapshot, { role: 'assistant', content: 'Adding comments...' }])
    
    aiStreamBufRef.current = ''
    let rafId = null
    try {
      await groqStream(
        [{ role: 'system', content: 'You are SynapseAI. Rewrite the code with comments. Output ONLY valid raw Lua code. No markdown.' }, { role: 'user', content: prompt }],
        (token) => {
          appendToEditor(token, tabId)
          aiStreamBufRef.current += token
          if (rafId) return
          rafId = requestAnimationFrame(() => {
            rafId = null
            const buf = aiStreamBufRef.current
            setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: "Rewriting code with comments..." }; return u })
          })
        }
      )
      if (rafId) cancelAnimationFrame(rafId)
      const finalBuf = aiStreamBufRef.current
      setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: "Done adding comments." }; return u })
    } catch (err) {
      // If error, try to restore (simple undo might be needed by user)
      setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Error: ${err.message}` }; return u })
      // Ideally we would restore the original code here if it failed completely, but Monaco allows Undo.
    } finally {
      setAiLoading(false)
    }
  }

  const renameVariables = async () => {
    const tabId = activeTabRef.current
    const code = getTabContent(tabId)
    if (!code.trim() || aiLoading) return
    setAiLoading(true)

    const model = modelsRef.current[tabId]
    const editor = editorsRef.current[tabId]

    if (model && editor) {
      editor.executeEdits('synapseai', [{ range: model.getFullModelRange(), text: '', forceMoveMarkers: true }])
      editor.setPosition({ lineNumber: 1, column: 1 })
    }
    const prompt = `Rewrite the following Lua code with all variables renamed to clear, descriptive names. Return ONLY the raw rewritten code — no markdown fences, no explanation, nothing else:\n\n${code}`
    const snapshot = [...aiMessagesRef.current, { role: 'user', content: prompt }]
    setAiMessagesSynced([...snapshot, { role: 'assistant', content: '' }])
    aiStreamBufRef.current = ''
    let rafId = null
    try {
      await groqStream(
        [{ role: 'system', content: 'You are SynapseAI. When rewriting code, output ONLY the raw code. No markdown. No explanation.' }, ...snapshot],
        (token) => {

          appendToEditor(token, tabId)
          aiStreamBufRef.current += token
          if (rafId) return
          rafId = requestAnimationFrame(() => {
            rafId = null
            const buf = aiStreamBufRef.current
            setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: buf }; return u })
          })
        }
      )
      if (rafId) cancelAnimationFrame(rafId)
      const finalBuf = aiStreamBufRef.current
      setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: finalBuf }; return u })
    } catch (err) {
      setAiMessagesSynced(prev => { const u = [...prev]; u[u.length - 1] = { role: 'assistant', content: `Error: ${err.message}` }; return u })
    } finally {
      setAiLoading(false)
    }
  }

  const [directories, setDirectories] = useState([])
  const [fileSearch, setFileSearch] = useState('')
  const [selectedDir, setSelectedDir] = useState(null)
  const [activeSettingsSection, setActiveSettingsSection] = useState('appsettings')
  const [settingsSearch, setSettingsSearch] = useState('')
  const settingsPagesRef = useRef(null)

  const handleSettingsScroll = () => {
    if (!settingsPagesRef.current) return;
    const scrollPos = settingsPagesRef.current.scrollTop + 100; // offset
    const sections = ['appsettings', 'settings-category-editor', 'settings-category-console', 'settings-category-interface', 'settings-category-misc'];
    
    for (const section of sections) {
      const el = document.getElementById(section);
      if (el) {
        if (el.offsetTop <= scrollPos && (el.offsetTop + el.offsetHeight) > scrollPos) {
          setActiveSettingsSection(section);
          break;
        }
      }
    }
  };

  const scrollToSettings = (id) => {
    setActiveSettingsSection(id);
    const container = settingsPagesRef.current;
    const el = document.getElementById(id);
    if (el && container) {
      container.scrollTo({ top: el.offsetTop, behavior: 'smooth' });
    }
  };


  const [showGithubDialog, setShowGithubDialog] = useState(false)
  const [showGithubPAT, setShowGithubPAT] = useState(false)
  const [githubPATInput, setGithubPATInput] = useState('')

  const [githubPAT, setGithubPAT] = useState('')
  const [gists, setGists] = useState([])
  const [gistsLoading, setGistsLoading] = useState(false)
  const [gistsError, setGistsError] = useState(null)

  const [aiFeatures, setAiFeatures] = useState(true)
  const [compactButtons, setCompactButtons] = useState(false)
  const [compactTabs, setCompactTabs] = useState(false)
  const [contextualExecution, setContextualExecution] = useState(false)
  const [defaultTabContent, setDefaultTabContent] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('synapse_settings') || '{}');
      return s.defaultTabContent !== undefined ? s.defaultTabContent : "print('Synapse winning!')";
    } catch { return "print('Synapse winning!')"; }
  });
  const [defaultTabContentSaved, setDefaultTabContentSaved] = useState(() => {
    try {
      const s = JSON.parse(localStorage.getItem('synapse_settings') || '{}');
      return s.defaultTabContent !== undefined ? s.defaultTabContent : "print('Synapse winning!')";
    } catch { return "print('Synapse winning!')"; }
  });
  const [displayInfoArea, setDisplayInfoArea] = useState(true)
  const [actionBarPos, setActionBarPos] = useState(1) 

  const [editorStyle, setEditorStyle] = useState(0) 

  const [editorScrollSpeed, setEditorScrollSpeed] = useState(300)
  const [fontSize, setFontSize] = useState(19)
  const [formatOnSave, setFormatOnSave] = useState(false)
  const [hideSidebar, setHideSidebar] = useState(false)
  const [languageServerOpen, setLanguageServerOpen] = useState(false)
  const [ligatures, setLigatures] = useState(false)
  const [luaLSP, setLuaLSP] = useState(true)
  const [maxTokensPerLine, setMaxTokensPerLine] = useState(10000)
  const [minimap, setMinimap] = useState(1) 

  const [unsavedWarningTab, setUnsavedWarningTab] = useState(null) 

  const [showUnsavedWarnings, setShowUnsavedWarnings] = useState(false)
  const [smoothCursor, setSmoothCursor] = useState(true)
  const [smoothMovement, setSmoothMovement] = useState(true)
  const [stickyScroll, setStickyScroll] = useState(false)
  const [tabLength, setTabLength] = useState(4)
  const [wordWrap, setWordWrap] = useState(false)

  const [logLSPErrors, setLogLSPErrors] = useState(false)
  const [maxLogCount, setMaxLogCount] = useState(720)
  const [preserveLogs, setPreserveLogs] = useState(false)
  const [showConsoleAtLaunch, setShowConsoleAtLaunch] = useState(false)

  const [tabIcons, setTabIcons] = useState({}) 

  const [alwaysOnTop, setAlwaysOnTop] = useState(false)
  const [classicLayout, setClassicLayout] = useState(false)
  const [dealignNavbar, setDealignNavbar] = useState(false)
  const [forgetOnDisconnect, setForgetOnDisconnect] = useState(false)

  const formatOnSaveRef = useRef(false) 

  const tabsRef = useRef([])            

  const forgetOnDisconnectRef = useRef(false) 

  const contextualExecutionRef = useRef(false) 

  const [interfaceScale, setInterfaceScale] = useState(100)
  const [logToFile, setLogToFile] = useState(false)
  const [navbarStyle, setNavbarStyle] = useState(0) 

  const [silentLaunch, setSilentLaunch] = useState(false)
  const [transparentWindow, setTransparentWindow] = useState(false)
  const [useTrayIcon, setUseTrayIcon] = useState(true)

  const [showRenameTab, setShowRenameTab] = useState(false)
  const [renameTabId, setRenameTabId] = useState(null)
  const [renameInput, setRenameInput] = useState('')
  const [pinnedTabs, setPinnedTabs] = useState(new Set())
  const [autoExecuteTabs, setAutoExecuteTabs] = useState(new Set())

  const BookmarksSidebarModule = () => (
  <div className="module w-full overflow-x-hidden">
    {bookmarksOpen && (
      bookmarks.length === 0 ? (
        <div className="px-2 py-1 text-xs opacity-40 italic">
          No bookmarks yet. Open a <code>synx://add-bookmark/…</code> link to add one.
        </div>
      ) : (
        bookmarks.map((bm, i) => (
          <div
            key={i}
            className="node-caption group flex items-center py-0.5 pl-1 opacity-70 hover:opacity-100 cursor-pointer"
            title={bm.uri}
            onClick={() => {

              fetch(bm.uri)
                .then(r => r.text())
                .then(content => {
                  const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1
                  setTabs(prev => [...prev, { id: newId, title: bm.name, content }])
                  setActiveTab(newId)
                })
                .catch(() => {

                  const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1
                  setTabs(prev => [...prev, { id: newId, title: bm.name, content: `-- ${bm.uri}` }])
                  setActiveTab(newId)
                })
            }}
          >
            <iconify-icon
              icon="fluent:bookmark-20-filled"
              className="flex items-center justify-center w-4 min-w-[1rem]"
              style={{ color: 'rgb(250, 204, 21)' }}
            ></iconify-icon>
            <div className="ml-2 overflow-ellipsis whitespace-nowrap text-xs flex-1">{bm.name}</div>
            <div
              className="mr-1 opacity-0 group-hover:opacity-50 hover:!opacity-100 active:opacity-50 cursor-pointer"
              onClick={e => {
                e.stopPropagation()
                setBookmarks(prev => prev.filter((_, idx) => idx !== i))
              }}
            >
              <iconify-icon icon="fluent:dismiss-16-filled" className="flex items-center justify-center text-xs"></iconify-icon>
            </div>
          </div>
        ))
      )
    )}
  </div>
  )

  const PendingBookmarkDialog = () => pendingBookmark && (
  <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
    <div
      className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border"
      style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}
    >
      <div className="flex grow gap-4 p-4">
        <iconify-icon
          icon="fluent:bookmark-add-20-filled"
          className="flex items-center justify-center translate-y-1 text-2xl"
          style={{ color: 'white' }}
        ></iconify-icon>
        <div className="flex h-full flex-col gap-2">
          <div className="caption align-top text-xl font-bold">Add bookmark?</div>
          <div className="text-sm">
            <span className="opacity-60">hollywood wants to add a bookmark:</span>
            <div className="mt-1 font-semibold">{pendingBookmark.name}</div>
            <div
              className="mt-0.5 text-xs opacity-50 overflow-hidden overflow-ellipsis whitespace-nowrap max-w-xs"
              title={pendingBookmark.uri}
            >
              {pendingBookmark.uri}
            </div>
          </div>
        </div>
      </div>
      <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
        <div className="ml-auto flex gap-2">
          <button
            className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
            onClick={() => {
              setBookmarks(prev => {

                if (prev.some(b => b.uri === pendingBookmark.uri)) return prev
                return [...prev, pendingBookmark]
              })
              setPendingBookmark(null)

              setActivePage('editor')
            }}
          >
            Add bookmark
          </button>
          <button
            className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
            onClick={() => setPendingBookmark(null)}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  </div>
  )

   const [experimentalSettings, setExperimentalSettings] = useState(true)

  // Generate themeMap dynamically from available themes
  const generateThemeMap = () => {
    const themes = getAvailableThemes()
    const map = {}
    themes.forEach(themeId => {
      const displayName = themeIdToDisplayName(themeId)
      map[displayName] = themeId
    })
    return map
  }

  const themeMap = generateThemeMap()
  const availableThemeNames = Object.keys(themeMap).sort()

  function rgbToHex(rgb) {
    if (!rgb || rgb === 'transparent') return null
    const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
    if (!m) return null
    return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('')
  }

  function readClass(cls) {
    const el = document.createElement('div')
    el.className = cls
    el.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none'
    document.body.appendChild(el)
    const s = getComputedStyle(el)
    const result = { bg: s.backgroundColor, color: s.color }
    document.body.removeChild(el)
    return result
  }

  function isColorDark(hex) {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 < 128
  }

  const msDetachingRef = useRef(false) 

  useEffect(() => {
    const timer = setTimeout(() => setGatewayVisible(false), 1800)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!injectionEnabled) {

      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
      return
    }

    const startScanning = () => {

      if (!msConnected && !msAttachingRef.current) {
        msAttach()
      }

      scanIntervalRef.current = setInterval(() => {
        if (!msConnected && !msAttachingRef.current && injectionEnabled) {
          msAttach()
        }
      }, 3000)
    }

    startScanning()

    return () => {
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current)
        scanIntervalRef.current = null
      }
    }
  }, [injectionEnabled, msConnected])

  useEffect(() => {
    const offDisconnect = window.electron?.onMsDisconnected?.(() => {
      setMsConnected(false)
      setMsPid(null)
      msAttachingRef.current = false

      if (forgetOnDisconnectRef.current) {
        setTabs(prev => prev.map(t => ({ ...t, attachedInstance: null })))
      }

      if (!msDetachingRef.current) {
        const id = addTask('Disconnected from Roblox')
        setTimeout(() => updateTask(id, 'Disconnected from Roblox', 'error'), 0)
      }

      msDetachingRef.current = false
    })

    const offTask = window.electron?.onTask?.((data) => {
      if (data.type === 'add') addTask(data.label)
      if (data.type === 'update') updateTask(data.id, data.label, data.status)
    })

    return () => {
      offDisconnect?.()
      offTask?.()
    }
  }, [])
    useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('synapse_settings') || '{}')
      if (s.compactButtons       !== undefined) setCompactButtons(s.compactButtons)
      if (s.compactTabs          !== undefined) setCompactTabs(s.compactTabs)
      if (s.contextualExecution  !== undefined) setContextualExecution(s.contextualExecution)
      if (s.fontSize             !== undefined) setFontSize(s.fontSize)
      if (s.ligatures            !== undefined) setLigatures(s.ligatures)
      if (s.minimap              !== undefined) setMinimap(s.minimap)
      if (s.smoothCursor         !== undefined) setSmoothCursor(s.smoothCursor)
      if (s.smoothMovement       !== undefined) setSmoothMovement(s.smoothMovement)
      if (s.stickyScroll         !== undefined) setStickyScroll(s.stickyScroll)
      if (s.tabLength            !== undefined) setTabLength(s.tabLength)
      if (s.wordWrap             !== undefined) setWordWrap(s.wordWrap)
      if (s.formatOnSave         !== undefined) setFormatOnSave(s.formatOnSave)
      if (s.luaLSP               !== undefined) setLuaLSP(s.luaLSP)
      if (s.maxTokensPerLine     !== undefined) setMaxTokensPerLine(s.maxTokensPerLine)
      if (s.logLSPErrors         !== undefined) setLogLSPErrors(s.logLSPErrors)
      if (s.maxLogCount          !== undefined) setMaxLogCount(s.maxLogCount)
      if (s.preserveLogs         !== undefined) setPreserveLogs(s.preserveLogs)
      if (s.showConsoleAtLaunch  !== undefined) { setShowConsoleAtLaunch(s.showConsoleAtLaunch); if (s.showConsoleAtLaunch) window.electron?.openConsole?.() }
      if (s.alwaysOnTop          !== undefined) setAlwaysOnTop(s.alwaysOnTop)
      if (s.classicLayout        !== undefined) setClassicLayout(s.classicLayout)
      if (s.dealignNavbar        !== undefined) setDealignNavbar(s.dealignNavbar)
      if (s.forgetOnDisconnect   !== undefined) setForgetOnDisconnect(s.forgetOnDisconnect)
      if (s.interfaceScale       !== undefined) setInterfaceScale(s.interfaceScale)
      if (s.logToFile            !== undefined) setLogToFile(s.logToFile)
      if (s.silentLaunch         !== undefined) setSilentLaunch(s.silentLaunch)
      if (s.transparentWindow    !== undefined) setTransparentWindow(s.transparentWindow)
      if (s.useTrayIcon          !== undefined) setUseTrayIcon(s.useTrayIcon)
      if (s.navbarStyle          !== undefined) setNavbarStyle(s.navbarStyle)
      if (s.sidebarPos           !== undefined) setSidebarPos(s.sidebarPos)
      if (s.actionBarPos         !== undefined) setActionBarPos(s.actionBarPos)
      if (s.editorStyle          !== undefined) setEditorStyle(s.editorStyle)
      if (s.displayInfoArea      !== undefined) setDisplayInfoArea(s.displayInfoArea)
      if (s.hideSidebar          !== undefined) setHideSidebar(s.hideSidebar)
      if (s.defaultTabContent    !== undefined) { setDefaultTabContent(s.defaultTabContent); setDefaultTabContentSaved(s.defaultTabContent) }
      if (s.editorScrollSpeed    !== undefined) setEditorScrollSpeed(s.editorScrollSpeed)
      if (s.aiFeatures           !== undefined) setAiFeatures(s.aiFeatures)
      if (s.showUnsavedWarnings  !== undefined) setShowUnsavedWarnings(s.showUnsavedWarnings)
      if (s.experimentalSettings !== undefined) setExperimentalSettings(s.experimentalSettings)
      if (s.directories          !== undefined) setDirectories(s.directories)
    } catch {}
  }, []) 

  useEffect(() => {
    if (!isMounted.current) return
    try {
      localStorage.setItem('synapse_settings', JSON.stringify({
        compactButtons, compactTabs, contextualExecution,
        fontSize, ligatures, minimap, smoothCursor, smoothMovement,
        stickyScroll, tabLength, wordWrap, formatOnSave,
        luaLSP, maxTokensPerLine, logLSPErrors, maxLogCount, preserveLogs,
        showConsoleAtLaunch, alwaysOnTop, classicLayout, dealignNavbar,
        forgetOnDisconnect, interfaceScale,
        logToFile, silentLaunch, transparentWindow, useTrayIcon,
        navbarStyle, sidebarPos, actionBarPos, editorStyle,
        displayInfoArea, hideSidebar, defaultTabContent: defaultTabContentSaved,
        editorScrollSpeed, aiFeatures, showUnsavedWarnings, experimentalSettings,
        directories, selectedTheme, // Save theme here
      }))
    } catch {}
  }, [
    compactButtons, compactTabs, contextualExecution,
    fontSize, ligatures, minimap, smoothCursor, smoothMovement,
    stickyScroll, tabLength, wordWrap, formatOnSave,
    luaLSP, maxTokensPerLine, logLSPErrors, maxLogCount, preserveLogs,
    showConsoleAtLaunch, alwaysOnTop, classicLayout, dealignNavbar,
    forgetOnDisconnect, interfaceScale,
    logToFile, silentLaunch, transparentWindow, useTrayIcon,
    navbarStyle, sidebarPos, actionBarPos, editorStyle,
    displayInfoArea, hideSidebar, defaultTabContentSaved,
    editorScrollSpeed, aiFeatures, showUnsavedWarnings, experimentalSettings,
    directories, selectedTheme, // Add theme to dependency array
  ])

  useEffect(() => { isMounted.current = true }, [])

  useEffect(() => { activeTabRef.current = activeTab }, [activeTab])
  useEffect(() => { formatOnSaveRef.current = formatOnSave }, [formatOnSave])
  useEffect(() => { tabsRef.current = tabs }, [tabs])
  useEffect(() => { forgetOnDisconnectRef.current = forgetOnDisconnect }, [forgetOnDisconnect])
  useEffect(() => { contextualExecutionRef.current = contextualExecution }, [contextualExecution])
  useEffect(() => { window.electron?.setAlwaysOnTop(alwaysOnTop) }, [alwaysOnTop])
  useEffect(() => { window.electron?.setTransparent(transparentWindow) }, [transparentWindow])
  useEffect(() => { window.electron?.setTray(useTrayIcon) }, [useTrayIcon])
  useEffect(() => { window.electron?.setSilentLaunch(silentLaunch) }, [silentLaunch])
  useEffect(() => { window.electron?.toggleLogToFile(logToFile) }, [logToFile])

  useEffect(() => {
    const saved = localStorage.getItem('githubPAT')
      if (saved) {
        setGithubPAT(saved)
        fetchGists(saved)
         }
    }, [])

  useEffect(() => {
    window.__synapseShowAiError = () => setShowAiError(true)
    return () => { delete window.__synapseShowAiError }
  }, [])

  useEffect(() => {
    const currentTab = tabs.find(t => t.id === activeTab)

    window.electron?.setActivity(
      currentTab?.title || 'Untitled tab'
    )
  }, [activeTab, tabs])

  useEffect(() => {
    initLSP()
  }, [])

  useEffect(() => {
      window.electron?.onDeepLink((data) => {
        // data = { name: string, uri: string }
        setPendingBookmark(data)
      })
    }, [])

  useEffect(() => {
    document.body.style.zoom = `${interfaceScale}%`
  }, [interfaceScale])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault()
        setHideSidebar(v => !v)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        const tabId = activeTabRef.current
        const tab = tabsRef.current.find(t => t.id === tabId)
        if (!tab) return
        // Format if enabled
        const editor = editorsRef.current[tabId]
        if (formatOnSaveRef.current && editor) {
          editor.getAction('editor.action.formatDocument')?.run()
        }
        // Save to disk if tab has a file path
        if (tab.filePath) {
          const content = modelsRef.current[tabId]?.getValue() ?? ''
          window.electron?.saveFile?.(tab.filePath, content)
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  useEffect(() => {
    const applySelectedTheme = async () => {
      const themeId = themeMap[selectedTheme]
      if (!themeId) return
      
      // Apply theme styles and Monaco theme
      await applyTheme(themeId)
      
      // Handle liquid glass for Hollywood Glass theme
      const isHollywoodGlass = themeId === 'hollywood-glass'
      if (isHollywoodGlass && transparentWindow) {
        try {
          await window.electron?.invoke?.('liquidglass:enable')

        } catch (e) {
          console.warn('[Theme] Liquid glass enable failed:', e.message)
        }
      } else {
        try {
          await window.electron?.invoke?.('liquidglass:disable')

        } catch (e) {
          // Silently fail if not on macOS or liquid glass not available
        }
      }
      
      // Load theme settings
      const settings = getThemeSettings(themeId)

      if (settings && settings.settingOverrides && Object.keys(settings.settingOverrides).length > 0) {

        setPendingThemeSettings(settings)
        setShowThemeOverride(true)
      }
      
      localStorage.setItem("selectedTheme", selectedTheme)
    }
    
    applySelectedTheme()
  }, [selectedTheme, transparentWindow])



  // Initialize transparent CSS on mount
  useEffect(() => {
    document.documentElement.style.backgroundColor = 'transparent'
    document.body.style.backgroundColor = 'transparent'
    const root = document.getElementById('root')
    if (root) root.style.backgroundColor = 'transparent'

  }, [])

  useEffect(() => {
    const savedKey = localStorage.getItem('synapseai_key')
    setHasOpenAIKey(!!savedKey)
  }, [])

  useEffect(() => {
    loader.init().then(monaco => {
      if (!luaLSP) {
        monaco.editor.getEditors().forEach(e => e.updateOptions({
          quickSuggestions: false,
          suggestOnTriggerCharacters: false,
          parameterHints: { enabled: false },
        }))
      } else {
        monaco.editor.getEditors().forEach(e => e.updateOptions({
          quickSuggestions: true,
          suggestOnTriggerCharacters: true,
          parameterHints: { enabled: true },
        }))
      }
    })
  }, [luaLSP])

  const addTab = () => {
    const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1
    setTabs(prev => [...prev, { id: newId, title: 'Untitled tab', content: defaultTabContentSaved }])
    setActiveTab(newId)
  }

  const openFileInTab = async (path) => {
    try {
      const content = await window.electron.readFile(path);
      const name = path.split(/[\\/]/).pop();
      const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1;
      setTabs(prev => [...prev, { id: newId, title: name, content }]);
      setActiveTab(newId);
      setActivePage('editor');
    } catch (err) {

    }
  }

  const closeTab = (id) => {
    if (tabs.length <= 1) return
    if (pinnedTabs.has(id)) return 
    const model = modelsRef.current[id]
    const content = model && !model.isDisposed() ? model.getValue() : (tabs.find(t => t.id === id)?.content ?? '')
    const hasContent = content.trim().length > 0
    if (showUnsavedWarnings && hasContent) {
      setUnsavedWarningTab(id)
      return
    }
    forceCloseTab(id)
  }

  const forceCloseTab = (id) => {
    const model = modelsRef.current[id]
    if (model && !model.isDisposed()) model.dispose()
    delete modelsRef.current[id]
    delete editorsRef.current[id]
    const remaining = tabs.filter(t => t.id !== id)
    setTabs(remaining)
    if (activeTab === id) setActiveTab(remaining[remaining.length - 1].id)
    setUnsavedWarningTab(null)
  }

  const updateTabContent = (id, value) => {
    setTabs(prev => prev.map(t => t.id === id ? { ...t, content: value } : t))
  }

  const pageClass = (name) =>
    `t-0 l-0 absolute flex h-full w-full flex-col overflow-y-auto ${
      activePage === name 
        ? 'pointer-events-auto opacity-100' 
        : 'pointer-events-none opacity-0'
    }`;

  async function fetchGists(token) {
  setGistsLoading(true)
  setGistsError(null)
  try {
    const res = await fetch('https://api.github.com/gists', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
    })
    if (!res.ok) {
      if (res.status === 401) throw new Error('Invalid token — please re-enter your PAT.')
      throw new Error(`GitHub error: ${res.status}`)
    }
    const data = await res.json()
    setGists(data)
  } catch (err) {
    setGistsError(err.message)
  } finally {
    setGistsLoading(false)
  }
  }

  function handleOpenAiError(status) {
    if (status === 401 || status === 402 || status === 429 || status === 'auth') {
      setShowAiError(true)
    }
  }

  async function openGistInTab(gist) {
    try {
      const res = await fetch(`https://api.github.com/gists/${gist.id}`, {
        headers: {
          Authorization: `Bearer ${githubPAT}`,
          Accept: 'application/vnd.github+json',
        },
      })
      const data = await res.json()
      const files = Object.values(data.files)
      const file = files.find(f => f.filename.endsWith('.lua')) || files[0]
      if (!file) return

      const content = file.content || ''
      const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1
      setTabs(prev => [...prev, { id: newId, title: file.filename, content }])
      setActiveTab(newId)
    } catch {
    }
  }

  return (
  <div className="flex flex-col w-full h-full overflow-hidden">
    	<div className="hw-titlebar flex items-center w-full h-8">
    	    <div id="titlebar-branding" className="flex h-2/3 pl-2">
    	        <div id="titlebar-logo" className="w-24 h-full bg-contain bg-no-repeat align-top"></div>
    	    </div>
    	    <div id="titlebar-middle-text" className="hidden mx-auto">hollywood v3.0</div>
    	    <div id="controls" className="flex ml-auto z-10">
    	        <div className="control p-2" style={{ display: 'none' }} id="ban_control_feedback"> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:emoji-16-filled" data-inline="false">
    	                <path fill="currentColor" d="M8 14A6 6 0 1 1 8 2a6 6 0 0 1 0 12M6.25 7.75a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5m-.114 1.917a.5.5 0 1 0-.745.667A3.5 3.5 0 0 0 8 11.5a3.5 3.5 0 0 0 2.609-1.166a.5.5 0 1 0-.745-.667A2.5 2.5 0 0 1 8 10.5c-.74 0-1.405-.321-1.864-.833M9.75 7.75a.75.75 0 1 0 0-1.5a.75.75 0 0 0 0 1.5"></path>
    	            </svg> </div>
    	        <div className="control p-2" style={{ display: 'none' }} id="ban_control_hamburger"> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:list-16-regular" data-inline="false">
    	                <path fill="currentColor" d="M2 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 0 1h-8a.5.5 0 0 1-.5-.5m0 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7a.5.5 0 0 1-.5-.5M2.5 7a.5.5 0 0 0 0 1h11a.5.5 0 0 0 0-1z"></path>
    	            </svg> </div>
    	        <div className="control p-2" style={{ display: 'none' }} id="ban_control_language"> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:globe-16-regular" data-inline="false">
    	                <path fill="currentColor" d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12M8 3c.374 0 .875.356 1.313 1.318q.141.313.26.682H6.427a6 6 0 0 1 .26-.682C7.125 3.356 7.627 3 8 3m-2.223.904q-.227.5-.393 1.096H4a5 5 0 0 1 2.038-1.6a6 6 0 0 0-.261.504M5.163 6A12 12 0 0 0 5 8c0 .699.057 1.373.163 2H3.416A5 5 0 0 1 3 8c0-.711.148-1.388.416-2zm.221 5q.166.596.393 1.096q.119.262.26.504A5 5 0 0 1 4 11zm1.043 0h3.146a6 6 0 0 1-.26.682C8.875 12.644 8.373 13 8 13c-.374 0-.875-.356-1.313-1.318a6 6 0 0 1-.26-.682m3.394-1H6.18A11 11 0 0 1 6 8c0-.714.064-1.39.179-2H9.82c.115.61.179 1.286.179 2s-.064 1.39-.179 2m.795 1H12a5 5 0 0 1-2.038 1.6q.143-.242.26-.504q.229-.5.394-1.096m1.968-1h-1.747A12 12 0 0 0 11 8c0-.699-.057-1.372-.163-2h1.747c.268.612.416 1.289.416 2s-.148 1.388-.416 2M9.962 3.4A5 5 0 0 1 12 5h-1.384a7.5 7.5 0 0 0-.393-1.096a6 6 0 0 0-.26-.504"></path>
    	            </svg> </div>
    	        <div className="control p-2" id="ban_control_minimize" aria-label="Minimize" onClick={() => window.electron?.minimize()}> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:subtract-16-regular" data-inline="false">
    	                <path fill="currentColor" d="M3 8a.5.5 0 0 1 .5-.5h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 3 8"></path>
    	            </svg> </div>
    	        <div className="control p-2" id="ban_control_maximize" aria-label="Maximize" onClick={() => window.electron?.maximize()}> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:maximize-16-regular" data-inline="false">
    	                <path fill="currentColor" d="M4.5 3A1.5 1.5 0 0 0 3 4.5v7A1.5 1.5 0 0 0 4.5 13h7a1.5 1.5 0 0 0 1.5-1.5v-7A1.5 1.5 0 0 0 11.5 3zm0 1h7a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-.5.5h-7a.5.5 0 0 1-.5-.5v-7a.5.5 0 0 1 .5-.5"></path>
    	            </svg> </div>
    	        <div className="control p-2" id="ban_control_restore" style={{ display: 'none' }} aria-label="Restore"> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:full-screen-maximize-16-regular" data-inline="false">
    	                <path fill="currentColor" d="M3.75 3a.75.75 0 0 0-.75.75V5.5a.5.5 0 0 1-1 0V3.75C2 2.784 2.784 2 3.75 2H5.5a.5.5 0 0 1 0 1zM10 2.5a.5.5 0 0 1 .5-.5h1.75c.966 0 1.75.784 1.75 1.75V5.5a.5.5 0 0 1-1 0V3.75a.75.75 0 0 0-.75-.75H10.5a.5.5 0 0 1-.5-.5M2.5 10a.5.5 0 0 1 .5.5v1.75c0 .414.336.75.75.75H5.5a.5.5 0 0 1 0 1H3.75A1.75 1.75 0 0 1 2 12.25V10.5a.5.5 0 0 1 .5-.5m11 0a.5.5 0 0 1 .5.5v1.75A1.75 1.75 0 0 1 12.25 14H10.5a.5.5 0 0 1 0-1h1.75a.75.75 0 0 0 .75-.75V10.5a.5.5 0 0 1 .5-.5"></path>
    	            </svg> </div>
    	        <div className="control p-2" id="ban_control_close" aria-label="Close" onClick={() => window.electron?.close()}> <svg xmlnsXlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" className="iconify iconify--fluent" width="1em" height="1em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 16 16" data-icon="fluent:dismiss-16-regular" data-inline="false">
    	                <path fill="currentColor" d="m2.589 2.716l.057-.07a.5.5 0 0 1 .638-.057l.07.057L8 7.293l4.646-4.647a.5.5 0 0 1 .708.708L8.707 8l4.647 4.646a.5.5 0 0 1 .057.638l-.057.07a.5.5 0 0 1-.638.057l-.07-.057L8 8.707l-4.646 4.647a.5.5 0 0 1-.708-.708L7.293 8L2.646 3.354a.5.5 0 0 1-.057-.638l.057-.07z"></path>
    	            </svg> </div>
    	    </div>
    	</div>

    	<div id="application" className="flex flex-col max-w-full max-h-full w-full h-full select-none overflow-hidden">
    	    <div id="gateway-page" className="absolute top-0 left-0 z-50 flex h-full w-full items-center justify-center bg-cover bg-center" style={{ backgroundImage: `url(${loginBgNight})`, animation: gatewayVisible ? 'gateway-fade-in 600ms ease-out forwards' : 'gateway-fade-out 500ms ease-in forwards', pointerEvents: gatewayVisible ? 'auto' : 'none' }}>
    	        <div id="logo-container" className="flex w-1/4 flex-col items-center justify-center gap-4"> <img id="logo" src={logoWhite} className="w-2/3 drop-shadow-md" />
    	            <div id="extra" className="flex flex-col gap-2">
    	                <div id="" className="h-8 w-8"> <svg className="CircularProgressbar path" viewBox="0 0 100 100" data-test-id="CircularProgressbar">
    	                        <path className="CircularProgressbar-trail" d="
          M 50,50
          m 0,-44
          a 44,44 0 1 1 0,88
          a 44,44 0 1 1 0,-88
        " strokeWidth="12" fillOpacity="0" style={{ stroke: 'rgba(0, 0, 0, 0.5)', strokeLinecap: 'butt', strokeDasharray: '276.46px, 276.46px', strokeDashoffset: '0px' }}></path>
    	                        <path className="CircularProgressbar-path" d="
          M 50,50
          m 0,-44
          a 44,44 0 1 1 0,88
          a 44,44 0 1 1 0,-88
        " strokeWidth="12" fillOpacity="0" style={{ stroke: 'white', strokeLinecap: 'butt', transitionDuration: '0.1s', strokeDasharray: '276.46px, 276.46px', strokeDashoffset: '82.938px' }}></path>
    	                    </svg> </div>
    	                <div id="subtitle"></div>
    	            </div>
    	        </div>
    	    </div>
    	    <div id="canvas-progress" className="l-0 absolute top-0 z-50 flex h-full w-full opacity-100 pointer-events-none overflow-x-hidden">
    	        <div className="absolute flex h-full w-full select-none items-center justify-center text-white transition-colors pointer-events-none bg-transparent"></div>
    	        <div className="flex h-full w-full select-none items-end justify-end">
    	            <div
    	              className="hw-progress-view m-8 flex w-[24rem] flex-col rounded-md border transition-all"
    	              style={{ animation: tasks.length > 0 ? '100ms ease-out 0s 1 normal forwards running elem-blur-in' : '100ms ease-out 0s 1 normal forwards running elem-blur-out', opacity: tasks.length > 0 ? 1 : 0, pointerEvents: tasks.length > 0 ? 'auto' : 'none' }}
    	            >
    	                <div className="caption rounded-t-md border-b p-2 font-bold">Tasks</div>
    	                <div className="tasks flex grow flex-col divide-y rounded-b-md">
    	                  {tasks.map(task => (
    	                    <div key={task.id} className="flex items-center gap-3 px-3 py-2 text-sm">
    	                      {task.status === 'running' && (
    	                        <iconify-icon icon="svg-spinners:ring-resize" className="flex items-center justify-center flex-shrink-0 text-base" style={{color: 'var(--hw-accent, #a78bfa)'}}></iconify-icon>
    	                      )}
    	                      {task.status === 'done' && (
    	                        <iconify-icon icon="fluent:checkmark-circle-20-filled" className="flex items-center justify-center flex-shrink-0 text-base" style={{color: '#4ade80'}}></iconify-icon>
    	                      )}
    	                      {task.status === 'error' && (
    	                        <iconify-icon icon="fluent:dismiss-circle-20-filled" className="flex items-center justify-center flex-shrink-0 text-base" style={{color: '#f87171'}}></iconify-icon>
    	                      )}
    	                      <span className={task.status === 'error' ? 'text-red-400' : task.status === 'done' ? 'opacity-60' : ''}>{task.label}</span>
    	                    </div>
    	                  ))}
    	                </div>
    	            </div>
    	        </div>
    	    </div>
    	    <div id="canvas-dialog" className="l-0 absolute top-0 z-50 flex h-full w-full opacity-100 pointer-events-none overflow-x-hidden">

    	    </div>
    	    <div id="canvas-menus" className="l-0 absolute top-0 z-50 flex h-full w-full opacity-100 pointer-events-none overflow-x-hidden"></div>
    	    <div id="canvas-language" className="l-0 absolute top-0 z-50 flex h-full w-full opacity-0 pointer-events-none overflow-x-hidden">
    	        <div className="bar" style={{ paddingTop: '0.5em' }}> <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1  cursor-default undefined" style={{ marginLeft: '0.5em' }}>Close</button>
    	            <div className="language">
    	                <div className="name">English</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇺🇸" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1fa-1f1f8.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Filipino</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇵🇭" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f5-1f1ed.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Deutsch</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇩🇪" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1e9-1f1ea.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Magyar</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇭🇺" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1ed-1f1fa.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">bahasa Indonesia</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇮🇩" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1ee-1f1e9.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Italiano</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇮🇹" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1ee-1f1f9.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">한국어</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇰🇷" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f0-1f1f7.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Polski</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇵🇱" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f5-1f1f1.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Português (Brasil)</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇧🇷" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1e7-1f1f7.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Română</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇷🇴" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f7-1f1f4.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Slovenčina</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇸🇰" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f8-1f1f0.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Español</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇪🇸" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1ea-1f1f8.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">ภาษาไทย</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇹🇭" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f9-1f1ed.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Türkçe</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇹🇷" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1f9-1f1f7.png" /> </div>
    	            </div>
    	            <div className="language">
    	                <div className="name">Tiếng Việt</div>
    	                <div className="flag"> <img draggable="false" className="emoji" alt="🇻🇳" src="https://twemoji.maxcdn.com/v/14.0.2/72x72/1f1fb-1f1f3.png" /> </div>
    	            </div>
    	        </div>
    	    </div>
    	    <div id="canvas-notifications" className="l-0 absolute top-0 z-50 flex h-full w-full opacity-100 pointer-events-none overflow-x-hidden"></div>
            <div className={`hw-navigationbar ${navbarStyle === 1 ? 'fixed' : 'absolute'} flex h-8 items-center bg-transparent transition-all
              ${navbarStyle === 0
                ? `left-0 right-0 top-0 mx-auto ${dealignNavbar ? 'justify-start pl-2' : 'justify-center'}`
                : `left-0 top-8 flex-col w-8 h-[calc(100%-2rem)] ${dealignNavbar ? 'justify-start pt-2' : 'justify-center'}`
              }`}>
    	        <div id="nav-themes" className={`entry group relative m-0.5 flex items-center justify-center rounded-md p-1 transition-colors drop-shadow-md ${activePage==='themes' ? 'select' : '' }`} style={{order: 2}} onClick={()=> setActivePage('themes')}> <iconify-icon icon="fluent:paint-brush-20-filled" className="flex items-center justify-center text-base"></iconify-icon>
    	            <div className={`label absolute z-20 flex items-center gap-1 rounded-md p-1 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-500 whitespace-nowrap ${navbarStyle === 1 ? 'left-full top-0 ml-1' : 'top-full left-0 mt-1'}`}>
    	                <iconify-icon icon="fluent:paint-brush-20-filled" className="flex items-center justify-center undefined"></iconify-icon> Customization
    	            </div>
    	        </div>
    	        <div id="nav-plugins" className={`entry group relative m-0.5 flex items-center justify-center rounded-md p-1 transition-colors ${activePage==='plugins' ? 'select' : '' }`} style={{order: 10}} onClick={()=> setActivePage('plugins')}> <iconify-icon icon="fluent:puzzle-piece-20-filled" className="flex items-center justify-center text-base"></iconify-icon>
    	            <div className={`label absolute z-20 flex items-center gap-1 rounded-md p-1 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-500 whitespace-nowrap ${navbarStyle === 1 ? 'left-full top-0 ml-1' : 'top-full left-0 mt-1'}`}>
    	                <iconify-icon icon="fluent:puzzle-piece-20-filled" className="flex items-center justify-center undefined"></iconify-icon> Plugins
    	            </div>
    	        </div>
    	        <div id="nav-editor" className={`entry group relative m-0.5 flex items-center justify-center rounded-md p-1 transition-colors ${activePage==='editor' ? 'select' : '' }`} style={{order: 0}} onClick={()=> setActivePage('editor')}> <iconify-icon icon="fluent:window-console-20-filled" className="flex items-center justify-center text-base"></iconify-icon>
    	            <div className={`label absolute z-20 flex items-center gap-1 rounded-md p-1 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-500 whitespace-nowrap ${navbarStyle === 1 ? 'left-full top-0 ml-1' : 'top-full left-0 mt-1'}`}>
    	                <iconify-icon icon="fluent:window-console-20-filled" className="flex items-center justify-center undefined"></iconify-icon> Editor
    	            </div>
    	        </div>
    	        <div id="nav-settings" className={`entry group relative m-0.5 flex items-center justify-center rounded-md p-1 transition-colors ${activePage==='settings' ? 'select' : '' }`} style={{order: 1}} onClick={()=> setActivePage('settings')}> <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center text-base"></iconify-icon>
    	            <div className={`label absolute z-20 flex items-center gap-1 rounded-md p-1 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100 group-hover:delay-500 whitespace-nowrap ${navbarStyle === 1 ? 'left-full top-0 ml-1' : 'top-full left-0 mt-1'}`}>
    	                <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center undefined"></iconify-icon> Settings
    	            </div>
    	        </div>
    	    </div>
    	    <div className="absolute left-0 top-0 z-50 flex h-full w-full overflow-x-hidden transition-colors duration-300 pointer-events-none bg-transparent"></div>
    	    <div className="relative h-full" style={{background: '#1a1818', paddingLeft: navbarStyle === 1 ? '2rem' : '0', boxSizing: 'border-box', width: '100%'}}> {/* }/ Theme page */} <div className={pageClass('themes')}>
    	            <div className="hw-multimenu flex h-full max-h-full w-full">
    	                <div className="list z-10 flex flex-col border-r lg:w-1/5">
    	                    <div title="General" className="entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2
                  ">
    	                        <iconify-icon icon="heroicons:wrench-solid" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                        <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">General</div>
    	                    </div>
    	                </div>
    	                <div className="flex max-h-full grow flex-col">
    	                    <div className="pages flex grow flex-col overflow-y-auto">
    	                        <div id="0" className="page">
    	                            <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
    	                                <iconify-icon icon="heroicons:wrench-solid" className="flex items-center justify-center undefined"></iconify-icon> General
    	                            </div>
    	                            <div className="action-container flex w-full items-center px-2 py-1 lg:px-3 lg:py-2">
    	                                <div className="text flex flex-col">
    	                                    <div className="caption text-xs lg:text-base">Available themes</div>
    	                                    <div className="description text-xs opacity-50">Available themes</div>
    	                                </div>
                                      <div className="ml-auto flex gap-1 lg:gap-4">
                                        <div id="theme-selector" className="hw-dropdown min-w-[12rem] relative flex flex-col">
                                          <div className="selector flex items-center rounded-md px-2 py-1 border cursor-pointer" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                            <div className="dropdown-entry p-1">{selectedTheme}</div>
                                            <iconify-icon icon="heroicons:chevron-down" className="flex items-center justify-center ml-auto transition-transform" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}></iconify-icon>
                                          </div>
                                          <div className={`list z-10 flex-col absolute top-[calc(100%_+_0.5rem)] max-h-[50vh] overflow-y-auto w-full rounded-md border ${dropdownOpen ? 'flex' : 'hidden'}`}>
                                            {availableThemeNames.map(theme => (
                                              <div
                                                key={theme}
                                                className={`opacity-70 active:opacity-50 hover:opacity-100 ${selectedTheme === theme ? 'highlight' : ''}`}
                                                onClick={() => {
                                                  setSelectedTheme(theme);
                                                  localStorage.setItem('selectedTheme', theme);
                                                  setDropdownOpen(false);
                                                }}
                                              >
                                                <div className="dropdown-entry p-1">{theme}</div>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      </div>
    	                            </div>
    	                            <div className="action-container flex w-full items-center px-2 py-1 lg:px-3 lg:py-2">
    	                                <div className="text flex flex-col">
    	                                    <div className="caption text-xs lg:text-base">Theme directory</div>
    	                                    <div className="description text-xs opacity-50">You can place all custom themes in this folder.</div>
    	                                </div>
    	                                <div className="ml-auto flex gap-1 lg:gap-4"> <button id="action-btn" title="Open" className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1  cursor-default undefined">Open</button> </div>
    	                            </div>
    	                            <div className="action-container flex w-full items-center px-2 py-1 lg:px-3 lg:py-2">
    	                                <div className="text flex flex-col">
    	                                    <div className="caption text-xs lg:text-base">Reset layout</div>
    	                                    <div className="description text-xs opacity-50">This will reset all layout-related settings to their defaults.</div>
    	                                </div>
    	                                <div className="ml-auto flex gap-1 lg:gap-4"> <button
                                        id="action-btn"
                                        title="Reset"
                                        className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
                                        onClick={() => {
                                          // Remove all injected theme stylesheets
                                          document.getElementById('synapse-theme')?.remove()

                                          // Force-reload reset.scss by removing and re-adding the link
                                          const existing = document.getElementById('reset-styles')
                                          if (existing) existing.remove()
                                          const link = document.createElement('link')
                                          link.id = 'reset-styles'
                                          link.rel = 'stylesheet'
                                          link.href = '/src/styles/reset.scss?t=' + Date.now() // cache-bust
                                          document.head.appendChild(link)

                                          // Force-restore navbar layout
                                          const navbar = document.querySelector('.hw-navigationbar')
                                          if (navbar) {
                                            navbar.style.removeProperty('margin-left')
                                            navbar.style.removeProperty('margin-right')
                                            navbar.style.removeProperty('justify-content')
                                            navbar.style.removeProperty('align-items')
                                            navbar.style.removeProperty('position')
                                            navbar.style.removeProperty('left')
                                            navbar.style.removeProperty('right')
                                            navbar.style.removeProperty('top')
                                            navbar.style.removeProperty('transform')
                                          }

                                          // Re-apply current theme fresh
                                          applyTheme(themeMap[selectedTheme])
                                        }}
                                      >
                                        Reset
                                      </button>
                                      </div>
    	                            </div>
    	                        </div>
    	                    </div>
    	                </div>
    	            </div>
    	        </div> {/* }/ Plugin page */} <div className={pageClass('plugins')}>
    	            <div className="hw-multimenu flex h-full max-h-full w-full">
    	                <div className="list z-10 flex flex-col border-r lg:w-1/5">
    	                    <div title="General options" className="entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2
                  ">
    	                        <iconify-icon icon="heroicons:puzzle-piece-solid" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                        <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">General options</div>
    	                    </div>
    	                </div>
    	                <div className="flex max-h-full grow flex-col">
    	                    <div className="pages flex grow flex-col overflow-y-auto">
    	                        <div id="0" className="page">
    	                            <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
    	                                <iconify-icon icon="heroicons:puzzle-piece-solid" className="flex items-center justify-center undefined"></iconify-icon> General options
    	                            </div>
    	                            <div className="action-container flex w-full items-center px-2 py-1 lg:px-3 lg:py-2">
    	                                <div className="text flex flex-col">
    	                                    <div className="caption text-xs lg:text-base">Enable plugins</div>
    	                                    <div className="description text-xs opacity-50">Controls whether plugins are enabled. Turning this on may have risks!</div>
    	                                </div>
    	                                <div className="ml-auto flex gap-1 lg:gap-4">
                                          <div className={`hw-checkbox relative inline-flex items-center h-6 w-11 flex-shrink-0 rounded-full cursor-pointer border transition-colors duration-200 ease-in-out ${enablePlugins ? 'on' : ''}`} onClick={() => { if (!enablePlugins) setShowPluginWarning(true); else setEnablePlugins(false); }}>
    	                                        <div className={`pointer-events-none relative inline-block rounded-full h-4 w-4 transform bg-white shadow transition-all duration-200 ease-in-out ${enablePlugins ? 'translate-x-6' : 'translate-x-1'}`}></div>
    	                                    </div>
    	                                </div>
    	                            </div>
    	                        </div>
    	                    </div>
    	                </div>
    	            </div>
    	        </div> {/* }/ Editor page */} <div className={pageClass('editor')}>
    	            <div className="editor-page flex h-full w-full flex-col overflow-hidden" style={{ flexDirection: sidebarPos === 0 ? 'row-reverse' : 'row' }}>
    	                <div className={`h-full transition-all overflow-hidden ${aiFeatures && aiPanelOpen ? '' : 'w-0 !min-w-0 !max-w-0'}`} style={{ position: 'relative', userSelect: 'auto', width: `${aiPanelWidth}px`, height: '100%', maxWidth: '450px', minWidth: '200px', boxSizing: 'border-box', flexShrink: 0 }}>
    	                    <section className="ai-view relative flex h-full w-full max-w-full flex-col border-r">
    	                        {/* Settings popover */}
    	                        <div className={`absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-lg border p-2 shadow-md transition-opacity hw-contextmenu ${showAiSettings ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
    	                            <div className="mb-2 divide-y rounded-lg border" style={{ borderColor: 'var(--hw-border)', divideColor: 'var(--hw-border)' }}>
                                    <div
                                      className="entry flex items-center gap-2 px-2 py-1 first:rounded-t-lg last:rounded-b-lg active:opacity-50 cursor-pointer"
                                      onClick={() => { setShowSynapseKeyDialog(true); setShowAiSettings(false) }}
                                    >
                                        <iconify-icon icon="fluent:key-20-filled" className="flex items-center justify-center"></iconify-icon> {hasOpenAIKey ? 'Replace key' : 'Add key'}
                                    </div>
                                    <div
                                      className="entry flex items-center gap-2 px-2 py-1 first:rounded-t-lg last:rounded-b-lg active:opacity-50 cursor-pointer"
                                      onClick={() => {
                                        localStorage.removeItem('synapseai_key')
                                        localStorage.removeItem('synapseai_conversations')
                                        localStorage.removeItem('synapseai_chat_history')
                                        localStorage.removeItem('synapseai_settings')
                                        localStorage.removeItem('synapseai_context')
                                        setHasOpenAIKey(false)
                                        setAiMessagesSynced([])
                                        setAiView('menu')
                                        setShowAiSettings(false)
                                      }}
                                    >
                                      <iconify-icon icon="fluent:delete-20-filled" className="flex items-center justify-center"></iconify-icon> Clear conversations
                                    </div>
    	                            </div>
                                <div className="hw-dropdown min-w-[12rem] relative flex flex-col">
                                  <div
                                    className="selector flex items-center rounded-md px-2 py-1 border cursor-pointer"
                                    onClick={() => setAiModelDropdownOpen(!aiModelDropdownOpen)}
                                  >
                                    <div className="dropdown-entry p-1">Synapse AI</div>
                                    <iconify-icon
                                      icon="heroicons:chevron-down"
                                      className="flex items-center justify-center ml-auto transition-transform"
                                      style={{ transform: aiModelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                    ></iconify-icon>
                                  </div>
                                  <div className={`list z-10 flex-col absolute top-[calc(100%_+_0.5rem)] max-h-[50vh] overflow-y-auto w-full rounded-md border ${aiModelDropdownOpen ? 'flex' : 'hidden'}`}>
                                    <div className="opacity-70 active:opacity-50 hover:opacity-100 highlight cursor-pointer" onClick={() => setAiModelDropdownOpen(false)}>
                                      <div className="dropdown-entry p-1">Synapse AI</div>
                                    </div>
                                    <div className="opacity-70 active:opacity-50 hover:opacity-100 cursor-pointer" onClick={() => setAiModelDropdownOpen(false)}>
                                      <div className="dropdown-entry p-1">Syn-Chan</div>
                                    </div>
                                  </div>
                                </div>
    	                        </div>

                              {/* No key warning */}
                              {!hasOpenAIKey && (
                                <a
                                  href="https://console.groq.com/keys"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cursor-pointer bg-orange-700 p-2 text-center text-xs text-white underline block hover:bg-orange-800 transition-colors"
                                >
                                  A Groq API key is necessary to use SynapseAI.
                                </a>
                              )}

                              {/* MENU VIEW */}
                              {aiView === 'menu' && (
    	                        <div className="flex grow flex-col gap-2 overflow-y-scroll p-2">
    	                            <div className="hw-list rounded-md border">
    	                                <div className="caption flex items-center">
    	                                    <h1 className="flex items-center gap-2 py-1 pl-2">
    	                                        <iconify-icon icon="fluent:bot-20-filled" className="flex items-center justify-center"></iconify-icon> Chat with SynapseAI
    	                                    </h1>
    	                                    <div
                                            className="ml-auto rounded-tr-md border-l px-2 py-1 active:opacity-50 cursor-pointer hw-button"
                                            style={{ borderColor: 'var(--hw-border)', borderRadius: '0 0.375rem 0 0', border: 'none', borderLeft: '1px solid var(--hw-border)' }}
                                            onClick={() => { if (hasOpenAIKey) setAiView('chat'); else setShowSynapseKeyDialog(true) }}
                                          >Chat</div>
    	                                </div>
    	                                <div className="value p-2 text-sm border-t" style={{ borderColor: 'var(--hw-border)' }}>Talk with SynapseAI to get assistance with your script.</div>
    	                            </div>
    	                            <div className={`hw-list rounded-md border ${!hasOpenAIKey ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
    	                                <div className="caption flex items-center">
    	                                    <h1 className="flex items-center gap-2 py-1 pl-2">
    	                                        <iconify-icon icon="fluent:point-scan-24-filled" className="flex items-center justify-center"></iconify-icon> Explain code
    	                                    </h1>
    	                                    <div className="ml-auto rounded-tr-md border-l px-2 py-1 active:opacity-50 hw-button" style={{ borderColor: 'var(--hw-border)', borderRadius: '0 0.375rem 0 0', border: 'none', borderLeft: '1px solid var(--hw-border)' }} onClick={explainCode}>Apply</div>
    	                                </div>
    	                                <div className="value p-2 text-sm border-t" style={{ borderColor: 'var(--hw-border)' }}>Add comments explaining what the code is doing.</div>
    	                            </div>
    	                            <div className={`hw-list rounded-md border ${!hasOpenAIKey ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
    	                                <div className="caption flex items-center">
    	                                    <h1 className="flex items-center gap-2 py-1 pl-2">
    	                                        <iconify-icon icon="fluent:rename-20-filled" className="flex items-center justify-center"></iconify-icon> Rename variables
    	                                    </h1>
    	                                    <div className="ml-auto rounded-tr-md border-l px-2 py-1 active:opacity-50 hw-button" style={{ borderColor: 'var(--hw-border)', borderRadius: '0 0.375rem 0 0', border: 'none', borderLeft: '1px solid var(--hw-border)' }} onClick={renameVariables}>Apply</div>
    	                                </div>
    	                                <div className="value p-2 text-sm border-t" style={{ borderColor: 'var(--hw-border)' }}>Rename variables to names that are easier to understand.</div>
    	                            </div>
    	                        </div>
                              )}

                              {/* CHAT VIEW */}
                              {aiView === 'chat' && (
                                <div className="flex grow flex-col overflow-hidden">
                                  <button
                                    className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default m-2"
                                    onClick={() => { setAiView('menu'); setAiMessagesSynced([]) }}
                                  >
                                    <iconify-icon icon="fluent:arrow-hook-down-left-24-regular" className="flex items-center justify-center"></iconify-icon> Return to menu
                                  </button>
                                  <div className="flex grow flex-col gap-2 overflow-y-scroll p-2">
                                    {aiMessages.map((msg, i) => (
                                      <div key={i} className={`flex gap-2 ${msg.role === 'assistant' ? '' : 'flex-row-reverse'}`}>
                                        <div className={`flex h-8 min-h-[2rem] w-8 min-w-[2rem] items-center justify-center rounded-full p-1 text-lg flex-shrink-0 ai-message-bubble rounded-full ${msg.role === 'user' ? 'user' : ''}`}>
                                          <iconify-icon icon={msg.role === 'assistant' ? 'fluent:bot-20-filled' : 'fluent:person-20-filled'} className="flex items-center justify-center"></iconify-icon>
                                        </div>
                                        <div className="flex flex-col gap-1 max-w-[85%]">
                                          {parseMessage(msg.content).map((seg, j) =>
                                            seg.type === 'code' ? (
                                              <div key={j} className="ai-code-block flex flex-col rounded-md overflow-hidden border">
                                                <div className="header flex items-center justify-between px-2 py-0.5 text-xs">
                                                  <span>{seg.lang || 'lua'}</span>
                                                  <div className="flex gap-1">
                                                    <button
                                                      className="hw-button relative flex select-none items-center justify-center gap-1 rounded px-1.5 py-0.5 cursor-pointer text-xs"
                                                      onClick={() => copyCodeToClipboard(seg.content)}
                                                      title="Copy to Clipboard"
                                                    >
                                                      <iconify-icon icon="fluent:copy-20-regular"></iconify-icon>
                                                    </button>
                                                    <button
                                                      className="hw-button relative flex select-none items-center justify-center gap-1 rounded px-1.5 py-0.5 cursor-pointer text-xs"
                                                      onClick={() => insertCodeAtCursor(seg.content)}
                                                      title="Insert at Cursor"
                                                    >
                                                      <iconify-icon icon="fluent:text-cursor-20-regular"></iconify-icon>
                                                    </button>
                                                    <button
                                                      className="hw-button relative flex select-none items-center justify-center gap-1 rounded px-1.5 py-0.5 cursor-pointer text-xs"
                                                      onClick={() => applyCodeToEditor(seg.content)}
                                                      title="Replace All"
                                                    >
                                                      <iconify-icon icon="fluent:arrow-replace-20-regular"></iconify-icon>
                                                    </button>
                                                  </div>
                                                </div>
                                                <pre className="p-2 text-xs overflow-x-auto whitespace-pre-wrap font-mono" style={{ color: 'var(--hw-green, #4ade80)' }}>{seg.content}</pre>
                                              </div>
                                            ) : (
                                              <div key={j} className={`ai-message-bubble rounded-md p-2 text-xs whitespace-pre-wrap ${msg.role === 'user' ? 'user' : ''}`}>{seg.content}</div>
                                            )
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                    {aiLoading && (
                                      <div className="flex gap-2 flex-row-reverse">
                                        <div className="flex h-8 min-h-[2rem] w-8 min-w-[2rem] items-center justify-center rounded-full p-1 text-lg flex-shrink-0 ai-message-bubble rounded-full">
                                          <iconify-icon icon="fluent:bot-20-filled" className="flex items-center justify-center"></iconify-icon>
                                        </div>
                                        <div className="flex flex-col rounded-md p-2 text-xs opacity-50 italic ai-message-bubble">
                                          Thinking...
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

    	                        {/* Input bar */}
    	                        <div className="ai-input-area z-10 flex items-center justify-center border-t py-1 pl-2 gap-1 pr-2">
    	                            <div className="flex items-center justify-center text-xl active:opacity-50 cursor-pointer hover:opacity-100 opacity-50 transition-opacity" onClick={() => setShowAiSettings(v => !v)} title="Settings">
    	                                <iconify-icon icon="fluent:settings-16-filled" className="flex items-center justify-center"></iconify-icon>
    	                            </div>
                                  <div
                                      className={`flex items-center justify-center text-xl active:opacity-50 cursor-pointer hover:bg-white/10 rounded p-0.5 ${aiStreamToEditor ? 'text-green-400' : 'opacity-50'}`}
                                      onClick={() => setAiStreamToEditor(v => !v)}
                                      title={aiStreamToEditor ? "Streaming to Editor" : "Chat Only (Click to toggle)"}
                                  >
                                      <iconify-icon icon="fluent:text-cursor-20-filled" className="flex items-center justify-center"></iconify-icon>
                                  </div>
    	                            <div className={`hw-textbox rounded-md px-2 py-1 h-full w-full ${aiView !== 'chat' ? 'pointer-events-none opacity-50' : ''}`}>
    	                                <div className="inner flex items-center gap-2 border px-1 py-0.5">
    	                                    <iconify-icon icon="fluent:chat-empty-12-filled" className="flex items-center justify-center ml-1"></iconify-icon>
    	                                    <input
    	                                      className="w-full border-none bg-transparent text-inherit outline-none"
    	                                      type="text"
    	                                      placeholder={aiStreamToEditor ? "Describe what to write..." : "Send message..."}
    	                                      ref={aiInputRef}
    	                                      onKeyDown={e => { if (e.key === 'Enter') sendAiMessage() }}
    	                                      disabled={aiLoading || aiView !== 'chat'}
    	                                    />
    	                                </div>
    	                            </div>
    	                        </div>
    	                    </section>
    	                    <div>
    	                        <div>
                                <div
                                    style={{ position: 'absolute', userSelect: 'none', width: '10px', height: '100%', top: '0px', left: '-5px', cursor: 'col-resize' }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        const startX = e.clientX
                                        const startW = aiPanelWidth
                                        const onMove = (ev) => setAiPanelWidth(Math.min(450, Math.max(200, startW - (ev.clientX - startX))))
                                        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                                        window.addEventListener('mousemove', onMove)
                                        window.addEventListener('mouseup', onUp)
                                    }}
                                ></div>
                                <div
                                    style={{ position: 'absolute', userSelect: 'none', width: '10px', height: '100%', top: '0px', cursor: 'col-resize', right: '-5px' }}
                                    onMouseDown={(e) => {
                                        e.preventDefault()
                                        const startX = e.clientX
                                        const startW = aiPanelWidth
                                        const onMove = (ev) => setAiPanelWidth(Math.min(450, Math.max(200, startW + (ev.clientX - startX))))
                                        const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
                                        window.addEventListener('mousemove', onMove)
                                        window.addEventListener('mouseup', onUp)
                                    }}
                                ></div>
                            </div>
    	                    </div>
    	                </div>
    	                <div className="editor-view flex h-full grow w-0" style={{ flexDirection: editorStyle === 0 ? 'column' : 'column-reverse' }}>
                        <div className="tabs-container flex w-full items-center overflow-y-scroll border-b">
                          <div className="tabs flex">
                            {tabs.map(tab => (
                              <div key={tab.id} style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-insert' }}>
                                <div className={`hw-editor-tab relative flex flex-col border-r transition-colors hover:opacity-100 ${activeTab === tab.id ? 'select' : ''} ${compactTabs ? 'min-w-0 p-0' : 'min-w-[10rem] max-w-xs p-0.5'}`} title={tab.title} onClick={() => setActiveTab(tab.id)}   onContextMenu={(e) => { e.preventDefault(); setTabContextMenu({ x: e.clientX, y: e.clientY, tabId: tab.id }) }}>
                                  <div className="colorspace absolute top-0 flex h-full w-full opacity-50"></div>
                                  <div className={`content z-10 flex items-center transition-opacity opacity-100 ${compactTabs ? 'p-0.5' : 'p-1'}`}>
                                    <div className="icons mr-2 flex gap-1 items-center">
                                      {pinnedTabs.has(tab.id) && (
                                        <svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 12 12">
                                          <path fill="currentColor" d="M8.052 1.436a1.5 1.5 0 0 0-2.38.347L4.145 4.608l-2.33.928a.5.5 0 0 0-.169.818l1.647 1.647l-2.146 2.146l-.147.854l.854-.147L4 8.708l1.646 1.646a.5.5 0 0 0 .818-.168l.933-2.332l2.821-1.526a1.5 1.5 0 0 0 .347-2.38z"/>
                                        </svg>
                                      )}
                                      <iconify-icon icon="fluent:text-asterisk-20-filled" className="flex items-center justify-center"></iconify-icon>
                                      {autoExecuteTabs.has(tab.id) && (
                                        <iconify-icon icon="ic:sharp-settings" className="flex items-center justify-center"></iconify-icon>
                                      )}
                                      <iconify-icon icon="mdi:omega" className="flex items-center justify-center"></iconify-icon>
                                      {tabIcons[tab.id] && (
                                        <iconify-icon icon={tabIcons[tab.id]} className="flex items-center justify-center"></iconify-icon>
                                      )}
                                    </div>
                                    <div className="caption overflow-hidden overflow-ellipsis whitespace-nowrap text-sm">{tab.title}</div>
                                    <div
                                      className={`close ml-auto flex h-full items-center justify-center rounded transition hover:bg-white/10 active:opacity-50 ${tabs.length <= 1 ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
                                      onClick={e => { e.stopPropagation(); closeTab(tab.id) }}
                                    >
                                      <iconify-icon icon="fluent:dismiss-20-filled" className="flex items-center justify-center undefined"></iconify-icon>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                          <div
                            className="add-tab flex h-6 w-8 items-center justify-center opacity-50 transition hover:opacity-100 active:opacity-50"
                            onClick={addTab}
                          >
                            <iconify-icon icon="fluent:add-20-filled" className="flex items-center justify-center undefined"></iconify-icon>
                          </div>
                        </div>
    	                    <div className="main-container relative grow" style={{ minHeight: 0 }}>
                            {displayInfoArea && (
                              <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-2 border-t px-2 py-0.5 text-xs opacity-60" style={{ height: '1.5rem' }}>
                                <span>Lua</span>
                                {aiLoading && (
                                  <span className="flex items-center gap-1 text-purple-400 opacity-100" style={{ animation: 'pulse 1s infinite' }}>
                                    <iconify-icon icon="fluent:bot-20-filled" className="flex items-center justify-center"></iconify-icon>
                                    SynapseAI is writing...
                                  </span>
                                )}
                                <span className="ml-auto">Ln 1, Col 1</span>
                              </div>
                            )}
                            <div className="editor absolute h-full w-full opacity-100">
                              {tabs.map(tab => (
                                <div
                                  key={tab.id}
                                  style={{ display: tab.id === activeTab ? 'block' : 'none', height: '100%', width: '100%' }}
                                >
                                  <Editor
                                    height="100%"
                                    width="100%"
                                    defaultLanguage="lua"
                                    theme="synapse"
                                    defaultValue={tab.content || ''}
                                    onMount={(editor) => {
                                      editorsRef.current[tab.id] = editor
                                      modelsRef.current[tab.id] = editor.getModel()
                                    }}
                                    options={{
                                      fontSize, lineHeight: 26, letterSpacing: 0,
                                      fontFamily: '"SF Mono", Monaco, Menlo, Consolas, "Ubuntu Mono", "Liberation Mono", "DejaVu Sans Mono", "Courier New", monospace',
                                      fontWeight: 'normal',
                                      fontLigatures: ligatures,
                                      minimap: { enabled: minimap !== 0, side: minimap === 2 ? 'left' : 'right' },
                                      quickSuggestions: luaLSP,
                                      suggestOnTriggerCharacters: luaLSP,
                                      parameterHints: { enabled: luaLSP },
                                      scrollBeyondLastLine: false,
                                      smoothScrolling: smoothMovement,
                                      cursorSmoothCaretAnimation: smoothCursor ? 'on' : 'off',
                                      cursorStyle: 'line',
                                      lineNumbers: 'on',
                                      wordWrap: wordWrap ? 'on' : 'off',
                                      glyphMargin: true,
                                      mouseWheelScrollSensitivity: editorScrollSpeed / 100,
                                      tabSize: tabLength,
                                      stickyScroll: { enabled: stickyScroll },
                                      maxTokenizationLineLength: maxTokensPerLine,
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                              </div>
    	                        <div id="actions" className={`action-bar box-border flex h-12 w-full items-center border-t p-1 ${actionBarPos === 0 ? 'flex-row' : 'flex-row-reverse'}`}>
    	                            <div className="flex gap-1 px-1">
                                    <div
                                      className="connection-toggle group flex items-center justify-center text-xl cursor-pointer"
                                      title={
                                        !injectionEnabled 
                                          ? 'Auto-injection disabled — click to enable' 
                                          : msConnected 
                                            ? `Connected to PID ${msPid} — click to disable injection` 
                                            : msConnecting 
                                              ? 'Scanning for Roblox...' 
                                              : 'Scanning for Roblox...'
                                      }
                                      onClick={toggleInjection}
                                    >
                                      {msConnecting ? (
                                        <iconify-icon icon="svg-spinners:ring-resize" className="flex items-center justify-center"></iconify-icon>
                                      ) : (
                                        <iconify-icon 
                                          icon={injectionEnabled ? "fluent:plug-connected-20-filled" : "fluent:plug-disconnected-20-filled"}
                                          className={`flex items-center justify-center transition-opacity ${injectionEnabled ? 'opacity-100' : 'opacity-30'}`}
                                          style={{ color: injectionEnabled ? '#4ade80' : 'inherit' }}
                                        ></iconify-icon>
                                      )}
                                    </div>
                                      <div
                                        id="console-icon"
                                        title="Open console"
                                        className="flex items-center justify-center cursor-pointer"
                                        onClick={() => window.electron?.openConsole?.()}
                                      >
                                        <iconify-icon
                                          icon="fluent:pulse-square-20-regular"
                                          className="flex items-center justify-center action-button text-2xl transition"
                                        ></iconify-icon>
                                      </div>
    	                                <div id="documentation-icon" title="Open documentation" className="flex items-center justify-center">
    	                                    <iconify-icon icon="fluent:search-square-20-regular" className="flex items-center justify-center action-button text-2xl transition"></iconify-icon>
    	                                </div>
    	                                <div id="aihelp-menu" className={`flex items-center justify-center cursor-pointer ${aiPanelOpen ? 'opacity-100' : ''}`} title={aiPanelOpen ? "Hide SynapseAI" : "Show SynapseAI"} onClick={() => setAiPanelOpen(v => !v)}>
    	                                    <iconify-icon icon="fluent:bot-20-filled" className="flex items-center justify-center action-button text-2xl transition"></iconify-icon>
    	                                </div>
    	                                <div id="target-menu" className="flex items-center justify-center md:hidden" title="List targets">
    	                                    <iconify-icon icon="fluent:flash-20-filled" className="flex items-center justify-center action-button text-2xl transition"></iconify-icon>
    	                                </div>
    	                            </div>
    	                            <div className="hidden h-full items-center gap-1 md:flex pr-1 pl-0"></div>
                                <div className={`action-list flex items-center gap-1 ${actionBarPos === 0 ? 'mr-0 ml-auto' : 'ml-0 mr-auto'}`}>
                                  <button
                                    id="execute-button"
                                    className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md cursor-default ${!msConnected ? 'pointer-events-none opacity-50' : ''} ${compactButtons ? 'p-1' : 'px-2 py-1'}`}
                                    onClick={() => msExecuteScript(getTabContent(activeTab))}
                                    disabled={!msConnected}
                                  >
                                    <iconify-icon icon="fluent:play-20-filled" className="flex items-center justify-center"></iconify-icon>
                                    {!compactButtons && 'Execute'}
                                  </button>
                                  <button
                                    id="clear-button"
                                    className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md cursor-default ${compactButtons ? 'p-1' : 'px-2 py-1'}`}
                                    onClick={() => {
                                      const editor = editorsRef.current[activeTab]
                                      if (!editor) return
                                      editor.executeEdits('clear', [{ range: editor.getModel().getFullModelRange(), text: '' }])
                                      editor.setPosition({ lineNumber: 1, column: 1 })
                                      editor.focus()
                                    }}
                                  >
                                    <iconify-icon icon="fluent:eraser-20-filled" className="flex items-center justify-center"></iconify-icon>
                                    {!compactButtons && 'Clear'}
                                  </button>
                                  <button id="openf-button" className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md cursor-default ${compactButtons ? 'p-1' : 'px-2 py-1'}`}>
                                    <iconify-icon icon="fluent:document-arrow-up-20-filled" className="flex items-center justify-center"></iconify-icon>
                                    {!compactButtons && 'Open'}
                                  </button>
                                  <button
                                    id="executef-button"
                                    className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md cursor-default ${!msConnected ? 'pointer-events-none opacity-50' : ''} ${compactButtons ? 'p-1' : 'px-2 py-1'}`}
                                    disabled={!msConnected}
                                    onClick={async () => {
                                      const path = await window.electron?.selectFile?.()
                                      if (!path) return
                                      const nodefs = window.require?.('fs')
                                      const nodepath = window.require?.('path')
                                      if (!nodefs) return
                                      let script = nodefs.readFileSync(path, 'utf-8')
                                      if (contextualExecutionRef.current && nodepath) {
                                        const dir = nodepath.dirname(path).replace(/\\/g, '/')
                                        script = '-- [contextual execution: ' + dir + ']\nlocal __synapse_cwd = "' + dir + '"\n' + script
                                      }
                                      msExecuteScript(script)
                                    }}
                                  >
                                    <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center"></iconify-icon>
                                    {!compactButtons && 'Execute'}
                                  </button>
                                  <button id="savef-button" className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md cursor-default ${compactButtons ? 'p-1' : 'px-2 py-1'}`} onClick={async () => {
                                      const tabId = activeTabRef.current
                                      const tab = tabsRef.current.find(t => t.id === tabId)
                                      const code = modelsRef.current[tabId]?.getValue() ?? ''
                                      if (tab?.filePath) {
                                        window.electron?.saveFile?.(tab.filePath, code)
                                      } else {
                                        const path = await window.electron?.saveFileDialog?.(tab?.title ?? 'script.lua')
                                        if (path) {
                                          setTabs(prev => prev.map(t => t.id === tabId ? { ...t, filePath: path, title: path.split('/').pop() } : t))
                                          window.electron?.saveFile?.(path, code)
                                        }
                                      }
                                    }}>
                                    <iconify-icon icon="fluent:save-20-filled" className="flex items-center justify-center"></iconify-icon>
                                    {!compactButtons && 'Save'}
                                  </button>
                                </div>
    	                        </div>

    	                </div>
                    <div
                    ref={sidebarRef}
                    className="h-full"
                    style={{
                      position: 'relative',
                      userSelect: 'auto',
                      width: hideSidebar ? '0px' : `${sidebarWidth}px`,
                      maxWidth: hideSidebar ? '0px' : '600px',
                      minWidth: hideSidebar ? '0px' : '150px',
                      height: '100%',
                      boxSizing: 'border-box',
                      flexShrink: 0,
                      overflow: 'hidden',
                      transition: hideSidebar ? 'width 0.2s ease, max-width 0.2s ease' : 'none',
                    }}
                  >
                    <div className={`sidebar h-full border-l ${hideSidebar ? 'hidden' : ''}`}>
                      <div className="tree flex h-full flex-col gap-0.5">
                        <div className="hw-textbox rounded-md px-2 py-1">
                          <div className="inner flex items-center gap-2">
                            <iconify-icon icon="heroicons:magnifying-glass" className="flex items-center justify-center"></iconify-icon>
                            <input 
                              className="w-full border-none bg-transparent text-inherit outline-none" 
                              type="text" 
                              placeholder="Search files..."
                              value={fileSearch}
                              onChange={(e) => setFileSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="min-h-0 flex-1 overflow-y-auto">
                          <div className="module-caption group sticky top-0 z-10 flex items-center border-y p-0.5">
                            <iconify-icon
                              icon="heroicons:chevron-down"
                              className="flex items-center justify-center chevron text-[0] opacity-50 transition-all hover:opacity-100 group-hover:text-base cursor-pointer"
                              style={{ transform: fsOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                              onClick={() => setFsOpen(!fsOpen)}
                            ></iconify-icon>
                            <div className="text text-base">
                              <div className="flex items-center gap-1 text-blue-400">
                                <iconify-icon icon="fluent:hard-drive-20-filled" className="flex items-center justify-center text-lg"></iconify-icon> Local Filesystem
                              </div>
                            </div>
                          </div>
                          <div className="module w-full overflow-x-hidden">
                            {fsOpen && directories.map(dir => (
                              <DirTree key={dir} dirPath={dir} onContextMenu={setContextMenu} folderColors={folderColors} search={fileSearch} />
                            ))}
                          </div>

                          <div className="module-caption group sticky top-0 z-10 flex items-center border-y p-0.5">
                            <iconify-icon
                              icon="heroicons:chevron-down"
                              className="flex items-center justify-center chevron text-[0] opacity-50 transition-all hover:opacity-100 group-hover:text-base cursor-pointer"
                              style={{ transform: bookmarksOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                              onClick={() => setBookmarksOpen(!bookmarksOpen)}
                            ></iconify-icon>
                            <div className="text text-base">
                              <div className="flex items-center gap-1 text-yellow-400">
                                <iconify-icon icon="fluent:bookmark-20-filled" className="flex items-center justify-center text-lg"></iconify-icon> Bookmarks
                              </div>
                            </div>
                            <div className="actions ml-auto mr-1 flex text-base">
                              <div className="active:opacity-50 cursor-pointer" onClick={() => setShowAddBookmark(true)}>
                                <iconify-icon icon="fluent:add-20-filled" className="flex items-center justify-center button"></iconify-icon>
                              </div>
                            </div>
                          </div>

                          <div className="module w-full overflow-x-hidden"></div>

                          <div className="module-caption group sticky top-0 z-10 flex items-center border-y p-0.5">
                            <iconify-icon
                              icon="heroicons:chevron-down"
                              className="flex items-center justify-center chevron text-[0] opacity-50 transition-all hover:opacity-100 group-hover:text-base cursor-pointer"
                              style={{ transform: gistsOpen ? 'rotate(0deg)' : 'rotate(180deg)' }}
                              onClick={() => setGistsOpen(!gistsOpen)}
                            ></iconify-icon>
                            <div className="text text-base">
                              <div className="flex items-center gap-1 text-green-400">
                                <iconify-icon icon="ci:github" className="flex items-center justify-center text-lg"></iconify-icon> GitHub Gists
                              </div>
                            </div>
                            <div className="actions ml-auto mr-1 flex text-base gap-1">
                              {githubPAT && (
                                <div className="active:opacity-50 cursor-pointer opacity-50 hover:opacity-100" title="Clear PAT / logout"
                                  onClick={() => { localStorage.removeItem('githubPAT'); setGithubPAT(''); setGists([]); setGistsError(null) }}>
                                  <iconify-icon icon="fluent:sign-out-20-filled" className="flex items-center justify-center button"></iconify-icon>
                                </div>
                              )}
                              <div className="active:opacity-50 cursor-pointer" title={githubPAT ? 'Refresh gists' : 'Connect GitHub'}
                                onClick={() => { if (githubPAT) fetchGists(githubPAT); else setShowGithubDialog(true) }}>
                                <iconify-icon icon="fluent:arrow-clockwise-20-filled" className="flex items-center justify-center button"></iconify-icon>
                              </div>
                            </div>
                          </div>
                          <div className="module w-full overflow-x-hidden">
                            {gistsOpen && (
                              gistsLoading ? (
                                <div className="flex items-center gap-2 px-2 py-1 text-xs opacity-50">
                                  <iconify-icon icon="svg-spinners:ring-resize" className="flex items-center justify-center"></iconify-icon> Loading gists...
                                </div>
                              ) : gistsError ? (
                                <div className="px-2 py-1 text-xs text-red-400">{gistsError}</div>
                              ) : !githubPAT ? (
                                <div className="px-2 py-1 text-xs opacity-40 italic cursor-pointer hover:opacity-70" onClick={() => setShowGithubDialog(true)}></div>
                              ) : gists.length === 0 ? (
                                <div className="px-2 py-1 text-xs opacity-40 italic">No gists found</div>
                              ) : gists.map(gist => {
                                const firstName = Object.keys(gist.files)[0]
                                const desc = gist.description || firstName
                                return (
                                  <div key={gist.id} className="node-caption group flex items-center py-0.5 pl-1 opacity-70 hover:opacity-100 active:opacity-50 cursor-pointer" title={desc} onClick={() => openGistInTab(gist)}>
                                    <iconify-icon icon="fluent:document-20-filled" className="flex items-center justify-center w-4 min-w-[1rem]" style={{ color: 'rgb(74, 222, 128)' }}></iconify-icon>
                                    <div className="ml-2 overflow-ellipsis whitespace-nowrap text-xs">{desc}</div>
                                  </div>
                                )
                              })
                            )}
                          </div>
                          <div className="module w-full overflow-x-hidden"></div>
                        </div>
                      </div>
                    </div>

                    {/* Single drag handle on the left edge */}
                    <div
                      style={{
                        position: 'absolute',
                        userSelect: 'none',
                        width: '8px',
                        height: '100%',
                        top: 0,
                        left: 0,
                        cursor: 'col-resize',
                        zIndex: 10,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        const startX = e.clientX
                        const startW = sidebarRef.current.offsetWidth
                        const onMove = (ev) => {
                          // Dragging left edge: moving mouse LEFT increases width
                          const delta = startX - ev.clientX
                          const newW = Math.min(600, Math.max(150, startW + delta))
                          sidebarRef.current.style.width = newW + 'px'
                        }
                        const onUp = () => {
                          setSidebarWidth(sidebarRef.current.offsetWidth)
                          window.removeEventListener('mousemove', onMove)
                          window.removeEventListener('mouseup', onUp)
                        }
                        window.addEventListener('mousemove', onMove)
                        window.addEventListener('mouseup', onUp)
                      }}
                    />
                    </div>
    	            </div>
    	          </div>
    	        </div> {/* }/ Settings page */} <div className={pageClass('settings')} style={{background: '#1a1818'}}>
    	            <div className="absolute top-0 left-0 flex h-full w-full flex-col overflow-y-auto">
    	                <div className="hw-multimenu flex h-full max-h-full w-full">
    	                    <div className="list z-10 flex flex-col border-r lg:w-1/5">
    	                        <div title="Application" 
                                  className={`entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2 cursor-pointer ${activeSettingsSection === 'appsettings' ? 'select' : ''}`}
                                  onClick={() => scrollToSettings('appsettings')}
                              >
    	                            <iconify-icon icon="fluent:wrench-20-filled" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                            <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">Application</div>
    	                        </div>
    	                        <div title="Editor" 
                                  className={`entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2 cursor-pointer ${activeSettingsSection === 'settings-category-editor' ? 'select' : ''}`}
                                  onClick={() => scrollToSettings('settings-category-editor')}
                              >
    	                            <iconify-icon icon="fluent:code-20-filled" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                            <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">Editor</div>
    	                        </div>
    	                        <div title="Console" 
                                  className={`entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2 cursor-pointer ${activeSettingsSection === 'settings-category-console' ? 'select' : ''}`}
                                  onClick={() => scrollToSettings('settings-category-console')}
                              >
    	                            <iconify-icon icon="fluent:window-console-20-filled" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                            <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">Console</div>
    	                        </div>
    	                        <div title="Layout" 
                                  className={`entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2 cursor-pointer ${activeSettingsSection === 'settings-category-interface' ? 'select' : ''}`}
                                  onClick={() => scrollToSettings('settings-category-interface')}
                              >
    	                            <iconify-icon icon="fluent:layer-diagonal-20-filled" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                            <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">Layout</div>
    	                        </div>
    	                        <div title="Miscellaneous" 
                                  className={`entry group flex items-center border-b py-2 px-3 transition-colors lg:gap-2 cursor-pointer ${activeSettingsSection === 'settings-category-misc' ? 'select' : ''}`}
                                  onClick={() => scrollToSettings('settings-category-misc')}
                              >
    	                            <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center text-xl transition-opacity group-hover:opacity-100 opacity-50 group-active:opacity-50"></iconify-icon>
    	                            <div className="caption hidden transition-opacity group-hover:opacity-100 lg:flex opacity-50 group-active:opacity-50">Miscellaneous</div>
    	                        </div>
    	                    </div>
                        <div className="flex max-h-full grow flex-col">
                          <div className="hw-textbox rounded-md px-2 py-1">
                            <div className="inner flex items-center gap-2">
                              <iconify-icon icon="fluent:search-20-filled" className="flex items-center justify-center"></iconify-icon>
                              <input 
                                className="w-full border-none bg-transparent text-inherit outline-none" 
                                type="text" 
                                placeholder="Search settings..."
                                value={settingsSearch}
                                onChange={(e) => setSettingsSearch(e.target.value)}
                              />
                            </div>
                          </div>
                          <div className="pages flex grow flex-col overflow-y-auto relative" ref={settingsPagesRef} onScroll={handleSettingsScroll}>


                            {/* APPLICATION */}
                            <div id="appsettings" className="page">
                              <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
                                <iconify-icon icon="fluent:wrench-20-filled" className="flex items-center justify-center"></iconify-icon> Application
                              </div>

                              <SettingsRow
                                search={settingsSearch}
                                label="Reset all settings"
                                description="Pressing this button will reset all settings and close the application."
                                content={
                                  <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => {
                                    localStorage.removeItem('synapse_settings')
                                    localStorage.removeItem('synapse_tabs')
                                    localStorage.removeItem('selectedTheme')
                                    localStorage.removeItem('githubPAT')
                                    localStorage.removeItem('synapseai_key')
                                    window.location.reload()
                                  }}>Reset</button>
                                }
                              />

                              <SettingsRow
                                search={settingsSearch}
                                label="Show changelog"
                                description="Clicking this will show you the changelog for the latest version."
                                content={
                                  <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setShowChangelog(true)}>Show</button>
                                }
                              />
                            </div>

                            {/* EDITOR */}
                            <div id="settings-category-editor" className="page">
                              <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
                                <iconify-icon icon="fluent:code-20-filled" className="flex items-center justify-center"></iconify-icon> Editor
                              </div>

                              <SettingsRow search={settingsSearch} label="Action bar position" description="Adjust the vertical location of the actionbar.">
                                <OptBtn active={actionBarPos === 0} onClick={() => setActionBarPos(0)} icon="fluent:align-left-16-filled" label="Align to left (Classic style)" />
                                <OptBtn active={actionBarPos === 1} onClick={() => setActionBarPos(1)} icon="fluent:align-right-16-filled" label="Align to right (Modern style)" />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="AI features" description="Enable beta AI features for code editing.">
                                <CB value={aiFeatures} onChange={setAiFeatures} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Compact editor buttons" description="Reduces the size of the editor buttons.">
                                <CB value={compactButtons} onChange={setCompactButtons} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Compact tabs" description="Use compact square tabs instead of round padded ones.">
                                <CB value={compactTabs} onChange={setCompactTabs} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Contextual execution" description="Files ran from the UI will assume the workspace of their directory.">
                                <CB value={contextualExecution} onChange={setContextualExecution} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Default Tab Content" description="What will be written to the contents of a new tab.">
                                  <div id="newtabcontent" className="hw-textbox rounded-md px-2 py-1">
                                    <div className="inner flex items-center gap-2 border px-1 py-0.5">
                                      <input className="w-full border-none bg-transparent text-inherit outline-none" type="" placeholder="print('Synapse winning!')" value={defaultTabContent ?? ''} onChange={e => setDefaultTabContent(e.target.value)} />
                                    </div>
                                  </div>
                                  <button disabled={defaultTabContent === defaultTabContentSaved} className={`hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default ${defaultTabContent === defaultTabContentSaved ? 'pointer-events-none opacity-50' : ''}`} onClick={() => setDefaultTabContentSaved(defaultTabContent)}>
                                    <iconify-icon icon="fluent:save-20-filled" className="flex items-center justify-center"></iconify-icon> Save
                                  </button>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Directories in sidebar" description="You can set extra directories to show up in the sidebar.">
                                  <div className="hw-list rounded-lg border min-w-[24rem]">
                                    <div className="caption flex items-center rounded-t-lg p-1 border-b">
                                      <div className="flex ml-auto gap-2">
                                        <div
                                          className="flex items-center justify-center text-lg active:opacity-50 cursor-pointer"
                                          onClick={() => {
                                            if (selectedDir) {
                                              setDirectories(prev => prev.filter(d => d !== selectedDir))
                                              setSelectedDir(null)
                                            }
                                          }}
                                        >
                                          <iconify-icon icon="fluent:subtract-20-filled" className="flex items-center justify-center"></iconify-icon>
                                        </div>
                                        <div
                                          className="flex items-center justify-center text-lg active:opacity-50 cursor-pointer"
                                          onClick={async () => {


                                            const path = await window.electron?.selectDirectory()

                                            if (path && !directories.includes(path)) {
                                              setDirectories(prev => [...prev, path])
                                              setSelectedDir(path)
                                            }
                                          }}
                                        >
                                          <iconify-icon icon="fluent:add-20-filled" className="flex items-center justify-center"></iconify-icon>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="divide-y rounded-b-lg">
                                      {directories.length === 0 ? (
                                        <div className="text-xs px-2 py-1 opacity-40 italic">No directories added</div>
                                      ) : directories.map(dir => (
                                        <div
                                          key={dir}
                                          className={`value text-xs last:rounded-b-lg px-2 py-1 cursor-pointer ${selectedDir === dir ? 'selected' : ''}`}
                                          onClick={() => setSelectedDir(dir)}
                                        >
                                          {dir}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Display information area" description="Whether the information area below the editor should be shown.">
                                <CB value={displayInfoArea} onChange={setDisplayInfoArea} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Editor action bar position" description="Adjust the vertical position of the editor action bar and tabs.">
                                  <OptBtn active={editorStyle === 0} onClick={() => setEditorStyle(0)} icon="fluent:panel-bottom-contract-20-filled" label="Actions on bottom, tabs on top" />
                                  <OptBtn active={editorStyle === 1} onClick={() => setEditorStyle(1)} icon="fluent:panel-top-contract-20-filled" label="Actions on top, tabs on bottom" />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Editor scroll speed" description="Adjusts the speed at which the mouse scrolls in the editor.">
                                  <div className="hw-slider flex items-center gap-1">
                                    <input type="range" min="10" max="300" value={editorScrollSpeed} onChange={e => setEditorScrollSpeed(+e.target.value)} />
                                    <span>{editorScrollSpeed}</span>
                                  </div>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Font Size" description="Changes the size of the editor font.">
                                  <div className="hw-slider flex items-center gap-1">
                                    <input type="range" min="8" max="48" value={fontSize} onChange={e => setFontSize(+e.target.value)} />
                                    <span>{fontSize}</span>
                                  </div>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Format on save" description="Automatically format your code when saving to a file.">
                                <CB value={formatOnSave} onChange={setFormatOnSave} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Hide sidebar" description="Toggle the visiblity of the sidebar. CTRL+B can also be used.">
                                <CB value={hideSidebar} onChange={setHideSidebar} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Language server" description="Choose your language server.">
                                  <div className="hw-dropdown min-w-[12rem] relative flex flex-col">
                                    <div className="selector flex items-center rounded-md px-2 py-1 border cursor-pointer" onClick={() => setLanguageServerOpen(!languageServerOpen)}>
                                      <div className="dropdown-entry p-1">Synapse LSP (default)</div>
                                      <iconify-icon icon="heroicons:chevron-down" className="flex items-center justify-center ml-auto transition-transform" style={{ transform: languageServerOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}></iconify-icon>
                                    </div>
                                    <div className={`list z-10 flex-col absolute top-[calc(100%_+_0.5rem)] max-h-[50vh] overflow-y-auto w-full rounded-md border ${languageServerOpen ? 'flex' : 'hidden'}`}>
                                      <div className="opacity-70 active:opacity-50 hover:opacity-100 highlight">
                                        <div className="dropdown-entry p-1">Synapse LSP (default)</div>
                                      </div>
                                    </div>
                                  </div>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Ligatures" description="Enables whether font ligatures will be rendered.">
                                <CB value={ligatures} onChange={setLigatures} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Lua language server" description="Enables the intelligent autocompletion and intellisense engine. Requires restart to apply.">
                                <CB value={luaLSP} onChange={setLuaLSP} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Maximum characters to tokenize per line" description="Controls the number of characters that is styled per editor line.">
                                  <div className="hw-slider flex items-center gap-1">
                                    <input type="range" min="420" max="50000" value={maxTokensPerLine} onChange={e => setMaxTokensPerLine(+e.target.value)} />
                                    <span>{maxTokensPerLine}</span>
                                  </div>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Minimap" description="Configure the editor minimap.">
                                  <OptBtn active={minimap === 0} onClick={() => setMinimap(0)} icon="fluent:presence-blocked-16-regular" label="No minimap" />
                                  <OptBtn active={minimap === 1} onClick={() => setMinimap(1)} icon="fluent:panel-right-contract-16-filled" label="Minimap on right" />
                                  <OptBtn active={minimap === 2} onClick={() => setMinimap(2)} icon="fluent:panel-left-contract-16-filled" label="Minimap on left" />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Show unsaved warnings" description="Warnings will be shown when trying to delete unsaved content.">
                                <CB value={showUnsavedWarnings} onChange={setShowUnsavedWarnings} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Sidebar position" description="Adjust the horizontal location of the sidebar (file list).">
                                  <OptBtn active={sidebarPos === 0} onClick={() => setSidebarPos(0)} icon="fluent:align-left-16-filled" label="Align to left" />
                                  <OptBtn active={sidebarPos === 1} onClick={() => setSidebarPos(1)} icon="fluent:align-right-16-filled" label="Align to right" />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Smooth Cursor" description="Enables smooth movement of the cursor.">
                                <CB value={smoothCursor} onChange={setSmoothCursor} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Smooth Movement" description="Enables smooth scrolling in the editor.">
                                <CB value={smoothMovement} onChange={setSmoothMovement} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Sticky scroll" description="Shows which scope you are in at the top of the editor.">
                                <CB value={stickyScroll} onChange={setStickyScroll} />
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Tab Length" description="Changes the amount of tabs inserted for indentation.">
                                  <div className="hw-slider flex items-center gap-1">
                                    <input type="range" min="2" max="8" value={tabLength} onChange={e => setTabLength(+e.target.value)} />
                                    <span>{tabLength}</span>
                                  </div>
                              </SettingsRow>

                              <SettingsRow search={settingsSearch} label="Word wrap" description="Wraps off-screen lines when enabled.">
                                <CB value={wordWrap} onChange={setWordWrap} />
                              </SettingsRow>
                            </div>

                            {/* CONSOLE */}
                            <div id="settings-category-console" className="page">
                              <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
                                <iconify-icon icon="fluent:window-console-20-filled" className="flex items-center justify-center"></iconify-icon> Console
                              </div>
                              
                              <SettingsRow search={settingsSearch} label="Log language server errors to output" description="Mostly for UI developers that are toying with the LSP.">
                                <CB value={logLSPErrors} onChange={setLogLSPErrors} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Maximum log count for preservation" description="Maximum amount of console messages to be preserved. Default: 720">
                                  <div className="hw-slider flex items-center gap-1">
                                    <input type="range" min="64" max="8192" value={maxLogCount} onChange={e => setMaxLogCount(+e.target.value)} />
                                    <span>{maxLogCount}</span>
                                  </div>
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Preserve logs across launches" description="If enabled, console logs will be preserved and loaded every launch. Could take space very rapidly.">
                                <CB value={preserveLogs} onChange={setPreserveLogs} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Show console at launch" description="Whether the console will show up under the editor at launch.">
                                <CB value={showConsoleAtLaunch} onChange={setShowConsoleAtLaunch} />
                              </SettingsRow>
                            </div>

                            {/* LAYOUT */}
                            <div id="settings-category-interface" className="page">
                              <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
                                <iconify-icon icon="fluent:layer-diagonal-20-filled" className="flex items-center justify-center"></iconify-icon> Layout
                              </div>
                              
                              <SettingsRow search={settingsSearch} label="Always on top" description="Forces the interface to render on top of all windows.">
                                <CB value={alwaysOnTop} onChange={setAlwaysOnTop} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Classic layout mode" description="Emulates the classic editor layout from yesteryear.">
                                <CB value={classicLayout} onChange={setClassicLayout} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Dealign vertical navbar items" description="Moves the vertical navbar items to the top instead of the center.">
                                <CB value={dealignNavbar} onChange={setDealignNavbar} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Forget instances on disconnect" description="Forget an instance upon disconnect even if a tab has it selected.">
                                <CB value={forgetOnDisconnect} onChange={setForgetOnDisconnect} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Interface Scale" description="Sets the zoom level of the UI.">
                                  <div className="hw-slider flex items-center gap-1">
                                    <input type="range" min="25" max="150" value={interfaceScale} onChange={e => setInterfaceScale(+e.target.value)} />
                                    <span>{interfaceScale}</span>
                                  </div>
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Log console to file (console.log)" description="Save all console outputs to console.log">
                                <CB value={logToFile} onChange={setLogToFile} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Navigation bar layout" description="Adjust the layout and positioning of the navigation bar.">
                                  <OptBtn active={navbarStyle === 0} onClick={() => setNavbarStyle(0)} icon="fluent:panel-top-contract-20-filled" label="Align to top" />
                                  <OptBtn active={navbarStyle === 1} onClick={() => setNavbarStyle(1)} icon="fluent:panel-left-contract-20-filled" label="Align to left" />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Silent launch" description="Drastically reduces the presence of the interface">
                                <CB value={silentLaunch} onChange={setSilentLaunch} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Transparent window" description="Use a different rendering mode for theme transparency effects. Applies on reboot.">
                                <CB value={transparentWindow} onChange={setTransparentWindow} />
                              </SettingsRow>
                              
                              <SettingsRow search={settingsSearch} label="Use tray icon" description="Enables the tray icon and hides the window when minimizing.">
                                <CB value={useTrayIcon} onChange={setUseTrayIcon} />
                              </SettingsRow>
                            </div>

                            {/* MISC */}
                            <div id="settings-category-misc" className="page">
                              <div className="category-label sticky top-0 z-10 flex items-center gap-1 p-1 lg:gap-2 lg:p-2">
                                <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center"></iconify-icon> Miscellaneous
                              </div>
                              
                              <SettingsRow search={settingsSearch} label="Experimental settings" description="Enable or disable access to experimental, potentially unstable settings.">
                                <CB value={experimentalSettings} onChange={setExperimentalSettings} />
                              </SettingsRow>
                              
                              {experimentalSettings && (
                                <div className="action-container flex w-full items-center px-2 py-1 lg:px-3 lg:py-2 opacity-70">
                                  <div className="text flex flex-col">
                                    <div className="caption text-xs lg:text-base flex items-center gap-1">
                                      <iconify-icon icon="fluent:beaker-20-filled" className="flex items-center justify-center text-yellow-400"></iconify-icon>
                                      No experimental settings yet
                                    </div>
                                    <div className="description text-xs opacity-50">Check back in future updates.</div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="h-4 flex-shrink-0"></div>
                                  
                          </div>
                        </div>
    	                </div>
    	            </div>
    	        </div>
    	</div>    

      {unsavedWarningTab !== null && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:warning-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Erase unsaved content</div>
                Are you sure you want to do this? All unsaved code will be erased!
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => forceCloseTab(unsavedWarningTab)}>Yes</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setUnsavedWarningTab(null)}>No</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div className="hw-contextmenu pointer-events-auto fixed z-50 flex flex-col rounded-md" style={{ top: contextMenu.y, left: contextMenu.x }}>
            {!contextMenu.isDir && (
              <>
                <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => setContextMenu(null)}>
                  <iconify-icon icon="fluent:play-20-regular" className="flex items-center justify-center"></iconify-icon> Execute
                </div>
                <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
                  openFileInTab(contextMenu.path)
                  setContextMenu(null)
                }}>
                  <iconify-icon icon="fluent:document-arrow-up-20-filled" className="flex items-center justify-center"></iconify-icon> Open
                </div>
              </>
            )}
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
              if (window.confirm('Delete this file?')) {
                window.electron.deleteFile(contextMenu.path)
              }
              setContextMenu(null)
            }}>
              <iconify-icon icon="fluent:delete-20-filled" className="flex items-center justify-center"></iconify-icon> Delete
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
              window.electron.showItemInFolder(contextMenu.path)
              setContextMenu(null)
            }}>
              <iconify-icon icon="fluent:folder-20-filled" className="flex items-center justify-center"></iconify-icon> Open in folder
            </div>
            {contextMenu.isDir && (
              <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
                setAccentDialogDetails({ path: contextMenu.path })
                setContextMenu(null)
              }}>
                <iconify-icon icon="fluent:color-20-filled" className="flex items-center justify-center"></iconify-icon> Set accent
              </div>
            )}
          </div>
        </>
      )}

      {accentDialogDetails && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 fixed inset-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:color-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Set accent</div>
                <div className="flex gap-1">
                  {[
                    'white', 'rgb(239, 68, 68)', 'rgb(249, 115, 22)', 'rgb(245, 158, 11)', 'rgb(234, 179, 8)',
                    'rgb(132, 204, 22)', 'rgb(34, 197, 94)', 'rgb(16, 185, 129)', 'rgb(20, 184, 166)',
                    'rgb(6, 182, 212)', 'rgb(14, 165, 233)', 'rgb(59, 130, 246)', 'rgb(99, 102, 241)',
                    'rgb(139, 92, 246)', 'rgb(168, 85, 247)', 'rgb(217, 70, 239)', 'rgb(236, 72, 153)', 'rgb(244, 63, 94)'
                  ].map(color => (
                    <div
                      key={color}
                      className="rounded-full p-2 hover:brightness-150 active:opacity-50"
                      style={{ backgroundColor: color }}
                      onClick={() => {
                        setFolderColors(prev => ({ ...prev, [accentDialogDetails.path]: color }))
                        setAccentDialogDetails(null)
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setAccentDialogDetails(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loginErrorMenu && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50">
          <div
            className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border"
            style={{ animationName: 'elem-blur-in', animationDuration: '100ms', animationFillMode: 'forwards' }}
          >
            <div className="flex grow gap-4 p-4">
              <iconify-icon
                icon="heroicons:user"
                className="flex items-center justify-center translate-y-1 text-2xl"
                style={{ color: 'white' }}
              ></iconify-icon>

              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Login problem</div>
                Failed to log into your account. User cancelled the authorization. Do you want to try again?
              </div>
            </div>

            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default">
                  Yes
                </button>

                <button
                  className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
                  onClick={() => window.close()}
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tabContextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setTabContextMenu(null)} />
          <div className="hw-contextmenu pointer-events-auto fixed z-50 flex flex-col rounded-md" style={{ top: tabContextMenu.y, left: tabContextMenu.x }}>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
              const tabId = tabContextMenu.tabId
              const sourceTab = tabs.find(t => t.id === tabId)
              
              if (sourceTab) {
                // Get content from editor model if available, otherwise from tab state
                const model = modelsRef.current[tabId]
                const content = model && !model.isDisposed() ? model.getValue() : (sourceTab.content || '')
                
                const newId = tabs.length ? Math.max(...tabs.map(t => t.id)) + 1 : 1
                setTabs(prev => [...prev, { 
                  id: newId, 
                  title: 'Copy of ' + sourceTab.title, 
                  content: content
                }])
                setActiveTab(newId)
              }
              setTabContextMenu(null) 
            }}>
              <iconify-icon icon="fluent:clipboard-20-filled" className="flex items-center justify-center"></iconify-icon> Duplicate
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => setTabContextMenu(null)}>
              <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center"></iconify-icon> Execute
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
              const editor = editorsRef.current[tabContextMenu.tabId]
              editor?.getAction('editor.action.formatDocument')?.run()
              setTabContextMenu(null)
            }}>
              <iconify-icon icon="fluent:math-format-linear-24-filled" className="flex items-center justify-center"></iconify-icon> Format
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer group/customize">
              <iconify-icon icon="fluent:edit-20-filled" className="flex items-center justify-center"></iconify-icon> Customize
              <iconify-icon icon="fluent:chevron-right-20-regular" className="flex items-center justify-center ml-auto"></iconify-icon>
              <div className="absolute opacity-0 pointer-events-none group-hover/customize:opacity-100 group-hover/customize:pointer-events-auto transition-opacity duration-150 w-0 overflow-visible" style={{ top: '0%', left: '100%' }}>
                  <div className="hw-contextmenu pointer-events-auto relative z-10 flex flex-col rounded-md">
                  <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
                    setRenameTabId(tabContextMenu.tabId)
                    setRenameInput(tabs.find(t => t.id === tabContextMenu.tabId)?.title ?? '')
                    setShowRenameTab(true)
                    setTabContextMenu(null)
                  }}>
                    <iconify-icon icon="fluent:rename-24-filled" className="flex items-center justify-center"></iconify-icon> Rename
                  </div>
                  <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
                    setPinnedTabs(prev => {
                      const next = new Set(prev)
                      if (next.has(tabContextMenu.tabId)) next.delete(tabContextMenu.tabId)
                      else next.add(tabContextMenu.tabId)
                      return next
                    })
                    setTabContextMenu(null)
                  }}>
                    <iconify-icon icon="fluent:pin-12-filled" className="flex items-center justify-center"></iconify-icon> Toggle pin
                  </div>
                  <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => setTabContextMenu(null)}>
                    <iconify-icon icon="fluent:lock-20-filled" className="flex items-center justify-center"></iconify-icon> Toggle readonly
                  </div>
                  <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer group/seticon">
                    <iconify-icon icon="fluent:icons-24-filled" className="flex items-center justify-center"></iconify-icon> Set icon
                    <iconify-icon icon="fluent:chevron-right-20-regular" className="flex items-center justify-center ml-auto"></iconify-icon>
                    <div className="absolute opacity-0 pointer-events-none group-hover/seticon:opacity-100 group-hover/seticon:pointer-events-auto transition-opacity duration-150 w-0 overflow-visible" style={{ top: '0%', left: '100%' }}>
                        <div className="hw-contextmenu pointer-events-auto relative z-10 flex flex-col rounded-md">
                        {[
                          { icon: 'fluent:border-none-24-filled', label: 'None', value: null },
                          { icon: 'fluent:star-24-filled', label: 'Star' },
                          { icon: 'fluent:lightbulb-24-filled', label: 'Lightbulb' },
                          { icon: 'fluent:flash-24-filled', label: 'Turbo' },
                          { icon: 'fluent:window-console-20-filled', label: 'Commands' },
                          { icon: 'fluent:beaker-24-filled', label: 'Beaker' },
                          { icon: 'fluent:shield-24-filled', label: 'Shield' },
                          { icon: 'fluent:chess-20-filled', label: 'Chess' },
                          { icon: 'ri:sword-fill', label: 'Swords' },
                          { icon: 'fluent:animal-rabbit-24-filled', label: 'Rabbit' },
                        ].map(({ icon, label, value }) => (
                          <div key={label} className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
                            setTabIcons(prev => ({ ...prev, [tabContextMenu.tabId]: value !== undefined ? value : icon }))
                            setTabContextMenu(null)
                          }}>
                            <iconify-icon icon={icon} className="flex items-center justify-center"></iconify-icon> {label}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => setTabContextMenu(null)}>
              <iconify-icon icon="fluent:folder-link-20-filled" className="flex items-center justify-center"></iconify-icon> Set directory
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => setTabContextMenu(null)}>
              <iconify-icon icon="fluent:flash-20-filled" className="flex items-center justify-center"></iconify-icon> Reset targets
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => {
              setAutoExecuteTabs(prev => {
                const next = new Set(prev)
                if (next.has(tabContextMenu.tabId)) next.delete(tabContextMenu.tabId)
                else next.add(tabContextMenu.tabId)
                return next
              })
              setTabContextMenu(null)
            }}>
              <iconify-icon icon="fluent:settings-20-filled" className="flex items-center justify-center"></iconify-icon> Toggle auto-execute
            </div>
            <div className="entry relative flex items-center gap-2 py-1 px-2 min-w-[10rem] whitespace-nowrap cursor-pointer" onClick={() => { setTabs(prev => prev.filter(t => t.id === tabContextMenu.tabId)); setActiveTab(tabContextMenu.tabId); setTabContextMenu(null) }}>
              <iconify-icon icon="fluent:dismiss-20-filled" className="flex items-center justify-center"></iconify-icon> Close all but this
            </div>
          </div>
        </>
      )}

      {showPluginWarning && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:warning-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'orange' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">May be unsafe!</div>
                <p>Enabling plugins <b>can be unsafe</b> as they involve running arbitrary code. <b>Only enable this if you have trusted plugins and you know what you're doing!</b></p>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => { setEnablePlugins(true); setShowPluginWarning(false); }}>Ok</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setShowPluginWarning(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showThemeOverride && pendingThemeSettings && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] max-w-md flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:warning-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'orange' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Theme Settings Override</div>
                <p className="text-sm">The theme <b>{pendingThemeSettings.name || selectedTheme}</b> has special setting overrides:</p>
                <div className="text-xs opacity-70 bg-black/30 rounded p-2 max-h-32 overflow-y-auto">
                  {Object.entries(pendingThemeSettings.settingOverrides || {}).map(([key, value]) => (
                    <div key={key} className="py-0.5">
                      • <span className="font-mono">{key}</span>: <span className="text-blue-400">{String(value)}</span>
                    </div>
                  ))}
                </div>
                <p className="text-xs opacity-60 mt-2">Applying these settings may require restarting Synapse for full effect.</p>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button 
                  className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
                  onClick={() => {
                    // Apply the settings
                    const overrides = pendingThemeSettings.settingOverrides || {}
                    
                    // Map theme settings to app settings
                    if (overrides.squaretabs !== undefined) setCompactTabs(overrides.squaretabs)
                    if (overrides['actionbar-direction'] !== undefined) setActionBarPos(overrides['actionbar-direction'])
                    if (overrides.classiclayout !== undefined) setClassicLayout(overrides.classiclayout)
                    if (overrides.navbarstyle !== undefined) setNavbarStyle(overrides.navbarstyle)
                    
                    setShowThemeOverride(false)
                    setPendingThemeSettings(null)
                  }}
                >
                  Apply Settings
                </button>
                <button 
                  className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
                  onClick={() => {
                    setShowThemeOverride(false)
                    setPendingThemeSettings(null)
                  }}
                >
                  Skip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAddBookmark && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:bookmark-add-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Add bookmark</div>
                Insert your bookmark's URI below.
              </div>
            </div>
            <div className="mx-2 mb-2">
              <div className="hw-textbox rounded-md px-2 py-1">
                <div className="inner flex items-center gap-2 border px-1 py-0.5">
                  <input
                    className="w-full border-none bg-transparent text-inherit outline-none"
                    type=""
                    value={bookmarkInput}
                    onChange={e => setBookmarkInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => { setBookmarkInput(''); setShowAddBookmark(false) }}>Ok</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => { setBookmarkInput(''); setShowAddBookmark(false) }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGithubDialog && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:cloud-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">GitHub</div>
                You need to provide a GitHub PAT. Do you want to create a new personal authentication token? You will need to grant it Read and write access to Gists.
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => { window.open('https://github.com/settings/personal-access-tokens/new', '_blank'); setShowGithubDialog(false); setShowGithubPAT(true) }}>Yes</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => { setShowGithubDialog(false); setShowGithubPAT(true) }}>No</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGithubPAT && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:cloud-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">GitHub PAT</div>
                Please input your personal authentication token below.
              </div>
            </div>
            <div className="mx-2 mb-2">
              <div className="hw-textbox rounded-md px-2 py-1">
                <div className="inner flex items-center gap-2 border px-1 py-0.5">
                  <input
                    className="w-full border-none bg-transparent text-inherit outline-none"
                    type="password"
                    value={githubPATInput}
                    onChange={e => setGithubPATInput(e.target.value)}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => {
                  const token = githubPATInput.trim()
                  if (token) { localStorage.setItem('githubPAT', token); setGithubPAT(token); fetchGists(token) }
                  setGithubPATInput(''); setShowGithubPAT(false)
                }}>Ok</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => { setGithubPATInput(''); setShowGithubPAT(false) }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}



      {showChangelog && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[28rem] max-w-lg flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <iconify-icon icon="fluent:history-20-filled" className="flex items-center justify-center text-xl"></iconify-icon>
              <div className="font-bold text-lg">Changelog</div>
              <button className="ml-auto opacity-50 hover:opacity-100 cursor-pointer" onClick={() => setShowChangelog(false)}>
                <iconify-icon icon="fluent:dismiss-20-filled" className="flex items-center justify-center"></iconify-icon>
              </button>
            </div>
            <div className="flex flex-col gap-3 p-4 max-h-96 overflow-y-auto text-sm">
              <div className="flex flex-col gap-1">
                <div className="font-semibold opacity-80">Synapse V3 — Latest</div>
                <ul className="list-disc pl-4 opacity-60 flex flex-col gap-1">
                  <li>MacSploit TCP injection with PID display</li>
                  <li>SynapseAI powered by Groq streaming</li>
                  <li>Task/progress panel for injection status</li>
                  <li>Settings persistence across sessions</li>
                  <li>Auto-attach and forget-on-disconnect</li>
                  <li>Console panel toggle</li>
                  <li>Gateway loading animation</li>
                </ul>
              </div>
            </div>
            <div className="flex h-14 w-full rounded-b-lg border-t items-center px-4">
              <div className="ml-auto">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setShowChangelog(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showAiError && (
  <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
    <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
      <div className="flex grow gap-4 p-4">
        <iconify-icon icon="fluent:bot-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'red' }}></iconify-icon>
        <div className="flex h-full flex-col gap-2">
          <div className="caption align-top text-xl font-bold">SynapseAI Error</div>
          SynapseAI has errored. Make sure your key is correct, has not expired, or that you have a valid Groq account at console.groq.com.
        </div>
      </div>
      <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
        <div className="ml-auto flex gap-2">
          <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setShowAiError(false)}>Ok</button>
        </div>
      </div>
    </div>
  </div>
      )}

      {showRenameTab && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:edit-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Rename tab</div>
                Input the new tab name below.
              </div>
            </div>
            <div className="mx-2 mb-2">
              <div className="hw-textbox rounded-md px-2 py-1">
                <div className="inner flex items-center gap-2 border px-1 py-0.5">
                  <input
                    className="w-full border-none bg-transparent text-inherit outline-none"
                    type="text"
                    value={renameInput}
                    onChange={e => setRenameInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (renameInput.trim()) setTabs(prev => prev.map(t => t.id === renameTabId ? { ...t, title: renameInput.trim() } : t))
                        setShowRenameTab(false)
                      }
                    }}
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => {
                  if (renameInput.trim()) setTabs(prev => prev.map(t => t.id === renameTabId ? { ...t, title: renameInput.trim() } : t))
                  setShowRenameTab(false)
                }}>Ok</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default" onClick={() => setShowRenameTab(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSynapseKeyDialog && (
        <div className="flex h-full w-full select-none items-center justify-center transition-colors pointer-events-auto bg-black/50 absolute top-0 left-0 z-50">
          <div className="hw-dialog flex min-w-[24rem] flex-col rounded-lg border" style={{ animation: '100ms ease-out 0s 1 normal forwards running elem-blur-in' }}>
            <div className="flex grow gap-4 p-4">
              <iconify-icon icon="fluent:key-20-filled" className="flex items-center justify-center translate-y-1 text-2xl" style={{ color: 'white' }}></iconify-icon>
              <div className="flex h-full flex-col gap-2">
                <div className="caption align-top text-xl font-bold">Groq API Key</div>
                Enter your Groq API key below. You can get one free at console.groq.com/keys.
              </div>
            </div>
            <div className="mx-2 mb-2">
              <div className="hw-textbox rounded-md px-2 py-1">
                <div className="inner flex items-center gap-2 border px-1 py-0.5">
                  <input
                    className="w-full border-none bg-transparent text-inherit outline-none"
                    type="password"
                    placeholder="gsk_..."
                    id="synapse-key-input"
                    autoFocus
                  />
                </div>
              </div>
            </div>
            <div className="inputs flex h-16 w-full rounded-b-lg border-t px-2 py-4">
              <div className="ml-auto flex gap-2">
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
                  onClick={() => {
                    const val = document.getElementById('synapse-key-input').value.trim()
                    if (val) {
                      localStorage.setItem('synapseai_key', val)
                      setHasOpenAIKey(true)
                    }
                    setShowSynapseKeyDialog(false)
                    setShowAiSettings(false)
                  }}>Ok</button>
                <button className="hw-button relative flex select-none items-center justify-center gap-1 rounded-md px-2 py-1 cursor-default"
                  onClick={() => setShowSynapseKeyDialog(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default App
