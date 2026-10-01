import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './returnFlow.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ReturnFlowBridge } from './components/ReturnFlowBridge'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReturnFlowBridge />
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
