import React from 'react'

type State = { failed: boolean }

export class ErrorBoundary extends React.Component<React.PropsWithChildren, State> {
  state: State = { failed: false }

  static getDerivedStateFromError(): State {
    return { failed: true }
  }

  render() {
    if (this.state.failed) {
      return (
        <main className="shell">
          <section className="panel" role="alert">
            <h1>AI Friendship hit a problem</h1>
            <p>Your local data has not intentionally been deleted. Reload the app to try again.</p>
            <button type="button" onClick={() => window.location.reload()}>Reload app</button>
          </section>
        </main>
      )
    }
    return this.props.children
  }
}
