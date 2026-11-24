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

it('runs a brave moment from Today: guess, get ready, go, report, feedback; then logs one', async () => {
  const el = document.createElement('div')
  document.body.append(el)
  window.location.hash = '#/'
  await act(async () => createRoot(el).render(<App />))
  await wait(() => !!el.textContent?.includes("I'm about to speak"))

  const btn = (label: string) => [...el.querySelectorAll('button')].find((b) => b.textContent?.trim() === label)!
  window.location.hash = '#/moment'
  await wait(() => !!el.textContent?.includes("What's coming up?"))
  await act(async () => btn('Breaking a silence').click())
  expect(el.textContent).toContain('How anxious do you expect to feel?')
  const slider = el.querySelector('input[type="range"]') as HTMLInputElement
  const setVal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setVal.call(slider, '8')
    slider.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => btn('Likely').click())
  await act(async () => btn('Next').click())
  expect(el.textContent).toContain('Breathe in')
  await act(async () => btn('Skip to my opener').click())
  expect(el.textContent).toContain('So‿how was your weekend?')
  expect(el.textContent).toContain('Slow – Link – Stop')
  await act(async () => btn('Go speak').click())

  await wait(() => !!el.textContent?.includes('How did it go?'))
  const pendingLink = [...el.querySelectorAll('a')].find((a) => a.textContent?.includes('How did it go?'))!
  await act(async () => pendingLink.click())
  await wait(() => !!el.textContent?.includes('Did you speak?'))
  await act(async () => btn('Yes').click())
  const felt = el.querySelector('input[type="range"]') as HTMLInputElement
  await act(async () => {
    setVal.call(felt, '4')
    felt.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => btn('Pass').click())
  await act(async () => btn('Save').click())
  await wait(() => !!el.textContent?.includes('Brave moment #1'))
  expect(el.textContent).toContain('You expected 8. It felt like 4.')
  expect(el.textContent).toContain('You thought you might get stuck. It was a Pass.')
  expect(el.textContent).toContain('Your first one')

  window.location.hash = '#/log'
  await wait(() => !!el.textContent?.includes('What was it?'))
  await act(async () => btn('Meeting').click())
  await act(async () => btn('Not this time').click())
  await act(async () => btn('Save').click())
  await wait(() => !!el.textContent?.includes("That's okay."))

  window.location.hash = '#/'
  await wait(() => !!el.textContent?.includes('this week'))
  expect(el.textContent).not.toContain('How did it go?')
})

it('shows three daily missions, starts one into the moment flow, and edits the ladder', async () => {
  const el = document.createElement('div')
  document.body.append(el)
  window.location.hash = '#/'
  await act(async () => createRoot(el).render(<App />))
  await wait(() => !!el.textContent?.includes("Today's missions") && el.querySelectorAll('a[href*="mission="]').length === 3)
  expect(el.textContent).toContain('Level 1 · Warm-up')

  const start = el.querySelector('a[href*="mission="]') as HTMLAnchorElement
  await act(async () => start.click())
  await wait(() => !!el.textContent?.includes('Make a quick guess'))

  window.location.hash = '#/more/ladder'
  await wait(() => !!el.textContent?.includes('Your ladder'))
  expect(el.textContent).toContain('Level 5 · Center stage')
  await act(async () => (el.querySelector('button[aria-label="Add mission to level 2"]') as HTMLButtonElement).click())
  const input = el.querySelector('input[aria-label="Mission"]') as HTMLInputElement
  const setVal = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  await act(async () => {
    setVal.call(input, 'Say hi to the security guard')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => [...el.querySelectorAll('button')].find((b) => b.textContent === 'Save')!.click())
  await wait(() => !!el.textContent?.includes('Say hi to the security guard'))
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
