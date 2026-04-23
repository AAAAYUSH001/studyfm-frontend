import { MoonStar, Pause, Play, RotateCcw } from 'lucide-react'

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0))
  const minutes = String(Math.floor(safeSeconds / 60)).padStart(2, '0')
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export default function StudyTimer({
  secondsRemaining,
  isRunning,
  isDimmed,
  onToggleRunning,
  onReset,
  onToggleDim,
}) {
  return (
    <div className="timer-card">
      <div className="timer-card__header">
        <div>
          <p className="eyebrow">Study Timer</p>
          <div className="timer-card__clock">{formatClock(secondsRemaining)}</div>
        </div>

        <button type="button" className="icon-chip" onClick={onToggleDim} aria-label={isDimmed ? 'Undim the interface' : 'Dim the interface'}>
          <MoonStar size={16} />
          <span>{isDimmed ? 'Undim UI' : 'Dim UI'}</span>
        </button>
      </div>

      <div className="timer-card__actions">
        <button type="button" className="primary-btn primary-btn--compact" onClick={onToggleRunning}>
          {isRunning ? <Pause size={16} /> : <Play size={16} />}
          <span>{isRunning ? 'Pause' : 'Start'}</span>
        </button>

        <button type="button" className="secondary-btn secondary-btn--compact" onClick={onReset}>
          <RotateCcw size={16} />
          <span>Reset</span>
        </button>
      </div>
    </div>
  )
}
