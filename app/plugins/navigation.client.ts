export default defineNuxtPlugin(() => {
  const route = useRoute()
  const router = useRouter()
  let navigating = false
  let returning = false
  const remembered = new Map<string, string>()
  window.addEventListener('popstate', () => { returning = true })
  router.beforeEach((to, from) => { navigating = to.path !== from.path })
  document.addEventListener('click', (event) => {
    const target = (event.target as Element)?.closest<HTMLElement>('[data-remember-focus]')
    if (target?.id) remembered.set(route.path, target.id)
  })
  // Focus the entering page itself, after Vue has removed the previous page.
  const restorePageFocus = (page: Element) => {
    if (!navigating || !page.isConnected) return
    navigating = false
    let id = ''
    try { id = decodeURIComponent(route.hash.slice(1)) } catch { /* Ignore malformed fragments. */ }
    const target = (id ? document.getElementById(id) : undefined) || (returning ? document.getElementById(remembered.get(route.path) || '') : undefined) || page.querySelector<HTMLElement>('h1')
    if (target) { if (!target.hasAttribute('tabindex') && !target.matches('a, button')) target.tabIndex = -1; target.focus({ preventScroll: true }) }
    returning = false
  }
  return { provide: { restorePageFocus } }
})
