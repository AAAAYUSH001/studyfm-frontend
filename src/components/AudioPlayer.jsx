import { useEffect, useRef, useState } from 'react'
import { LoaderCircle, Pause, Play, RotateCcw } from 'lucide-react'

const formatTimestamp = (seconds) => {
  const safeSeconds = Math.max(0, Math.round(Number(seconds) || 0))
  const minutes = Math.floor(safeSeconds / 60)
  const remainingSeconds = String(safeSeconds % 60).padStart(2, '0')
  return `${minutes}:${remainingSeconds}`
}

export default function AudioPlayer({
  audioUrl,
  title,
  language,
  languageOptions,
  onLanguageChange,
  audioStatus,
  audioError,
  onRetry,
  autoplayToken,
}) {
  const audioRef = useRef(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [playerHint, setPlayerHint] = useState('')

  useEffect(() => {
    const audio = audioRef.current

    if (!audio) {
      return
    }

    audio.pause()
    setIsPlaying(false)
    setIsBuffering(false)
    setCurrentTime(0)
    setDuration(0)

    if (!audioUrl) {
      audio.removeAttribute('src')
      audio.load()
      return
    }

    audio.currentTime = 0
    audio.load()
    setPlayerHint('')
  }, [audioUrl])

  useEffect(() => {
    if (!audioUrl || !autoplayToken || !audioRef.current) {
      return
    }

    const attemptAutoplay = async () => {
      try {
        await audioRef.current.play()
        setPlayerHint('')
      } catch {
        setPlayerHint('Audio is ready. Tap play to start it on this device.')
      }
    }

    void attemptAutoplay()
  }, [audioUrl, autoplayToken])

  const handlePlayPause = async () => {
    const audio = audioRef.current

    if (!audio || !audioUrl) {
      return
    }

    if (audio.paused) {
      try {
        setIsBuffering(true)
        await audio.play()
        setPlayerHint('')
      } catch {
        setIsBuffering(false)
        setPlayerHint('Playback was blocked by the browser. Tap play again after interacting with the page.')
      }
      return
    }

    audio.pause()
  }

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        preload="metadata"
        playsInline
        src={audioUrl || undefined}
        onLoadStart={() => setIsBuffering(Boolean(audioUrl))}
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration || 0)}
        onCanPlay={() => setIsBuffering(false)}
        onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)}
        onPlay={() => setIsPlaying(true)}
        onPlaying={() => {
          setIsBuffering(false)
          setIsPlaying(true)
        }}
        onWaiting={() => setIsBuffering(true)}
        onSeeking={() => setIsBuffering(true)}
        onSeeked={() => setIsBuffering(false)}
        onPause={() => {
          if (!audioRef.current?.ended) {
            setIsPlaying(false)
          }
        }}
        onEnded={() => {
          setIsBuffering(false)
          setIsPlaying(false)
          setCurrentTime(duration)
        }}
        onError={() => {
          setIsBuffering(false)
          setIsPlaying(false)
          setPlayerHint('This audio could not be played on the current device.')
        }}
      />

      <div className="audio-player__meta">
        <p className="eyebrow">Audio Player</p>
        <strong>{title}</strong>
        <span className="helper-copy">
          {audioStatus === 'generating'
            ? 'Generating narration...'
            : isBuffering
              ? 'Buffering audio...'
            : audioStatus === 'ready'
              ? 'Ready to play'
              : audioStatus === 'error'
                ? 'Audio needs attention'
                : 'Generate a summary to unlock audio'}
        </span>
      </div>

      <div className="audio-player__controls">
        <button
          type="button"
          className="play-button"
          disabled={!audioUrl || audioStatus === 'generating'}
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
        >
          {audioStatus === 'generating' || isBuffering ? <LoaderCircle className="spin" size={18} /> : isPlaying ? <Pause size={18} /> : <Play size={18} />}
        </button>

        <div className="audio-player__timeline">
          <div className="audio-player__time-row">
            <span>{formatTimestamp(currentTime)}</span>
            <span>{formatTimestamp(duration)}</span>
          </div>

          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            disabled={!audioUrl}
            className="range-field"
            onChange={(event) => {
              const nextValue = Number(event.target.value)
              setCurrentTime(nextValue)
              if (audioRef.current) {
                audioRef.current.currentTime = nextValue
              }
            }}
          />
        </div>
      </div>

      <div className="audio-player__actions">
        <label className="select-wrapper">
          <span className="sr-only">Narration language</span>
          <select value={language} onChange={(event) => onLanguageChange(event.target.value)} className="select-field">
            {languageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {audioError ? (
          <button type="button" className="secondary-btn secondary-btn--compact" onClick={onRetry}>
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        ) : null}
      </div>

      {playerHint ? <p className="helper-copy">{playerHint}</p> : null}
    </div>
  )
}
