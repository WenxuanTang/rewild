'use client'

import { useState, useCallback, useRef, DragEvent } from 'react'
import Link from 'next/link'

/* ─── Types ─────────────────────────────────────────────── */

type PageState = 'upload' | 'analyzing' | 'results'

interface SpeciesCandidate {
  name: string
  scientificName: string
  commonName: string
  family: string
  confidence: number
}

interface NaturalistExplanation {
  identification_reasoning: string
  guided_observations: string[]
  ecological_context: string
}

interface AnalysisResult {
  species_candidates: SpeciesCandidate[]
  naturalist_explanation: NaturalistExplanation
  identified_by_vision: boolean
}

/* ─── Page Component ─────────────────────────────────────── */

export default function ObservePage() {
  const [pageState, setPageState] = useState<PageState>('upload')
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [location, setLocation] = useState('')
  const [notes, setNotes] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  /* ─── Image handling ───────────────────────────────────── */

  const addImages = useCallback(
    (files: FileList | File[]) => {
      const incoming = Array.from(files)
        .filter((f) => f.type.startsWith('image/'))
        .slice(0, 4 - images.length)

      if (incoming.length === 0) return

      setImages((prev) => [...prev, ...incoming].slice(0, 4))

      incoming.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews((prev) => [...prev, e.target?.result as string].slice(0, 4))
        }
        reader.readAsDataURL(file)
      })
    },
    [images.length],
  )

  const removeImage = (idx: number) => {
    setImages((prev) => prev.filter((_, i) => i !== idx))
    setPreviews((prev) => prev.filter((_, i) => i !== idx))
  }

  /* ─── Drag-and-drop ────────────────────────────────────── */

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }
  const onDragLeave = () => setIsDragging(false)
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    addImages(e.dataTransfer.files)
  }

  /* ─── Submit ────────────────────────────────────────────── */

  const handleSubmit = async () => {
    if (images.length === 0) return

    setPageState('analyzing')
    setError(null)

    const formData = new FormData()
    images.forEach((img) => formData.append('images', img))
    if (location.trim()) formData.append('location', location.trim())
    if (notes.trim()) formData.append('notes', notes.trim())

    try {
      const res = await fetch('/api/observe', { method: 'POST', body: formData })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error ?? 'Analysis failed')

      setResult(data)
      setPageState('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPageState('upload')
    }
  }

  const resetObservation = () => {
    setPageState('upload')
    setImages([])
    setPreviews([])
    setLocation('')
    setNotes('')
    setResult(null)
    setError(null)
  }

  /* ─── Render ─────────────────────────────────────────────── */

  if (pageState === 'analyzing') return <AnalyzingScreen />
  if (pageState === 'results' && result) {
    return (
      <ResultsScreen
        result={result}
        previews={previews}
        location={location}
        onReset={resetObservation}
      />
    )
  }

  return (
    <div className="min-h-screen py-12 px-6">
      <div className="max-w-xl mx-auto">

        {/* Back */}
        <Link href="/" className="text-sm text-stone-400 hover:text-stone-600 mb-8 inline-block">
          ← Back
        </Link>

        <h1 className="font-serif text-3xl text-forest-900 mb-1">New Observation</h1>
        <p className="text-sm text-stone-500 mb-8">
          Upload 1–4 photos of your plant or tree.
        </p>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ── Upload zone ── */}
        <section className="mb-6">
          {images.length < 4 && (
            <div
              className={`border-2 border-dashed rounded transition-colors cursor-pointer ${
                isDragging
                  ? 'border-forest-500 bg-forest-50'
                  : 'border-stone-300 hover:border-forest-500 bg-white'
              } p-8 text-center`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="text-2xl mb-2">🌿</div>
              <p className="text-sm text-stone-600 mb-1">
                Drop photos here or <span className="text-forest-700 underline">browse</span>
              </p>
              <p className="text-xs text-stone-400">
                Leaves, bark, whole plant, surroundings — up to {4 - images.length} more
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => e.target.files && addImages(e.target.files)}
              />
            </div>
          )}

          {/* Previews */}
          {previews.length > 0 && (
            <div className={`grid grid-cols-4 gap-2 ${images.length < 4 ? 'mt-3' : ''}`}>
              {previews.map((src, i) => (
                <div key={i} className="relative aspect-square">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`upload ${i + 1}`}
                    className="w-full h-full object-cover rounded"
                  />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white text-xs rounded-full flex items-center justify-center hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
              {images.length < 4 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="aspect-square border-2 border-dashed border-stone-200 rounded flex items-center justify-center text-stone-400 hover:border-forest-400 hover:text-forest-600 text-xl transition-colors"
                  aria-label="Add more images"
                >
                  +
                </button>
              )}
            </div>
          )}
        </section>

        {/* ── Location ── */}
        <section className="mb-4">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Location <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Rock Creek Park, Washington DC"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-forest-500 bg-white"
          />
        </section>

        {/* ── Notes ── */}
        <section className="mb-8">
          <label className="block text-sm font-medium text-stone-700 mb-1">
            Notes <span className="text-stone-400 font-normal">(optional)</span>
          </label>
          <textarea
            placeholder="Anything you noticed — smell, texture, nearby plants, time of year…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full border border-stone-200 rounded px-3 py-2 text-sm text-stone-800 placeholder-stone-300 focus:outline-none focus:ring-1 focus:ring-forest-500 bg-white resize-none"
          />
        </section>

        <button
          onClick={handleSubmit}
          disabled={images.length === 0}
          className="w-full bg-forest-700 hover:bg-forest-900 text-white text-sm font-medium py-3 rounded transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Analyse Observation
        </button>

        <p className="text-center text-xs text-stone-400 mt-4">
          Photos are sent to PlantNet and OpenAI for analysis and are not stored.
        </p>
      </div>
    </div>
  )
}

