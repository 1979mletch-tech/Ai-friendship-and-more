export const focusTargetAfterRoute = (route: string) => route === '/chat' ? 'chat-heading' : 'page-heading'
export const shouldRestoreFocus = (previousRoute: string, nextRoute: string) => previousRoute !== nextRoute
