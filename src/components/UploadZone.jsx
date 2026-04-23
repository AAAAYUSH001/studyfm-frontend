import { useRef, useState } from 'react'
import { FileImage, FileText, UploadCloud, X } from 'lucide-react'
import { formatFileSize, validateSelectedFile } from '../services/studyApi'

const UPLOAD_HINTS = ['PDF', 'JPG', 'PNG']

export default function UploadZone({ selectedFile, disabled, onFileSelect, onClear }) {
  const inputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  const handleFile = (file) => {
    if (!file) {
      return
    }

    try {
      validateSelectedFile(file)
      setErrorMessage('')
      onFileSelect?.(file)
    } catch (error) {
      setErrorMessage(error?.message || 'This file type is not supported.')
    }
  }

  return (
    <div className={`upload-zone ${isDragging ? 'upload-zone--dragging' : ''} ${disabled ? 'upload-zone--disabled' : ''}`}>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png"
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFile(event.target.files?.[0])}
      />

      <div
        role="presentation"
        className="upload-zone__trigger"
        onClick={() => {
          if (!disabled) {
            inputRef.current?.click()
          }
        }}
        onDragOver={(event) => {
          event.preventDefault()
          if (!disabled) {
            setIsDragging(true)
          }
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          if (!disabled) {
            handleFile(event.dataTransfer.files?.[0])
          }
        }}
      >
        {!selectedFile ? (
          <>
            <div className="upload-zone__icon">
              <UploadCloud size={26} />
            </div>

            <h3>Drop a PDF or image here</h3>
            <p>
              Study FM converts the file to Base64, sends it to Gemini with inline file data, and turns the result into a clean summary plus audio.
            </p>

            <div className="pill-list">
              {UPLOAD_HINTS.map((hint) => (
                <span key={hint} className="pill">
                  {hint}
                </span>
              ))}
            </div>
          </>
        ) : (
          <div className="upload-file-card">
            <div className="upload-file-card__icon">
              {selectedFile.type === 'application/pdf' ? <FileText size={20} /> : <FileImage size={20} />}
            </div>

            <div className="upload-file-card__body">
              <strong>{selectedFile.name}</strong>
              <span>
                {selectedFile.type === 'application/pdf' ? 'PDF document' : 'Image file'} | {formatFileSize(selectedFile.size)}
              </span>
            </div>

            <button
              type="button"
              className="icon-chip icon-chip--danger"
              onClick={(event) => {
                event.stopPropagation()
                setErrorMessage('')
                onClear?.()
              }}
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </div>
        )}
      </div>

      {errorMessage ? <div className="message message--error">{errorMessage}</div> : null}
    </div>
  )
}