/* ─── Loading Screen ─────────────────────────────────────── */

function AnalyzingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <div className="animate-spin w-10 h-10 border-2 border-forest-200 border-t-forest-700 rounded-full mb-6" />
      <h2 className="font-serif text-2xl text-forest-900 mb-2">Reading the plant…</h2>
      <p className="text-sm text-stone-500 max-w-xs">
        Your field guide is looking at the images and preparing observations. This takes about 10–20 seconds.
      </p>
    </div>
  )
}

/* ─── Results Screen ─────────────────────────────────────── */

interface ResultsProps {
  result: AnalysisResult
  previews: string[]
  location: string
  onReset: () => void
}

function ResultsScreen({ result, previews, location, onReset }: ResultsProps) {
  const top = result.species_candidates[0]
  const others = result.species_candidates.slice(1)
  const exp = result.naturalist_explanation

  return (
    <div className="min-h-screen py-12 px-6 animate-fade-in">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs text-stone-400 uppercase tracking-widest mb-1">Observation</p>
            {location && <p className="text-xs text-stone-500">{location}</p>}
          </div>
          <button
            onClick={onReset}
            className="text-sm text-forest-700 hover:text-forest-900 border border-forest-200 hover:border-forest-400 px-3 py-1.5 rounded transition-colors"
          >
            New Observation
          </button>
        </div>

        {/* Photos row */}
        {previews.length > 0 && (
          <div className="flex gap-2 mb-8">
            {previews.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={src}
                alt={`observation ${i + 1}`}
                className="h-20 w-20 object-cover rounded"
              />
            ))}
          </div>
        )}

        {/* ── Species Hypothesis ── */}
        <section className="mb-8">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">
            Species Hypothesis
            {result.identified_by_vision && (
              <span className="ml-2 normal-case text-earth-500">· via AI vision</span>
            )}
          </p>

          {top ? (
            <>
              {/* Top candidate */}
              <div className="bg-white border border-stone-200 rounded p-4 mb-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-serif text-lg text-forest-900 leading-tight">
                      {top.commonName || top.scientificName}
                    </p>
                    {top.commonName && (
                      <p className="text-xs text-stone-400 italic mt-0.5">{top.scientificName}</p>
                    )}
                    {top.family && (
                      <p className="text-xs text-stone-400 mt-0.5">Family: {top.family}</p>
                    )}
                  </div>
                  <ConfidenceBadge value={top.confidence} />
                </div>
                {/* Confidence bar */}
                <div className="mt-3 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest-500 rounded-full transition-all"
                    style={{ width: `${Math.round(top.confidence * 100)}%` }}
                  />
                </div>
              </div>

              {/* Alternatives */}
              {others.length > 0 && (
                <div className="space-y-2">
                  {others.map((c, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between bg-white/60 border border-stone-100 rounded px-3 py-2"
                    >
                      <div>
                        <span className="text-sm text-stone-700">{c.commonName || c.scientificName}</span>
                        {c.commonName && (
                          <span className="text-xs text-stone-400 italic ml-1.5">{c.scientificName}</span>
                        )}
                      </div>
                      <span className="text-xs text-stone-400">{Math.round(c.confidence * 100)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-stone-500 italic">
              No species database match — identification based on AI vision.
            </p>
          )}
        </section>

        <div className="border-t border-stone-200 mb-8" />

        {/* ── Identification Reasoning ── */}
        <section className="mb-8">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">What I see</p>
          <p className="text-stone-700 leading-relaxed text-sm">{exp.identification_reasoning}</p>
        </section>

        {/* ── Guided Observations ── */}
        <section className="mb-8">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">Look closely…</p>
          <ul className="space-y-3">
            {exp.guided_observations?.map((prompt, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-forest-100 text-forest-700 text-xs flex-shrink-0 flex items-center justify-center font-medium">
                  {i + 1}
                </span>
                <p className="text-stone-700 text-sm leading-relaxed">{prompt}</p>
              </li>
            ))}
          </ul>
        </section>

        <div className="border-t border-stone-200 mb-8" />

        {/* ── Ecological Context ── */}
        <section className="mb-12">
          <p className="text-xs text-stone-400 uppercase tracking-widest mb-3">In the wider world</p>
          <p className="text-stone-600 leading-relaxed text-sm italic">{exp.ecological_context}</p>
        </section>

        <button
          onClick={onReset}
          className="w-full border border-forest-200 text-forest-700 hover:bg-forest-50 text-sm font-medium py-3 rounded transition-colors"
        >
          Start New Observation
        </button>
      </div>
    </div>
  )
}

/* ─── Confidence Badge ───────────────────────────────────── */

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const color =
    pct >= 70 ? 'bg-forest-100 text-forest-800' :
    pct >= 40 ? 'bg-earth-100 text-earth-700' :
                'bg-stone-100 text-stone-600'
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${color}`}>
      {pct}%
    </span>
  )
}
