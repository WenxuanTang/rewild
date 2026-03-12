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
}

export interface ErrorLogEntry {
  requestId: string
  timestamp: string
  event: 'observation_error'
  error: string
  durationMs: number
}

/* ── Helpers ────────────────────────────────────────────── */

function emit(entry: ObservationLogEntry | ErrorLogEntry): void {
  // JSON-lines format: one line per event, easy to grep / ingest
  console.log(JSON.stringify(entry))
}

export function logObservation(entry: ObservationLogEntry): void {
  emit(entry)
}

export function logError(entry: ErrorLogEntry): void {
  console.error(JSON.stringify(entry))
}
