const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

const SUPPORTED_UPLOADS = {
  'application/pdf': {
    label: 'PDF',
    maxBytes: 50 * 1024 * 1024,
  },
  'image/jpeg': {
    label: 'JPG image',
    maxBytes: 20 * 1024 * 1024,
  },
  'image/png': {
    label: 'PNG image',
    maxBytes: 20 * 1024 * 1024,
  },
}

const FALLBACK_ERROR = 'Something went wrong while contacting the Study FM backend.'

const buildApiUrl = (path) => (API_BASE ? `${API_BASE}${path}` : path)

const normalizeText = (value) => String(value || '').trim()

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => {
      const raw = String(reader.result || '')
      const [, base64Value = ''] = raw.split(',')
      resolve(base64Value)
    }

    reader.onerror = () => reject(new Error(`Could not read ${file?.name || 'the selected file'}.`))
    reader.readAsDataURL(file)
  })

const parseJsonSafely = async (response) => {
  const rawText = await response.text()

  if (!rawText) {
    return {}
  }

  try {
    return JSON.parse(rawText)
  } catch {
    return { error: normalizeText(rawText) }
  }
}

export const validateSelectedFile = (file) => {
  if (!file) {
    throw new Error('Choose a PDF, JPG, or PNG file first.')
  }

  const definition = SUPPORTED_UPLOADS[file.type]

  if (!definition) {
    throw new Error('Only PDF, JPG, and PNG files are supported.')
  }

  if (file.size > definition.maxBytes) {
    const sizeLimitInMb = Math.round(definition.maxBytes / (1024 * 1024))
    throw new Error(`${definition.label} files must be ${sizeLimitInMb}MB or smaller.`)
  }
}

export const formatFileSize = (bytes) => {
  const safeBytes = Number(bytes) || 0

  if (safeBytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(safeBytes / 1024))} KB`
  }

  return `${(safeBytes / (1024 * 1024)).toFixed(1)} MB`
}

export const generateStudyPack = async ({ text, file, signal }) => {
  const payload = {}

  if (file) {
    validateSelectedFile(file)

    payload.fileName = file.name
    payload.mimeType = file.type
    payload.fileBase64 = await fileToBase64(file)
  } else {
    const normalizedInput = normalizeText(text)

    if (!normalizedInput) {
      throw new Error('Paste some study text before generating.')
    }

    payload.text = normalizedInput
  }

  const response = await fetch(buildApiUrl('/api/study/process'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  const data = await parseJsonSafely(response)

  if (!response.ok) {
    throw new Error(normalizeText(data?.error) || FALLBACK_ERROR)
  }

  return {
    title: normalizeText(data?.title) || 'Study Summary',
    sourceText: normalizeText(data?.sourceText),
    summary: normalizeText(data?.summary),
    audioScript: normalizeText(data?.audioScript),
  }
}

export const generateAudioBlob = async ({ text, language, signal }) => {
  const response = await fetch(buildApiUrl('/api/tts/generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, language }),
    signal,
  })

  if (!response.ok) {
    const data = await parseJsonSafely(response)
    throw new Error(normalizeText(data?.error) || 'Audio generation failed.')
  }

  const audioBlob = await response.blob()

  if (!audioBlob.size || !audioBlob.type.startsWith('audio/')) {
    throw new Error('Audio generation returned an unexpected response.')
  }

  return audioBlob
}

export const generateQuiz = async ({ text, signal }) => {
  const normalizedInput = normalizeText(text)

  if (!normalizedInput) {
    throw new Error('Generate with AI first so the quiz has source material to use.')
  }

  const response = await fetch(buildApiUrl('/api/generate-quiz'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: normalizedInput }),
    signal,
  })

  const data = await parseJsonSafely(response)

  if (!response.ok) {
    throw new Error(normalizeText(data?.error) || 'Quiz generation failed.')
  }

  return {
    questions: Array.isArray(data?.questions) ? data.questions : [],
  }
}
