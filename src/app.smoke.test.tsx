import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { expect, it } from 'vitest'
import App from './App'

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
window.matchMedia ??= (() => ({ matches: false, addEventListener() {}, removeEventListener() {} })) as never

const wait = async (until: () => boolean) => {
  for (let i = 0; i < 40; i++) {
    await act(() => new Promise((r) => setTimeout(r, 25)))
    if (until()) return
  }
}

it('renders Today with the install hint, then settings and storage pages', async () => {
  const el = document.createElement('div')
  document.body.append(el)
  window.location.hash = '#/'
  await act(async () => createRoot(el).render(<App />))
  await wait(() => !!el.textContent?.includes('Every time you speak up counts'))
  expect(el.textContent).toContain('Install for safer storage')
  expect(el.textContent).not.toContain('Time for a backup')

  window.location.hash = '#/more/settings'
  await wait(() => !!el.querySelector('#name'))
  expect(el.textContent).toContain('Theme')

  window.location.hash = '#/more/storage'
  await wait(() => !!el.textContent?.includes('Export backup'))
  expect(el.textContent).toContain('Last backup')
  expect(el.textContent).toContain('Never')
})
