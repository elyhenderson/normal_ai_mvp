import { supabase } from '../../../lib/supabaseClient'
import { chatWithGPT } from '../../../lib/gpt'
import fs from 'fs'
import path from 'path'

interface ColorBias {
  hex: string
  label: string
}

interface Archetype {
  name: string
  tone_flavor: string
  voice_traits: string[]
  color_bias: ColorBias[]
  font_tendencies: string[]
}

// Function to load archetype data
async function loadArchetypeData(): Promise<Archetype[]> {
  const archetypesDir = path.join(process.cwd(), 'data', 'archetypes')
  const archetypes: Archetype[] = []
  
  // Load each archetype's data
  const files = ['architect/architect.json', 'creator/creator.json', 'magician/magician.json']
  for (const file of files) {
    const filePath = path.join(archetypesDir, file)
    const data = JSON.parse(await fs.promises.readFile(filePath, 'utf8'))
    archetypes.push(data)
  }
  
  return archetypes
}

export async function POST(req: Request) {
  try {
    const { user_id, input } = await req.json()

    if (!user_id || !input) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Get the brand name from the brands table
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .select('name')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (brandError) {
      console.error('Error fetching brand:', brandError)
      return Response.json({ error: 'Failed to fetch brand' }, { status: 500 })
    }

    // Load archetype data
    const archetypes = await loadArchetypeData()

    // Step 2: Analyze brand concept against archetypes
    const analysisPrompt = `
      Analyze this brand concept and determine which archetype(s) it aligns with most strongly.
      Consider the emotional qualities, tone, and purpose of the brand.
      Return ONLY a clean JSON object with two fields - primary and secondary archetypes:
      {
        "primary": "name of primary archetype",
        "secondary": "name of secondary archetype"
      }

      Available archetypes: ${archetypes.map(a => a.name).join(', ')}

      Brand concept: ${input}
    `

    const archetypeResponse = await chatWithGPT([{ role: 'user', content: analysisPrompt }])
    
    if (!archetypeResponse) {
      return Response.json({ error: 'Failed to analyze archetypes' }, { status: 500 })
    }

    const archetypeMatch = JSON.parse(archetypeResponse.replace(/```json\n?|```/g, '').trim())

    // Find the matching archetype data
    const primaryArchetype = archetypes.find(a => a.name === archetypeMatch.primary)
    const secondaryArchetype = archetypes.find(a => a.name === archetypeMatch.secondary)

    if (!primaryArchetype || !secondaryArchetype) {
      return Response.json({ error: 'Failed to match archetypes' }, { status: 500 })
    }

    // Step 3: Generate the Brand Brain using archetype data
    const prompt = `
You are a brand identity expert. Analyze this brand description and create a comprehensive brand identity system.

MOST IMPORTANT - REFERENCE IMAGES:
- DO NOT copy or recreate ANY elements from reference images
- Use references ONLY for understanding emotional intent and mood
- They should inform the feeling, NOT the actual design choices
- Create completely original concepts that stand independently
- All output must be ownable and distinct, not derivative
- Focus on generating brand-specific solutions that feel unique
- References are for understanding personality, not visual direction

${input}

Based on this description, create a brand identity system with:

1. Primary and Secondary Brand Archetypes (from the 12 Jungian archetypes)
2. Brand Voice & Tone:
   - Core tone characteristics
   - 3-5 voice traits that define the communication style
   - Example of tagline that captures the brand essence

3. Visual Identity Direction:
   - Color Palette (provide HEX codes):
     * Primary brand color
     * Secondary color
     * Accent color
     * Neutral color
   - Font Suggestions:
     * Heading font recommendation
     * Body text font recommendation
   - Logo Direction:
     * Describe the conceptual approach
     * Focus on abstract/geometric forms over literal symbols
     * Avoid common design clichés
     * Create something completely original and ownable
   - Layout Style:
     * Overall composition approach
     * Grid system recommendations
   - Photography/Image Treatment:
     * Style of imagery
     * Processing/filter recommendations

REMEMBER:
- Every element must be completely original
- Do not reference or derive from existing brands
- Create distinctive solutions specific to this brand
- Focus on ownable and unique creative directions

Format the response as a JSON object with these exact keys:
{
  "archetype_primary": string,
  "archetype_secondary": string,
  "tone": string,
  "voice_traits": string[],
  "tagline": string,
  "color_palette": {
    "primary": string (hex),
    "secondary": string (hex),
    "accent": string (hex),
    "neutral": string (hex)
  },
  "font_suggestions": {
    "headings": string,
    "body": string
  },
  "logo_direction": string,
  "layout_style": string,
  "photo_transformation": string
}
`.trim()

    const gptResponse = await chatWithGPT([{ role: 'user', content: prompt }])

    if (!gptResponse) {
      return Response.json({ error: 'No response from GPT' }, { status: 500 })
    }

    let brandData
    try {
      const cleanResponse = gptResponse.replace(/```json\n?|```/g, '').trim()
      brandData = JSON.parse(cleanResponse)
    } catch (err) {
      console.error('GPT parse error:', err)
      console.error('GPT raw response:', gptResponse)
      return Response.json({ error: 'Failed to parse GPT output' }, { status: 500 })
    }

    // Step 4: Insert Brand Brain
    const { data: brain, error: insertError } = await supabase
      .from('brand_brains')
      .insert([
        {
          user_id,
          brand_name: brand.name,
          archetype_primary: brandData.archetype_primary,
          archetype_secondary: brandData.archetype_secondary,
          tone: brandData.tone,
          voice_traits: brandData.voice_traits,
          tagline: brandData.tagline,
          brand_story: brandData.brand_story,
          color_palette: brandData.color_palette,
          font_suggestions: brandData.font_suggestions,
          logo_direction: brandData.logo_direction,
          layout_style: brandData.layout_style,
          photo_transformation: brandData.photo_transformation
        }
      ])
      .select('id')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return Response.json({ error: 'Failed to save brand brain' }, { status: 500 })
    }

    return Response.json({ id: brain.id, brand_name: brand.name })
  } catch (error) {
    console.error('Unhandled error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
