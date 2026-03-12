/**
 * Structured logger for observation requests.
 * Outputs JSON lines — readable in Vercel dashboard, pipeable to any log sink.
 */

import { randomUUID } from 'crypto'

export function newRequestId(): string {
  return randomUUID()
}

/* ── Log shapes ─────────────────────────────────────────── */

export interface UserInputLog {
  imageCount: number
  totalSizeKb: number
  location: string | null
  hasNotes: boolean
}

export interface LLMInputLog {
  model: string
  speciesCandidatesCount: number
  usedVision: boolean           // true when PlantNet returned nothing
  promptChars: number
}

export interface LLMOutputLog {
  identificationReasoningChars: number
  guidedObservationsCount: number
  ecologicalContextChars: number
}

export interface ObservationLogEntry {
  requestId: string
  timestamp: string             // ISO 8601
  event: 'observation_complete'
  durationMs: number
  userInput: UserInputLog
  llmInput: LLMInputLog
  llmOutput: LLMOutputLog
  blobUrls: string[]            // empty if BLOB_READ_WRITE_TOKEN not set
}

export interface FeedbackLogEntry {
  requestId: string
  timestamp: string
  event: 'user_feedback'
  rating: 'helpful' | 'not_helpful'
  blobsDeleted: boolean         // true = images deleted (helpful), false = kept (not helpful)
}

export interface ErrorLogEntry {
  requestId: string
  timestamp: string
  event: 'observation_error'
  error: string
  durationMs: number
}

/* ── Helpers ────────────────────────────────────────────── */

type LogEntry = ObservationLogEntry | FeedbackLogEntry | ErrorLogEntry

function emit(entry: LogEntry): void {
  // JSON-lines format: one line per event, easy to grep / ingest
  console.log(JSON.stringify(entry))
}

export function logObservation(entry: ObservationLogEntry): void {
  emit(entry)
}

export function logFeedback(entry: FeedbackLogEntry): void {
  emit(entry)
}

export function logError(entry: ErrorLogEntry): void {
  console.error(JSON.stringify(entry))
}
