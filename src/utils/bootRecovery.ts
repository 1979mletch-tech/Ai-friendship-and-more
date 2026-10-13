export const showBootFailure = (targetRoot?: HTMLElement | null): void => {
  if (typeof document === 'undefined') return
  if (document.getElementById('aurora-boot-failure')) return
  const rootElement = targetRoot ?? document.getElementById('root')
  if (!rootElement) return
  const panel = document.createElement('main')
  panel.id = 'aurora-boot-failure'
  panel.setAttribute('role', 'alert')
  const heading = document.createElement('h1')
  heading.textContent = 'Aurora could not start'
  const message = document.createElement('p')
  message.textContent = 'A loading problem occurred. Please reload Aurora.'
  const retry = document.createElement('button')
  retry.textContent = 'Reload Aurora'
  retry.addEventListener('click', () => window.location.reload())
  panel.append(heading, message, retry)
  rootElement.replaceChildren(panel)
}

export const installBootRecovery = (targetWindow: Window = window): void => {
  if (typeof targetWindow === 'undefined') return
  targetWindow.addEventListener('error', () => showBootFailure())
  targetWindow.addEventListener('unhandledrejection', () => showBootFailure())
}
