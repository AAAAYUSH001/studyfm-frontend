import { FileAudio, FileText, LoaderCircle, RotateCcw, Sparkles } from 'lucide-react'
import QuizSection from './QuizSection'

export default function AIOutput({
  status,
  stageMessage,
  title,
  sourceText,
  summary,
  audioStatus,
  audioError,
  onRetryAudio,
  quizStatus,
  quizError,
  quizItems,
  showAnswers,
  onToggleAnswers,
}) {
  const isWorking = status === 'processing'
  const hasResult = Boolean(summary)

  return (
    <section className="panel output-panel">
      <div className="output-panel__header">
        <div>
          <p className="eyebrow">AI Output</p>
          <h2>{hasResult ? title : 'Your summary will appear here'}</h2>
        </div>

        <div className="status-list">
          <span className={`status-pill ${status === 'success' ? 'status-pill--success' : ''}`}>
            {status === 'idle' ? 'Waiting' : status === 'processing' ? 'Processing' : status === 'success' ? 'Ready' : 'Attention needed'}
          </span>
          <span className={`status-pill ${audioStatus === 'ready' ? 'status-pill--success' : ''}`}>
            {audioStatus === 'idle'
              ? 'Audio idle'
              : audioStatus === 'generating'
                ? 'Audio generating'
                : audioStatus === 'ready'
                  ? 'Audio ready'
                  : 'Audio issue'}
          </span>
        </div>
      </div>

      <p className="section-copy">{stageMessage}</p>

      {isWorking ? (
        <div className="loading-block">
          <div className="loading-block__header">
            <LoaderCircle className="spin" size={18} />
            <span>Generating your study pack</span>
          </div>
          <div className="loading-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      {!isWorking && !hasResult && status !== 'error' ? (
        <div className="empty-state">
          <Sparkles size={22} />
          <p>Upload a PDF or image, or paste raw text, then press Generate with AI to create the summary and audio.</p>
        </div>
      ) : null}

      {hasResult ? (
        <div className="output-sections">
          <div className="output-section">
            <div className="output-section__header">
              <Sparkles size={16} />
              <h3>Summary</h3>
            </div>
            <div className="prose-block">{summary}</div>
          </div>

          <div className="output-section">
            <div className="output-section__header">
              <FileText size={16} />
              <h3>Processed source preview</h3>
            </div>
            <div className="source-preview">{sourceText}</div>
          </div>

          <QuizSection
            quizStatus={quizStatus}
            quizError={quizError}
            quizItems={quizItems}
            showAnswers={showAnswers}
            onToggleAnswers={onToggleAnswers}
          />
        </div>
      ) : null}

      {audioError ? (
        <div className="message message--error message--with-action">
          <div className="message__body">
            <FileAudio size={16} />
            <span>{audioError}</span>
          </div>
          <button type="button" className="secondary-btn secondary-btn--compact" onClick={onRetryAudio}>
            <RotateCcw size={14} />
            <span>Retry audio</span>
          </button>
        </div>
      ) : null}
    </section>
  )
}
