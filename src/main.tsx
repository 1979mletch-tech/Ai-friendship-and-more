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

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Aurora application root is missing.')

const showBootFailure = () => {
  if (rootElement.hasChildNodes()) return
  const panel = document.createElement('main')
  panel.setAttribute('role', 'alert')
  const heading = document.createElement('h1')
  heading.textContent = 'Aurora could not start'
  const message = document.createElement('p')
  message.textContent = 'A loading problem occurred. Please reload Aurora.'
  const retry = document.createElement('button')
  retry.textContent = 'Reload Aurora'
  retry.addEventListener('click', () => window.location.reload())
  panel.append(heading, message, retry)
  rootElement.append(panel)
}
window.addEventListener('error', showBootFailure)
window.addEventListener('unhandledrejection', showBootFailure)

registerAuroraServiceWorker()

createRoot(rootElement).render(
  <StrictMode>
    <ErrorBoundary>
      <RuntimeGuard />
      <ReturnFlowBridge />
      <App />
      <OwnerAurora />
    </ErrorBoundary>
  </StrictMode>,
)
