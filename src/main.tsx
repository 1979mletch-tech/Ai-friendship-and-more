import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './returnFlow.css'
import './auroraReactions.css'
import './runtimeGuard.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ReturnFlowBridge } from './components/ReturnFlowBridge'
import { RuntimeGuard } from './components/RuntimeGuard'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RuntimeGuard />
      <ReturnFlowBridge />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
