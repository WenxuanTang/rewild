import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-xl w-full text-center">

          {/* Leaf icon */}
          <div className="mb-8 flex justify-center">
            <div className="w-14 h-14 rounded-full bg-forest-700 flex items-center justify-center">
              <svg
                viewBox="0 0 24 24"
                className="w-7 h-7 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 22C6.5 22 2 17.5 2 12c0-5.5 4.5-10 10-10 5.5 0 10 4.5 10 10" />
                <path d="M12 22c3-3 4-7 3-11" />
                <path d="M12 22c-3-3-4-7-3-11" />
                <path d="M12 2c0 5 2 9 5 12" />
                <path d="M12 2c0 5-2 9-5 12" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-5xl text-forest-900 mb-3 tracking-tight">
            Rewild
          </h1>
          <p className="text-lg text-stone-600 mb-3">
            Observe Nature with an AI Naturalist
          </p>
          <p className="text-stone-500 leading-relaxed mb-10 max-w-sm mx-auto text-sm">
            Technology should not replace observation — it should deepen it.
            Upload a photo and let your field guide help you notice what&apos;s really there.
          </p>

          <Link
            href="/observe"
            className="inline-block bg-forest-700 hover:bg-forest-900 text-white text-sm font-medium px-8 py-3 rounded transition-colors duration-150"
          >
            Start Observation
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="border-t border-stone-200 bg-white/60 px-6 py-12">
        <div className="max-w-2xl mx-auto grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-2xl mb-2">📷</div>
            <div className="text-sm font-medium text-stone-800 mb-1">Upload Photos</div>
            <div className="text-xs text-stone-500 leading-relaxed">
              1–4 photos: leaves, bark, whole plant, surroundings
            </div>
          </div>
          <div>
            <div className="text-2xl mb-2">🔍</div>
            <div className="text-sm font-medium text-stone-800 mb-1">Species Hypothesis</div>
            <div className="text-xs text-stone-500 leading-relaxed">
              AI identifies the most likely species with confidence
            </div>
          </div>
          <div>
            <div className="text-2xl mb-2">🌿</div>
            <div className="text-sm font-medium text-stone-800 mb-1">Guided Observation</div>
            <div className="text-xs text-stone-500 leading-relaxed">
              Your naturalist explains what to look for and why
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
