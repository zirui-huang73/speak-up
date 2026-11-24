import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
      {subtitle && <p className="mt-1 text-stone-500 dark:text-stone-400">{subtitle}</p>}
    </header>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-2xl border border-stone-200 bg-white p-5 shadow-sm dark:border-stone-800 dark:bg-stone-900 ${className}`}
    >
      {children}
    </section>
  )
}

export function ComingSoon({ step, children }: { step: number; children: ReactNode }) {
  return (
    <Card className="border-dashed">
      <p className="text-xs font-semibold tracking-wider text-orange-600 uppercase dark:text-orange-400">
        Coming in step {step}
      </p>
      <div className="mt-2 text-stone-600 dark:text-stone-300">{children}</div>
    </Card>
  )
}

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="text-sm text-orange-700 dark:text-orange-400">
      ‹ {label}
    </Link>
  )
}

export const primaryBtn =
  'rounded-xl bg-orange-600 px-4 py-2.5 font-medium text-white hover:bg-orange-700 active:scale-[0.98] disabled:opacity-40'
export const secondaryBtn =
  'rounded-xl border border-stone-300 px-4 py-2.5 font-medium text-stone-700 hover:bg-stone-50 dark:border-stone-700 dark:text-stone-200 dark:hover:bg-stone-800'
export const inputCls =
  'mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 dark:border-stone-700 dark:bg-stone-800'
