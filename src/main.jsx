import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ConsoleWindow from './Console.jsx'

const isConsoleWindow = new URLSearchParams(window.location.search).get('window') === 'console'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isConsoleWindow ? <ConsoleWindow /> : <App />}
  </StrictMode>,
)