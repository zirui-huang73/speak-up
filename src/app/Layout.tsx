import type { ComponentType } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ChartIcon, ClipboardIcon, MoreIcon, SunIcon } from './icons'

const NAV: { to: string; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { to: '/', label: 'Today', icon: SunIcon },
  { to: '/plans', label: 'Plans', icon: ClipboardIcon },
  { to: '/progress', label: 'Progress', icon: ChartIcon },
  { to: '/more', label: 'More', icon: MoreIcon },
]

const active = 'text-orange-600 dark:text-orange-400'

export function Layout() {
  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 hidden w-56 flex-col gap-1 border-r border-stone-200 bg-white p-4 md:flex dark:border-stone-800 dark:bg-stone-900">
        <div className="mb-6 flex items-center gap-2 px-2 text-lg font-semibold text-orange-600 dark:text-orange-400">
          <img src={`${import.meta.env.BASE_URL}favicon.svg`} alt="" className="size-8 rounded-lg" />
          Speak Up
        </div>
        {NAV.map(({ to, label, icon: I }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 font-medium transition ${
                isActive
                  ? `bg-orange-50 dark:bg-orange-950 ${active}`
                  : 'text-stone-600 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-800'
              }`
            }
          >
            <I />
            {label}
          </NavLink>
        ))}
      </aside>

      <main className="mx-auto max-w-2xl px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-28 md:pl-60 md:pb-10 lg:max-w-3xl lg:pl-64">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-10 grid grid-cols-4 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-stone-800 dark:bg-stone-900/95">
        {NAV.map(({ to, label, icon: I }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
                isActive ? active : 'text-stone-500 dark:text-stone-400'
              }`
            }
          >
            <I />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
