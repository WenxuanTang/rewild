/**
 * PlantNet API integration
 * Free API: https://my.plantnet.org/
 * Without an API key this module returns [] — the app falls back to OpenAI vision.
 */

export interface PlantNetCandidate {
  score: number
  scientificName: string
  commonName: string
  family: string
}

interface PlantNetResponse {
  results: Array<{
    score: number
    species: {
      scientificNameWithoutAuthor: string
      commonNames: string[]
      family: { scientificNameWithoutAuthor: string }
    }
  }>
}

export async function identifyWithPlantNet(
  imageBuffers: Buffer[],
): Promise<PlantNetCandidate[]> {
  const apiKey = process.env.PLANTNET_API_KEY
  if (!apiKey) return []

  const formData = new FormData()
  for (let i = 0; i < imageBuffers.length; i++) {
    const blob = new Blob([new Uint8Array(imageBuffers[i])], { type: 'image/jpeg' })
    formData.append('images', blob, `image${i}.jpg`)
    formData.append('organs', 'auto') // Let PlantNet decide the organ type
  }

  let response: Response
  try {
    response = await fetch(
      `https://my-api.plantnet.org/v2/identify/all?api-key=${apiKey}&lang=en&nb-results=3`,
      { method: 'POST', body: formData },
    )
  } catch (err) {
    console.error('[PlantNet] Network error:', err)
    return []
  }

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    console.error(`[PlantNet] API error ${response.status}:`, text)
    return []
  }

  const data: PlantNetResponse = await response.json()
  return data.results.slice(0, 3).map((r) => ({
    score: r.score,
    scientificName: r.species.scientificNameWithoutAuthor,
    commonName: r.species.commonNames[0] ?? '',
    family: r.species.family.scientificNameWithoutAuthor,
  }))
}
