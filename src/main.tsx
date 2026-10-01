import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './returnFlow.css'
import './auroraReactions.css'
import './runtimeGuard.css'
import './ownerAurora.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ReturnFlowBridge } from './components/ReturnFlowBridge'
import { RuntimeGuard } from './components/RuntimeGuard'
import { OwnerAurora } from './components/OwnerAurora'
import { registerAuroraServiceWorker } from './registerServiceWorker'

registerAuroraServiceWorker()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <RuntimeGuard />
      <ReturnFlowBridge />
      <App />
      <OwnerAurora />
    </ErrorBoundary>
  </StrictMode>,
)
