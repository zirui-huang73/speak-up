import { ComingSoon, PageHeader } from '../app/ui'

export function PlansPage() {
  return (
    <>
      <PageHeader title="Plans" subtitle="Decide in advance what you will say." />
      <ComingSoon step={2}>If-then plans with ready openers, and your Speech Plan card.</ComingSoon>
    </>
  )
}

export function ProgressPage() {
  return (
    <>
      <PageHeader title="Progress" subtitle="Your own proof that it gets easier." />
      <ComingSoon step={5}>Expected vs felt anxiety, streaks, trends and your history.</ComingSoon>
    </>
  )
}
