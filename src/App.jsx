import { useEffect, useMemo, useRef, useState } from 'react'
import { FileText, ListChecks, Sparkles, WandSparkles } from 'lucide-react'
import AIOutput from './components/AIOutput'
import AudioPlayer from './components/AudioPlayer'
import StudyTimer from './components/StudyTimer'
import UploadZone from './components/UploadZone'
import { generateAudioBlob, generateQuiz, generateStudyPack } from './services/studyApi'

const DEMO_TEXT = `Photosynthesis converts light energy into chemical energy inside chloroplasts.
Plants use carbon dioxide, water, and sunlight to produce glucose and oxygen.

Key points:
- Chlorophyll absorbs light most strongly in the blue and red ranges.
- The light-dependent reactions happen in the thylakoid membranes.
- The Calvin cycle uses ATP and NADPH to build glucose.
- Limiting factors include light intensity, carbon dioxide concentration, and temperature.`

const INPUT_MODES = [
  { key: 'upload', label: 'Upload PDF or image' },
  { key: 'text', label: 'Paste text' },
]

const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Bengali', 'Tamil', 'Telugu']
const TIMER_DEFAULT_SECONDS = 25 * 60

const isAbortError = (error) => error?.name === 'AbortError'

export default function App() {
  const [inputMode, setInputMode] = useState('upload')
  const [selectedFile, setSelectedFile] = useState(null)
  const [manualText, setManualText] = useState('')
  const [requestStatus, setRequestStatus] = useState('idle')
  const [stageMessage, setStageMessage] = useState('Upload a source and generate a summary.')
  const [requestError, setRequestError] = useState('')
  const [title, setTitle] = useState('Study Summary')
  const [sourceText, setSourceText] = useState('')
  const [summary, setSummary] = useState('')
  const [audioScript, setAudioScript] = useState('')
  const [audioStatus, setAudioStatus] = useState('idle')
  const [audioError, setAudioError] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [audioTitle, setAudioTitle] = useState('AI audio summary')
  const [autoplayToken, setAutoplayToken] = useState(0)
  const [quizStatus, setQuizStatus] = useState('idle')
  const [quizError, setQuizError] = useState('')
  const [quizItems, setQuizItems] = useState([])
  const [showAnswers, setShowAnswers] = useState(false)
  const [language, setLanguage] = useState('English')
  const [timerRunning, setTimerRunning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(TIMER_DEFAULT_SECONDS)
  const [dimUi, setDimUi] = useState(false)

  const processControllerRef = useRef(null)
  const audioControllerRef = useRef(null)
  const quizControllerRef = useRef(null)
  const audioUrlRef = useRef('')

  const canGenerate = useMemo(() => {
    if (inputMode === 'upload') {
      return Boolean(selectedFile)
    }

    return Boolean(manualText.trim())
  }, [inputMode, manualText, selectedFile])

  const isBusy = requestStatus === 'processing' || audioStatus === 'generating'
  const canGenerateQuiz = requestStatus === 'success' && Boolean(sourceText.trim())

  const revokeAudioUrl = () => {
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = ''
    }

    setAudioUrl('')
  }

  const cancelProcessRequest = () => {
    processControllerRef.current?.abort()
    processControllerRef.current = null
  }

  const cancelAudioRequest = () => {
    audioControllerRef.current?.abort()
    audioControllerRef.current = null
  }

  const cancelQuizRequest = () => {
    quizControllerRef.current?.abort()
    quizControllerRef.current = null
  }

  const resetGeneratedContent = () => {
    revokeAudioUrl()
    setTitle('Study Summary')
    setSourceText('')
    setSummary('')
    setAudioScript('')
    setAudioTitle('AI audio summary')
    setRequestStatus('idle')
    setStageMessage('Upload a source and generate a summary.')
    setAudioStatus('idle')
    setAudioError('')
    setQuizStatus('idle')
    setQuizError('')
    setQuizItems([])
    setShowAnswers(false)
  }

  const requestAudio = async (scriptText, requestedLanguage) => {
    const normalizedScript = String(scriptText || '').trim()

    if (!normalizedScript) {
      setAudioStatus('error')
      setAudioError('No narration text is available yet. Generate the summary first.')
      return false
    }

    cancelAudioRequest()
    revokeAudioUrl()
    setAudioStatus('generating')
    setAudioError('')

    const controller = new AbortController()
    audioControllerRef.current = controller

    try {
      const audioBlob = await generateAudioBlob({
        text: normalizedScript,
        language: requestedLanguage,
        signal: controller.signal,
      })

      const nextAudioUrl = URL.createObjectURL(audioBlob)
      audioUrlRef.current = nextAudioUrl
      setAudioUrl(nextAudioUrl)
      setAudioStatus('ready')
      setAutoplayToken((current) => current + 1)
      return true
    } catch (error) {
      if (isAbortError(error)) {
        return false
      }

      setAudioStatus('error')
      setAudioError(error?.message || 'Audio generation failed.')
      return false
    } finally {
      if (audioControllerRef.current === controller) {
        audioControllerRef.current = null
      }
    }
  }

  const handleGenerate = async () => {
    if (!canGenerate) {
      setRequestError('Choose a file or paste text before generating.')
      return
    }

    cancelProcessRequest()
    cancelAudioRequest()
    cancelQuizRequest()
    resetGeneratedContent()

    setRequestStatus('processing')
    setRequestError('')
    setAudioError('')
    setAudioStatus('idle')
    setStageMessage(inputMode === 'upload' ? 'Reading your source with Gemini...' : 'Writing your study summary...')

    const controller = new AbortController()
    processControllerRef.current = controller

    try {
      const result = await generateStudyPack({
        text: inputMode === 'text' ? manualText : '',
        file: inputMode === 'upload' ? selectedFile : null,
        signal: controller.signal,
      })

      setTitle(result.title)
      setAudioTitle(result.title ? `${result.title} audio` : 'AI audio summary')
      setSourceText(result.sourceText)
      setSummary(result.summary)
      setAudioScript(result.audioScript)
      setRequestStatus('success')
      setStageMessage('Summary ready. Generating audio...')

      const audioReady = await requestAudio(result.audioScript, language)

      setStageMessage(
        audioReady
          ? 'Summary and audio are ready.'
          : 'Summary is ready. Audio can be retried from the top bar.',
      )
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      setRequestStatus('error')
      setRequestError(error?.message || 'Could not generate study output.')
      setStageMessage('We hit a problem while processing your study material.')
    } finally {
      if (processControllerRef.current === controller) {
        processControllerRef.current = null
      }
    }
  }

  const handleGenerateQuiz = async () => {
    if (!canGenerateQuiz) {
      setQuizStatus('error')
      setQuizError('Generate with AI first so the quiz uses the latest study content.')
      return
    }

    cancelQuizRequest()
    setQuizStatus('generating')
    setQuizError('')
    setQuizItems([])
    setShowAnswers(false)

    const controller = new AbortController()
    quizControllerRef.current = controller

    try {
      const result = await generateQuiz({
        text: sourceText,
        signal: controller.signal,
      })

      setQuizItems(result.questions)
      setQuizStatus('ready')
    } catch (error) {
      if (isAbortError(error)) {
        return
      }

      setQuizStatus('error')
      setQuizError(error?.message || 'Quiz generation failed.')
    } finally {
      if (quizControllerRef.current === controller) {
        quizControllerRef.current = null
      }
    }
  }

  const handleRetryAudio = async () => {
    const audioReady = await requestAudio(audioScript, language)

    if (audioReady) {
      setStageMessage('Audio is ready to play.')
    }
  }

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage)

    if (audioScript.trim()) {
      void requestAudio(audioScript, nextLanguage)
    }
  }

  useEffect(() => {
    if (!timerRunning) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          window.clearInterval(intervalId)
          setTimerRunning(false)
          return 0
        }

        return current - 1
      })
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [timerRunning])

  useEffect(() => {
    return () => {
      cancelProcessRequest()
      cancelAudioRequest()
      cancelQuizRequest()
      revokeAudioUrl()
    }
  }, [])

  return (
    <div className={`app-shell ${dimUi ? 'app-shell--dimmed' : ''}`}>
      <div className="app-background" />

      <div className="app-container">
        <header className="panel topbar">
          <div className="topbar__brand">
            <div className="brand-mark">
              <Sparkles size={18} />
            </div>

            <div>
              <p className="eyebrow">Study FM</p>
              <h1>Upload, generate, and listen without the clutter.</h1>
              <p className="topbar__copy">
                One clean workflow for PDFs, images, and pasted notes. Summary and audio stay in sync across desktop and mobile.
              </p>
            </div>
          </div>

          <div className="topbar__player">
            <AudioPlayer
              audioUrl={audioUrl}
              title={audioTitle}
              language={language}
              languageOptions={LANGUAGE_OPTIONS}
              onLanguageChange={handleLanguageChange}
              audioStatus={audioStatus}
              audioError={audioError}
              onRetry={handleRetryAudio}
              autoplayToken={autoplayToken}
            />
          </div>

          <div className="topbar__timer">
            <StudyTimer
              secondsRemaining={secondsRemaining}
              isRunning={timerRunning}
              isDimmed={dimUi}
              onToggleRunning={() => setTimerRunning((current) => !current)}
              onReset={() => {
                setTimerRunning(false)
                setSecondsRemaining(TIMER_DEFAULT_SECONDS)
              }}
              onToggleDim={() => setDimUi((current) => !current)}
            />
          </div>
        </header>

        <main className="workspace">
          <section className="panel source-panel">
            <div className="source-panel__header">
              <div>
                <p className="eyebrow">Source Material</p>
                <h2>Upload a file or paste your notes</h2>
                <p className="section-copy">
                  Study FM now uses Gemini inline file processing for PDFs and images, with one-button summary and audio generation.
                </p>
              </div>

              <div className="action-stack">
                <button type="button" className="primary-btn" disabled={!canGenerate || isBusy} onClick={handleGenerate}>
                  <WandSparkles size={16} />
                  <span>{isBusy ? 'Working...' : 'Generate with AI'}</span>
                </button>

                <button
                  type="button"
                  className="secondary-btn"
                  disabled={!canGenerateQuiz || isBusy || quizStatus === 'generating'}
                  onClick={handleGenerateQuiz}
                >
                  <ListChecks size={16} />
                  <span>{quizStatus === 'generating' ? 'Generating quiz...' : 'Generate Quiz'}</span>
                </button>
              </div>
            </div>

            <div className="input-mode-list" role="tablist" aria-label="Choose study source type">
              {INPUT_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  className={`mode-chip ${inputMode === mode.key ? 'mode-chip--active' : ''}`}
                  onClick={() => {
                    cancelProcessRequest()
                    cancelAudioRequest()
                    cancelQuizRequest()
                    resetGeneratedContent()
                    setInputMode(mode.key)
                    setRequestError('')
                  }}
                >
                  {mode.label}
                </button>
              ))}
            </div>

            {inputMode === 'upload' ? (
              <UploadZone
                selectedFile={selectedFile}
                disabled={isBusy}
                onFileSelect={(file) => {
                  cancelProcessRequest()
                  cancelAudioRequest()
                  cancelQuizRequest()
                  resetGeneratedContent()
                  setSelectedFile(file)
                  setRequestError('')
                }}
                onClear={() => {
                  cancelProcessRequest()
                  cancelAudioRequest()
                  cancelQuizRequest()
                  resetGeneratedContent()
                  setSelectedFile(null)
                }}
              />
            ) : (
              <div className="text-entry-card">
                <textarea
                  value={manualText}
                  onChange={(event) => {
                    cancelProcessRequest()
                    cancelAudioRequest()
                    cancelQuizRequest()
                    resetGeneratedContent()
                    setManualText(event.target.value)
                    setRequestError('')
                  }}
                  className="textarea-field"
                  placeholder="Paste your study material here. Study FM will summarize it and prepare an audio version automatically."
                />

                <div className="text-entry-card__footer">
                  <span className="helper-copy">{manualText.trim().length} characters</span>

                  <button
                    type="button"
                    className="secondary-btn"
                    onClick={() => {
                      setInputMode('text')
                      cancelProcessRequest()
                      cancelAudioRequest()
                      cancelQuizRequest()
                      resetGeneratedContent()
                      setManualText(DEMO_TEXT)
                      setSelectedFile(null)
                      setRequestError('')
                    }}
                  >
                    <FileText size={16} />
                    <span>Load demo text</span>
                  </button>
                </div>
              </div>
            )}

            {requestError ? <div className="message message--error">{requestError}</div> : null}

            <div className="helper-card">
              <p className="helper-card__title">Current flow</p>
              <p className="helper-card__copy">Upload or paste content, press Generate with AI, listen from the top bar, then optionally generate a five-question quiz.</p>
            </div>
          </section>

          <AIOutput
            status={requestStatus}
            stageMessage={stageMessage}
            title={title}
            sourceText={sourceText}
            summary={summary}
            audioStatus={audioStatus}
            audioError={audioError}
            onRetryAudio={handleRetryAudio}
            quizStatus={quizStatus}
            quizError={quizError}
            quizItems={quizItems}
            showAnswers={showAnswers}
            onToggleAnswers={() => setShowAnswers((current) => !current)}
          />
        </main>
      </div>
    </div>
  )
}
