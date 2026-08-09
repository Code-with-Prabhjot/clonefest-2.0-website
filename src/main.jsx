import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

// Order matters: Tailwind first, then the portal base (fonts, keyframes,
// scrollbars), then the landing's scoped overrides.
import './index.css'
import './styles/portal-base.css'
import './styles/landing.css'

import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
