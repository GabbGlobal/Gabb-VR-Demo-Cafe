import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initIdentity } from './lib/identity'
import { useUserStore } from './store/userStore'

// Sync Netlify Identity → Zustand on app start
const store = useUserStore.getState()
initIdentity(store)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
