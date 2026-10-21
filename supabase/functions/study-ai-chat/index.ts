import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  buildAiProviders,
  buildStudySources,
  completeWithAiProviders,
  formatSourcesForPrompt,
  selectCitedSources,
} from '../_shared/aiProviders.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a knowledgeable Marxist theory study assistant on a communist education platform. Your role is to help students navigate their study of Marxist-Leninist theory, dialectical materialism, historical materialism, political economy, and scientific socialism.

Guidelines:
- Be encouraging and pedagogical. Help students understand complex theoretical concepts.
- Reference classic works by Marx, Engels, Lenin, Mao, and other Marxist theorists when relevant.
- When asked about study plans, use the provided context about the student's milestones and resources.
- Keep responses concise but substantive (2-4 paragraphs max unless the question requires more).
- Use a comradely tone — supportive and intellectually rigorous.
- If asked about non-Marxist topics, gently redirect to the study material.
- You may respond in Chinese or English depending on the user's language.
- When referencing study resources or milestones from the user's context, mention them by name.
- When the context includes citable archive sources, cite them inline using their bracket marker, like [S1]. Do not invent citations.`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { messages, context } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'messages array is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    const sources = buildStudySources(context)

    // Build context string from study data
    let contextBlock = ''
    if (context) {
      const parts: string[] = []
      if (context.milestones?.length) {
        const milestoneList = context.milestones.map((m: any) => {
          const status = m.completed ? '✅ completed' : '⬜ incomplete'
          return `- ${m.title} (${status})`
        }).join('\n')
        parts.push(`Student's milestones:\n${milestoneList}`)
      }
      if (context.resources?.length) {
        const resourceList = context.resources.slice(0, 15).map((r: any) =>
          `- "${r.title}" (${r.type}${r.author ? ', by ' + r.author : ''}${r.category ? ', ' + r.category : ''})`
        ).join('\n')
        parts.push(`Available study resources:\n${resourceList}`)
      }
      if (sources.length) {
        parts.push(`Citable archive sources:\n${formatSourcesForPrompt(sources)}`)
      }
      if (context.completedCount !== undefined && context.totalCount !== undefined) {
        parts.push(`Progress: ${context.completedCount}/${context.totalCount} milestones completed.`)
      }
      if (context.nextMilestone) {
        parts.push(`Next recommended milestone: "${context.nextMilestone}"`)
      }
      if (parts.length > 0) {
        contextBlock = '\n\nCurrent student context:\n' + parts.join('\n\n')
      }
    }

    const systemMessage = {
      role: 'system' as const,
      content: SYSTEM_PROMPT + contextBlock,
    }

    // Format messages for the API (OpenAI-compatible format)
    const apiMessages = [
      systemMessage,
      ...messages.map((m: any) => ({
        role: (m.type === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    try {
      const completion = await completeWithAiProviders({
        providers: buildAiProviders(Deno.env),
        messages: apiMessages,
        maxTokens: 1024,
        temperature: 0.55,
      })
      const reply = completion.content

      return new Response(
        JSON.stringify({
          reply,
          provider: completion.provider,
          model: completion.model,
          sources: selectCitedSources(reply, sources),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error)
      const reply = getFallbackResponse(messages[messages.length - 1]?.content || '', sources)

      // All providers failed
      return new Response(
        JSON.stringify({
          error: 'All AI providers failed',
          details,
          reply,
          provider: 'fallback',
          model: 'local-fallback',
          sources: selectCitedSources(reply, sources),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function getFallbackResponse(input: string, sources: Array<{ marker: string; title: string; type: string }> = []): string {
  const lower = input.toLowerCase()
  const firstTextSource = sources.find((source) => source.type === 'study_resource') || sources[0]
  const citation = firstTextSource ? ` [${firstTextSource.marker}]` : ''

  if (lower.includes('path') || lower.includes('plan') || lower.includes('next')) {
    return `I'd recommend following the milestones in order - start with the foundational texts before moving to more advanced theory. Check the Study Path tab for your personalized progression.${citation}`
  }
  if (lower.includes('progress') || lower.includes('done') || lower.includes('completed')) {
    return "Check the Milestones section to see your progress. Each completed milestone brings you closer to a deeper understanding of Marxist theory."
  }
  if (lower.includes('book') || lower.includes('read') || lower.includes('text')) {
    return firstTextSource
      ? `I recommend starting with "${firstTextSource.title}" and using the Study Resources section to keep the reading line grounded.${citation}`
      : "I recommend starting with the Communist Manifesto and then progressing to Capital Vol. 1. The Study Resources section has curated reading materials."
  }
  if (lower.includes('dialectic') || lower.includes('materialism')) {
    return "Dialectical materialism is the philosophical foundation of Marxism. Start with Engels' 'Anti-Dühring' and Lenin's 'Materialism and Empirio-criticism' for a thorough grounding."
  }
  return "I can help you with study planning, understanding Marxist concepts, or finding resources. Try asking about your next steps, specific concepts, or recommended readings!"
}
