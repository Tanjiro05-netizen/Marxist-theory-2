import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  buildAiProviders,
  completeWithAiProviders,
  parseJsonObjectFromText,
  sourcesFromRecommendedResources,
} from '../_shared/aiProviders.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `You are a Marxist theory curriculum expert on a communist education platform. Your task is to generate personalized study paths for students based on their:

1. Current knowledge level (beginner/intermediate/advanced)
2. Specific interests (e.g., political economy, dialectical materialism, historical materialism, etc.)
3. Time commitment (casual/regular/dedicated)
4. Language preference

IMPORTANT OUTPUT FORMAT:
You must respond with ONLY a valid JSON object (no markdown, no explanation outside the JSON). The JSON must have this exact structure:

{
  "path_title": "Name of the study path",
  "estimated_weeks": number,
  "description": "Brief 1-2 sentence overview",
  "milestones": [
    {
      "title": "Milestone title (Chinese + English if applicable)",
      "description": "What this milestone covers",
      "estimated_days": number,
      "recommended_resources": ["Resource title 1", "Resource title 2"],
      "key_concepts": ["concept1", "concept2", "concept3"],
      "difficulty": "beginner|intermediate|advanced"
    }
  ],
  "study_tips": ["Tip 1", "Tip 2", "Tip 3"]
}

RULES:
- Generate 4-8 milestones per study path
- Each milestone should build on the previous one
- For beginners: Start with the Communist Manifesto, historical materialism basics
- For intermediate: Move to Capital, dialectical materialism, class analysis
- For advanced: Engage with Imperialism, Philosophy, revolutionary strategy
- Include specific classic works: Manifesto, Capital, Imperialism the Highest Stage, Anti-Dühring, What is to be Done, etc.
- Make milestones achievable in 1-4 weeks each
- Return ONLY the JSON object, no additional text`

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      level = 'beginner', 
      interests = [], 
      timeCommitment = 'regular',
      language = 'english',
      saveToUser = false,
      userId = null
    } = await req.json()

    // Create Supabase client to fetch resources for context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch available resources for context
    const { data: resources } = await supabase
      .from('study_resources')
      .select('title, type, author, category, excerpt, digital_library_book_id')
      .limit(30)

    const { data: glossary } = await supabase
      .from('glossary')
      .select('term, type, explanation')
      .limit(50)

    // Build context about available materials
    const resourceContext = resources?.map(r => 
      `- "${r.title}" by ${r.author || 'Unknown'} (${r.type})${r.category ? ` - ${r.category}` : ''}`
    ).join('\n') || 'No resources available'

    const glossaryContext = glossary?.map(g => 
      `- ${g.term} (${g.type}): ${g.explanation?.slice(0, 100)}...`
    ).join('\n') || 'No glossary terms available'

    const userContext = `
Student Profile:
- Current Level: ${level}
- Interests: ${interests.length > 0 ? interests.join(', ') : 'General Marxist theory'}
- Time Commitment: ${timeCommitment}
- Preferred Language: ${language}

Available Study Resources:
${resourceContext}

