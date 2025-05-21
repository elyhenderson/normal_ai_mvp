import { supabase } from '../../../lib/supabaseClient'
import { chatWithGPT } from '../../../lib/gpt'

export async function POST(req: Request) {
  try {
    const { user_id, input } = await req.json()

    if (!user_id || !input) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // First create a brand
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert([
        {
          user_id,
          name: 'New Brand', // You might want to generate this from the input
          description: input,
          creation_method: 'freestyle'
        }
      ])
      .select('id')
      .single()

    if (brandError) {
      console.error('Supabase brand insert error:', brandError)
      return Response.json(
        { error: 'Failed to create brand' },
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
      return Response.json(
        { error: 'Failed to get response from GPT' },
        { status: 500 }
      )
    }

    let brandData
    try {
      // Remove any markdown formatting if present
      const cleanResponse = gptResponse.replace(/```json\n|\n```/g, '').trim()
      brandData = JSON.parse(cleanResponse)
    } catch (error) {
      console.error('Failed to parse GPT response:', error)
      console.error('Raw response:', gptResponse)
      return Response.json(
        { error: 'Failed to parse brand analysis' },
        { status: 500 }
      )
    }

    // Insert into Supabase
    const { data: brain, error: insertError } = await supabase
      .from('brand_brains')
      .insert([
        {
          user_id,
          brand_id: brand.id,
          brand_story: brandData.brand_story,
          tagline: brandData.tagline,
          tone: brandData.tone,
          voice_traits: brandData.voice_traits,
          primary_archetype: brandData.primary_archetype,
          secondary_archetype: brandData.secondary_archetype,
          color_palette: brandData.color_palette,
          font_suggestions: brandData.font_suggestions,
          logo_direction: brandData.logo_direction,
          layout_style: brandData.layout_style,
          photo_transform: brandData.photo_transform,
          status: 'active'
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

    return Response.json({ id: brain.id, brand_id: brand.id })
  } catch (error) {
    console.error('Error in createBrain:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 