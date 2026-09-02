export type AiProvider = {
  name: string
  keyEnv: string
  baseUrl: string
  model: string
  apiKey?: string
}

export type AiMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export type AiCompletionResult = {
  content: string
  provider: string
  model: string
  usage?: unknown
}

export type AiSource = {
  marker: string
  title: string
  type: string
  detail?: string
  href?: string
}

type EnvLike = {
  get?: (key: string) => string | undefined
  [key: string]: unknown
}

export const AI_PROVIDER_ORDER: AiProvider[] = [
  {
    name: 'DeepSeek',
    keyEnv: 'DEEPSEEK_API_KEY',
    baseUrl: 'https://api.deepseek.com',
    model: 'deepseek-v4-pro',
  },
  {
    name: 'Kimi',
    keyEnv: 'KIMI_API_KEY',
    baseUrl: 'https://api.moonshot.ai/v1',
    model: 'kimi-k2.6',
  },
]

const getEnvValue = (env: EnvLike, key: string): string | undefined => {
  if (typeof env?.get === 'function') return env.get(key)
  const value = env?.[key]
  return typeof value === 'string' ? value : undefined
}

export const buildAiProviders = (env: EnvLike): AiProvider[] =>
  AI_PROVIDER_ORDER
    .map((provider) => ({
      ...provider,
      apiKey: getEnvValue(env, provider.keyEnv),
    }))
    .filter((provider) => Boolean(provider.apiKey))

const extractCompletionText = (payload: any): string => {
  const choice = payload?.choices?.[0]
  const content = choice?.message?.content ?? choice?.text

  if (typeof content === 'string') return content.trim()
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : part?.text || ''))
      .join('')
      .trim()
  }

  return ''
}

export const completeWithAiProviders = async ({
  providers,
  messages,
  maxTokens = 1024,
  temperature = 0.7,
  jsonMode = false,
  fetchImpl = fetch,
}: {
  providers: AiProvider[]
  messages: AiMessage[]
  maxTokens?: number
  temperature?: number
  jsonMode?: boolean
  fetchImpl?: typeof fetch
}): Promise<AiCompletionResult> => {
  let lastError = 'No AI providers configured'

  for (const provider of providers) {
    if (!provider.apiKey) continue

    try {
      const response = await fetchImpl(`${provider.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: false,
          ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        lastError = `${provider.name}: ${response.status} - ${errText.slice(0, 500)}`
        console.error(lastError)
        continue
      }

      const payload = await response.json()
      const content = extractCompletionText(payload)

      if (!content) {
        lastError = `${provider.name}: empty response`
        continue
      }

      return {
        content,
        provider: provider.name,
        model: provider.model,
        usage: payload?.usage,
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      lastError = `${provider.name}: ${message}`
      console.error(lastError)
    }
  }

  throw new Error(`All AI providers failed: ${lastError}`)
}

export const parseJsonObjectFromText = (text: string): any => {
  let jsonStr = String(text || '').trim()

  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.slice(7)
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.slice(3)
  }
  if (jsonStr.endsWith('```')) {
    jsonStr = jsonStr.slice(0, -3)
  }

  jsonStr = jsonStr.trim()

  try {
    return JSON.parse(jsonStr)
  } catch (_error) {
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (jsonMatch) return JSON.parse(jsonMatch[0])
    throw new Error('Could not parse JSON from response')
  }
}

const compactDetail = (...parts: Array<string | undefined | null>) =>
  parts.filter(Boolean).join(' - ')

export const buildStudySources = (context: any, maxSources = 12): AiSource[] => {
  const sources: AiSource[] = []
  const seen = new Set<string>()

  const addSource = (source: Omit<AiSource, 'marker'>) => {
    const title = String(source.title || '').trim()
    if (!title || sources.length >= maxSources) return

    const key = `${source.type}:${title.toLowerCase()}`
    if (seen.has(key)) return
    seen.add(key)

    sources.push({
      ...source,
      title,
      marker: `S${sources.length + 1}`,
    })
  }

  ;(context?.resources || []).forEach((resource: any) => {
    addSource({
      type: 'study_resource',
      title: resource.title,
      detail: compactDetail(resource.type || 'resource', resource.author, resource.category),
      href: resource.digital_library_book_id ? `/book/${resource.digital_library_book_id}` : undefined,
    })
  })

  ;(context?.milestones || []).forEach((milestone: any) => {
    addSource({
      type: 'study_milestone',
      title: milestone.title,
      detail: milestone.completed ? 'completed milestone' : 'milestone',
    })
  })

  return sources
}

export const formatSourcesForPrompt = (sources: AiSource[]) =>
  sources
    .map((source) =>
      `[${source.marker}] ${source.title}${source.detail ? ` (${source.detail})` : ''}`
    )
    .join('\n')

export const selectCitedSources = (text: string, sources: AiSource[], limit = 6): AiSource[] => {
  const markerMatches = Array.from(String(text || '').matchAll(/\[S(\d+)\]/gi))
  const citedMarkers = new Set(markerMatches.map((match) => `S${match[1]}`.toUpperCase()))

  const citedByMarker = sources.filter((source) => citedMarkers.has(source.marker.toUpperCase()))
  if (citedByMarker.length > 0) return citedByMarker.slice(0, limit)

  const lowerText = String(text || '').toLowerCase()
  return sources
    .filter((source) => source.title.length > 4 && lowerText.includes(source.title.toLowerCase()))
    .slice(0, limit)
}

export const sourcesFromRecommendedResources = (studyPath: any, resources: any[] = []): AiSource[] => {
  const recommendations = new Set<string>()
  ;(studyPath?.milestones || []).forEach((milestone: any) => {
    ;(milestone.recommended_resources || []).forEach((title: string) => {
      if (title) recommendations.add(String(title).toLowerCase())
    })
  })

  return resources
    .filter((resource) => recommendations.has(String(resource.title || '').toLowerCase()))
    .slice(0, 6)
    .map((resource, index) => ({
      marker: `S${index + 1}`,
      type: 'study_resource',
      title: resource.title,
      detail: compactDetail(resource.type || 'resource', resource.author, resource.category),
      href: resource.digital_library_book_id ? `/book/${resource.digital_library_book_id}` : undefined,
    }))
}
