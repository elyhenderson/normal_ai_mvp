import { supabaseAdmin } from '../../../lib/supabaseAdmin'
import { chatWithGPT } from '../../../lib/gpt'

interface BrandData {
  brand_story: string
  tagline: string
  tone: string
  voice_traits: string[]
  primary_archetype: string
  secondary_archetype: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
  }
  font_suggestions: {
    headings: string
    body: string
  }
  logo_direction: {
    style: string
    elements: string[]
    concepts: string[]
  }
  layout_style: {
    grid: string
    spacing: string
    hierarchy: string
  }
  photo_transform: {
    style: string
    filters: string[]
    mood: string
  }
}

export async function POST(req: Request) {
  try {
    const { user_id, input, brand_id } = await req.json()

    if (!user_id || !input || !brand_id) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get the brand name
    const { data: brand, error: brandError } = await supabaseAdmin
      .from('brands')
      .select('name')
      .eq('id', brand_id)
      .single()

    if (brandError) {
      console.error('Supabase brand fetch error:', brandError)
      return Response.json(
        { error: 'Failed to fetch brand' },
        { status: 500 }
      )
    }

    // Prompt GPT to analyze the brand input
    const gptPrompt = `
      Analyze this brand description and generate a comprehensive brand identity. 
      Return ONLY a JSON object with no markdown formatting or additional text.
      Use this exact structure with creative values (example values shown):

      {
        "brand_story": "In the heart of digital innovation, a vision emerged...",
        "tagline": "Transform Thoughts into Reality",
        "tone": "confident, warm, and intellectually playful",
        "voice_traits": ["insightful", "clear", "engaging", "authentic"],
        "primary_archetype": "The Creator",
        "secondary_archetype": "The Sage",
        "blob_behavior": {
          "movement": "smooth flowing waves",
          "speed": "medium with gentle acceleration",
          "complexity": "moderate with organic patterns"
        },
        "color_palette": {
          "primary": "#2A2A8C",
          "secondary": "#F5F5F5",
          "accent": "#FFB800",
          "neutral": "#EFEFEF"
        },
        "font_suggestions": {
          "headings": "Canela",
          "body": "Neue Montreal"
        },
        "logo_direction": {
          "style": "minimal and geometric",
          "elements": ["abstract neural paths", "interconnected nodes", "flowing lines"],
          "concepts": ["connectivity", "transformation", "clarity"]
        },
        "layout_style": {
          "grid": "modular 12-column system",
          "spacing": "generous whitespace with golden ratio",
          "hierarchy": "clear visual weight progression"
        },
        "photo_transform": {
          "style": "high contrast duotone",
          "filters": ["grain overlay", "subtle vignette", "matte finish"],
          "mood": "contemplative and forward-thinking"
        }
      }

      Brand description to analyze: ${input}
      
      Remember: Return ONLY the JSON object with no additional text or formatting.
    `

    const messages = [
      {
        role: 'user',
        content: gptPrompt
      }
    ]

    const gptResponse = await chatWithGPT(messages)
    
    if (!gptResponse) {
      console.error('GPT returned empty response')
      return Response.json(
        { error: 'Failed to get response from GPT' },
        { status: 500 }
      )
    }

    let brandData: BrandData
    try {
      // Remove any markdown formatting if present
      const cleanResponse = gptResponse
        .replace(/```json\n|\n```/g, '') // Remove markdown code blocks
        .replace(/^[^{]*/, '') // Remove any text before the first {
        .replace(/[^}]*$/, '') // Remove any text after the last }
        .trim()

      console.log('Cleaned GPT response:', cleanResponse)
      
      brandData = JSON.parse(cleanResponse)
      
      // Validate required fields
      const requiredFields = [
        'brand_story',
        'tagline',
        'tone',
        'voice_traits',
        'primary_archetype',
        'secondary_archetype',
        'color_palette',
        'font_suggestions',
        'logo_direction',
        'layout_style',
        'photo_transform'
      ] as const

      const missingFields = requiredFields.filter(field => !(field in brandData))
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`)
      }

    } catch (error) {
      console.error('Failed to parse GPT response:', error)
      console.error('Raw GPT response:', gptResponse)
      return Response.json(
        { 
          error: 'Failed to parse brand analysis',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      )
    }

    // Insert into Supabase
    const { data: brain, error: insertError } = await supabaseAdmin
      .from('brand_brains')
      .insert([
        {
          user_id,
          brand_name: brand.name,
          archetype_primary: brandData.primary_archetype,
          archetype_secondary: brandData.secondary_archetype,
          tone: brandData.tone,
          voice_traits: brandData.voice_traits,
          tagline: brandData.tagline,
          brand_story: brandData.brand_story,
          color_palette: brandData.color_palette,
          font_suggestions: brandData.font_suggestions,
          logo_direction: JSON.stringify(brandData.logo_direction),
          layout_style: JSON.stringify(brandData.layout_style),
          photo_transformation: JSON.stringify(brandData.photo_transform)
        }
      ])
      .select('id')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return Response.json(
        { error: 'Failed to save brand brain' },
        { status: 500 }
      )
    }

    return Response.json({ id: brain.id, brand_id })
  } catch (error) {
    console.error('Error in createBrain:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 