import { CheckCircle2, Eye, EyeOff, GraduationCap, LoaderCircle } from 'lucide-react'

export default function QuizSection({
  quizStatus,
  quizError,
  quizItems,
  onToggleAnswers,
  showAnswers,
}) {
  const hasQuestions = quizItems.length > 0

  return (
    <div className="output-section quiz-section">
      <div className="output-section__header output-section__header--spread">
        <div className="output-section__title-wrap">
          <GraduationCap size={16} />
          <h3>Quiz</h3>
        </div>

        {hasQuestions ? (
          <button type="button" className="secondary-btn secondary-btn--compact" onClick={onToggleAnswers}>
            {showAnswers ? <EyeOff size={14} /> : <Eye size={14} />}
            <span>{showAnswers ? 'Hide answers' : 'Show answers'}</span>
          </button>
        ) : null}
      </div>

      {quizStatus === 'generating' ? (
        <div className="loading-block loading-block--compact">
          <div className="loading-block__header">
            <LoaderCircle className="spin" size={18} />
            <span>Generating 5 MCQs</span>
          </div>
          <div className="loading-lines">
            <span />
            <span />
            <span />
          </div>
        </div>
      ) : null}

      {quizError ? <div className="message message--error">{quizError}</div> : null}

      {!hasQuestions && quizStatus === 'idle' ? (
        <div className="helper-card helper-card--compact">
          <p className="helper-card__copy">Generate Quiz after the summary is ready to turn the source into five quick MCQs.</p>
        </div>
      ) : null}

      {hasQuestions ? (
        <div className="quiz-list">
          {quizItems.map((item, index) => (
            <article key={`${index + 1}-${item.question}`} className="quiz-card">
              <div className="quiz-card__header">
                <span className="quiz-card__number">Q{index + 1}</span>
                <h4>{item.question}</h4>
              </div>

              <div className="quiz-options">
                {item.options.map((option) => {
                  const isCorrect = option.label === item.correctAnswer

                  return (
                    <div
                      key={`${item.question}-${option.label}`}
                      className={`quiz-option-row ${showAnswers && isCorrect ? 'quiz-option-row--correct' : ''}`}
                    >
                      <span className="quiz-option-row__label">{option.label}</span>
                      <span className="quiz-option-row__text">{option.text}</span>
                      {showAnswers && isCorrect ? <CheckCircle2 size={16} className="quiz-option-row__icon" /> : null}
                    </div>
                  )
                })}
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  )
}
