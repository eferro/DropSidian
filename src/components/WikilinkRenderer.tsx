interface WikilinkRendererProps {
  target: string
  displayText: string | null
  resolved: string | null
  onNavigate: (path: string) => void
}

function WikilinkRenderer({
  target,
  displayText,
  resolved,
  onNavigate,
}: WikilinkRendererProps) {
  const text = displayText ?? target

  if (resolved) {
    return (
      <button type="button" onClick={() => onNavigate(resolved)}>
        {text}
      </button>
    )
  }

  return <span>{text}</span>
}

export default WikilinkRenderer

