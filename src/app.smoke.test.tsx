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

it('lists plans, practices one, adds a plan, and edits the speech plan', async () => {
  const el = document.createElement('div')
  document.body.append(el)
  window.location.hash = '#/plans'
  await act(async () => createRoot(el).render(<App />))
  await wait(() => !!el.textContent?.includes('If–then plans'))
  expect(el.textContent).toContain('So‿how was your weekend?')

  const buttons = (label: string) => [...el.querySelectorAll('button')].filter((b) => b.textContent?.trim() === label)
  await act(async () => buttons('Practice')[0].click())
  const card = el.querySelector('.fixed [role="button"]') as HTMLElement
  for (let i = 0; i < 3; i++) await act(async () => card.click())
  expect(el.textContent).toContain('Ready. It will come out on its own.')
  await act(async () => buttons('Done')[0].click())
  await wait(() => !!el.textContent?.includes('Practiced 1×'))

  await act(async () => buttons('New plan')[0].click())
  const textarea = el.querySelector('textarea') as HTMLTextAreaElement
  const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  await act(async () => {
    setter.call(textarea, 'Can I add | one thing?')
    textarea.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => buttons('Save')[0].click())
  await wait(() => !!el.textContent?.includes('Can I add'))

  await act(async () => buttons('Hum – Link – Stop')[0].click())
  expect((el.querySelector('input[aria-label="Pressure plan"]') as HTMLInputElement).value).toBe('Hum – Link – Stop')
})
