import { ComingSoon, PageHeader } from '../app/ui'

export function ProgressPage() {
  return (
    <>
      <PageHeader title="Progress" subtitle="Your own proof that it gets easier." />
      <ComingSoon step={5}>Expected vs felt anxiety, streaks, trends and your history.</ComingSoon>
    </>
  )
}
