import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Rewild — Observe Nature with an AI Naturalist',
  description:
    'Upload a photo of a plant or tree and let your AI field guide help you see what you might have missed.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-earth-50 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  )
}
