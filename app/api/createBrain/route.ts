import { supabase } from '../../../lib/supabaseClient'
import { chatWithGPT } from '../../../lib/gpt'

export async function POST(req: Request) {
  try {
    const { user_id, input } = await req.json()

    if (!user_id || !input) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Step 1: Generate a Brand Name
    const namePrompt = `
      Given the following brand idea, create a short and unique brand name that feels modern, intelligent, and creative. Avoid clichés and ensure it's memorable. Return ONLY the name with no punctuation or quotes.

      Brand idea: ${input}
    `

    const nameResult = await chatWithGPT([{ role: 'user', content: namePrompt }])
    const brandName = nameResult?.trim().replace(/^["']|["']$/g, '') || 'Untitled Brand'

    // Step 2: Create the brand in Supabase
    const { data: brand, error: brandError } = await supabase
      .from('brands')
      .insert([
        {
          user_id,
          name: brandName,
          description: input,
          creation_method: 'freestyle'
        }
      ])
      .select('id')
      .single()

    if (brandError) {
      console.error('Supabase brand insert error:', brandError)
      return Response.json({ error: 'Failed to create brand' }, { status: 500 })
    }

    // Step 3: Generate the Brand Brain
    const gptPrompt = `
      Analyze the following brand concept and generate a complete brand identity. 
      Return ONLY a clean JSON object using this format, with no markdown or extra explanation:

      {
        "brand_story": "...",
        "tagline": "...",
        "tone": "...",
        "voice_traits": [...],
        "primary_archetype": "...",
        "secondary_archetype": "...",
        "blob_behavior": {
          "movement": "...",
          "speed": "...",
          "complexity": "..."
        },
        "color_palette": {
          "primary": "#...",
          "secondary": "#...",
          "accent": "#...",
          "neutral": "#..."
        },
        "font_suggestions": {
          "headings": "...",
          "body": "..."
        },
        "logo_direction": {
          "style": "...",
          "elements": [...],
          "concepts": [...]
        },
        "layout_style": {
          "grid": "...",
          "spacing": "...",
          "hierarchy": "..."
        },
        "photo_transform": {
          "style": "...",
          "filters": [...],
          "mood": "..."
        }
      }

      Brand concept: ${input}
    `

    const gptResponse = await chatWithGPT([{ role: 'user', content: gptPrompt }])

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
          status: 'active',
          full_json: brandData // optional: store full structured data for future use
        }
      ])
      .select('id')
      .single()

    if (insertError) {
      console.error('Supabase insert error:', insertError)
      return Response.json({ error: 'Failed to save brand brain' }, { status: 500 })
    }

    return Response.json({ id: brain.id, brand_id: brand.id, brand_name: brandName })
  } catch (error) {
    console.error('Unhandled error:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
