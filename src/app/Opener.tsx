import { parseOpener } from '../lib/plans'

/** Renders an opener with `|` / `||` shown as one or two stop dots. */
export function Opener({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {parseOpener(text).map((s, i) => (
        <span key={i}>
          {s.text}
          {s.stop > 0 && (
            <span className="mx-1.5 inline-flex gap-1 align-middle" aria-label={`${s.stop}-second stop`}>
              {Array.from({ length: s.stop }, (_, d) => (
                <span key={d} className="inline-block size-2 rounded-full bg-orange-400" />
              ))}
            </span>
          )}{' '}
        </span>
      ))}
    </span>
  )
}