Key Concepts in Glossary:
${glossaryContext}
`

    const apiMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      { role: 'user' as const, content: userContext }
    ]

    try {
      const completion = await completeWithAiProviders({
        providers: buildAiProviders(Deno.env),
        messages: apiMessages,
        maxTokens: 2048,
        temperature: 0.55,
        jsonMode: true,
      })

      const studyPath = parseJsonObjectFromText(completion.content)

      if (!studyPath.milestones || !Array.isArray(studyPath.milestones)) {
        throw new Error('Invalid study path structure')
      }

      if (saveToUser && userId) {
        await saveGeneratedMilestones(supabase, studyPath, userId)
      }

      return new Response(
        JSON.stringify({
          success: true,
          studyPath,
          provider: completion.provider,
          model: completion.model,
          sources: sourcesFromRecommendedResources(studyPath, resources || []),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    } catch (error) {
      const details = error instanceof Error ? error.message : String(error)
      console.error(`Study path AI failed: ${details}`)

      const fallbackPath = getFallbackStudyPath(level, interests)

      return new Response(
        JSON.stringify({
          success: true,
          studyPath: fallbackPath,
          provider: 'fallback',
          model: 'local-fallback',
          sources: sourcesFromRecommendedResources(fallbackPath, resources || []),
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

async function saveGeneratedMilestones(supabase: any, studyPath: any, userId: string) {
  try {
    for (let i = 0; i < studyPath.milestones.length; i++) {
      const milestone = studyPath.milestones[i]
      await supabase.from('study_milestones').insert({
        title: milestone.title,
        chinese_title: milestone.title,
        description: milestone.description,
        sort_order: i,
        ai_generated: true,
        generated_for_user: userId,
        key_concepts: milestone.key_concepts,
        difficulty: milestone.difficulty,
        estimated_days: milestone.estimated_days
      })
    }
  } catch (dbError) {
    console.error('Database save error:', dbError)
  }
}

function getFallbackStudyPath(level: string, interests: string[]): any {
  const basePath = {
    path_title: `Personalized ${level.charAt(0).toUpperCase() + level.slice(1)} Study Path`,
    estimated_weeks: 12,
    description: 'A structured reading path through Marxist theory, adapted to your level and interests.',
    milestones: [
      {
        title: 'Foundations: The Communist Manifesto & Historical Materialism',
        description: 'Begin with the foundational document of modern communism. Understand the critique of capitalism and the concept of class struggle.',
        estimated_days: 14,
        recommended_resources: ['The Communist Manifesto', 'Principles of Communism'],
        key_concepts: ['class_struggle', 'bourgeoisie', 'proletariat', 'historical_materialism'],
        difficulty: 'beginner'
      },
      {
        title: 'Dialectical Materialism: The Philosophical Foundation',
        description: 'Study the philosophical basis of Marxist worldview - the unity of opposites, negation of negation, and the transformation of quantity into quality.',
        estimated_days: 21,
        recommended_resources: ['Dialectics of Nature (Engels)', 'Anti-Dühring (Excerpts)'],
        key_concepts: ['dialectics', 'materialism', 'contradiction', 'negation'],
        difficulty: level === 'beginner' ? 'beginner' : 'intermediate'
      },
      {
        title: "Marx's Political Economy: Capital Volume I",
        description: 'Engage with Marx\'s masterwork on political economy. Focus on the concept of surplus value and the analysis of capitalism\'s contradictions.',
        estimated_days: 28,
        recommended_resources: ['Capital Volume I', 'Wage Labour and Capital'],
        key_concepts: ['surplus_value', 'commodity', 'labor', 'capital', 'exploitation'],
        difficulty: 'intermediate'
      },
      {
        title: 'Imperialism and the Stage of Monopoly Capitalism',
        description: "Study Lenin's analysis of capitalism's highest stage and its implications for revolutionary strategy.",
        estimated_days: 21,
        recommended_resources: ['Imperialism, the Highest Stage of Capitalism'],
        key_concepts: ['imperialism', 'monopoly', 'finance_capital', 'opportunism'],
        difficulty: 'intermediate'
      },
      {
        title: 'Revolutionary Strategy: Organization and Leadership',
        description: 'Understand the questions of revolutionary organization, the role of the vanguard party, and strategy for proletarian revolution.',
        estimated_days: 21,
        recommended_resources: ["What is to be Done?", "Left-Wing Communism: An Infantile Disorder"],
        key_concepts: ['vanguard_party', 'democratic_centralism', 'mass_line', 'revolutionary_strategy'],
        difficulty: 'advanced'
      },
      {
        title: 'Synthesis: Applying Theory to Practice',
        description: 'Integrate your knowledge to analyze contemporary capitalism, evaluate revolutionary movements, and develop your own theoretical perspective.',
        estimated_days: 28,
        recommended_resources: ['Selected readings on contemporary application'],
        key_concepts: ['contemporary_analysis', 'synthesis', 'practice'],
        difficulty: 'advanced'
      }
    ],
    study_tips: [
      'Take notes on key concepts and how they relate to each other',
      'Discuss ideas with fellow students to deepen understanding',
      'Apply theoretical concepts to analyze current events',
      'Revisit earlier texts as your understanding develops'
    ]
  }

  return basePath
}
