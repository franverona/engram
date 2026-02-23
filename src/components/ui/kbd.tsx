type KbdProps = {
  keys: string[]
}

export function Kbd({ keys }: KbdProps) {
  return (
    <span className="flex items-center gap-0.5">
      {keys.map((key) => (
        <kbd
          key={key}
          className="inline-flex items-center justify-center rounded border border-border bg-surface-secondary px-1 py-0.5 font-mono text-[10px] text-text-muted shadow-sm"
        >
          {key}
        </kbd>
      ))}
    </span>
  )
}
