/**
 * OpenAI integration for the AI Naturalist explanation.
 *
 * When PlantNet results are present  → text-only prompt (cheaper, faster)
 * When no PlantNet results            → vision prompt (model looks at the images)
 */

import OpenAI from 'openai'
import type { PlantNetCandidate } from './plantnet'

export interface NaturalistResponse {
  identification_reasoning: string   // Why this species — observable features
  guided_observations: string[]      // 2–4 questions to guide the user's attention
  ecological_context: string         // Ecology, habitat, natural history
}

const SYSTEM_PROMPT = `\
You are a knowledgeable, calm field naturalist guiding someone on a nature walk.
Your role is NOT to simply name a species — it is to help the observer look more carefully at the world around them.
Explain identifications through visible, touchable, sensory features.
Ask questions that invite closer attention.
Speak warmly and directly, as if you are standing beside the person right now.
Never be condescending. Embrace uncertainty — nature is complex.`

export async function generateNaturalistResponse(
  candidates: PlantNetCandidate[],
  imageBase64s: string[],
  location?: string,
  notes?: string,
): Promise<NaturalistResponse> {
  const client = new OpenAI()

  // Build context block
  const candidatesText =
    candidates.length > 0
      ? candidates
          .map((c) => {
            const pct = (c.score * 100).toFixed(0)
            const common = c.commonName ? ` (${c.commonName})` : ''
            return `• ${c.scientificName}${common} — ${pct}% confidence`
          })
          .join('\n')
      : 'No plant identification results — please analyse the uploaded images directly.'

  const contextLines = [
    location ? `Location: ${location}` : null,
    notes   ? `Observer notes: ${notes}` : null,
  ].filter(Boolean)
  const contextText = contextLines.length > 0 ? `\n${contextLines.join('\n')}` : ''

  const userTextPrompt = `\
Plant identification candidates from image analysis:
${candidatesText}${contextText}

Respond with a JSON object containing exactly these three fields:
{
  "identification_reasoning": "2–3 sentences explaining which observable features (leaf shape, bark texture, branching pattern, habitat cues, etc.) support this identification. Be specific.",
  "guided_observations": [
    "A specific question or prompt that directs the observer to look at one feature closely",
    "Another observation prompt",
    "Another observation prompt"
  ],
  "ecological_context": "2–3 sentences about this species' ecology, habitat preferences, relationship with other organisms, or interesting natural history."
}

Write as if you are speaking directly to the observer. Be specific, curious, and encouraging.`

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ]

  // If no PlantNet results, add the images so GPT-4o can see the plant
  if (candidates.length === 0 && imageBase64s.length > 0) {
    const imageContent: OpenAI.ChatCompletionContentPart[] = [
      ...imageBase64s.slice(0, 4).map<OpenAI.ChatCompletionContentPart>((b64) => ({
        type: 'image_url',
        image_url: { url: `data:image/jpeg;base64,${b64}`, detail: 'high' },
      })),
      { type: 'text', text: userTextPrompt },
    ]
    messages.push({ role: 'user', content: imageContent })
  } else {
    messages.push({ role: 'user', content: userTextPrompt })
  }

  const completion = await client.chat.completions.create({
    model: candidates.length === 0 ? 'gpt-4o' : 'gpt-4o-mini',
    messages,
    response_format: { type: 'json_object' },
    max_tokens: 900,
    temperature: 0.7,
  })

  const raw = completion.choices[0]?.message?.content ?? '{}'
  return JSON.parse(raw) as NaturalistResponse
}
