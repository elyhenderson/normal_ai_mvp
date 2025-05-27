import { supabase } from '../../../lib/supabaseClient'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface GenerateLogoRequest {
  brand_name: string
  archetype_primary: string
  archetype_secondary: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
  }
  logo_direction: string
  brain_id: string
}

async function loadArchetypeReferences(archetypeName: string): Promise<any> {
  try {
    // Clean up archetype name: remove 'the' and convert to lowercase
    const cleanArchetype = archetypeName.toLowerCase().replace(/^the\s+/, '').trim()
    
    // Try directory-based path first (for architect, creator, magician)
    let archetypePath = path.join(process.cwd(), 'data', 'archetypes', cleanArchetype, `${cleanArchetype}.json`)
    
    try {
      const data = JSON.parse(await fs.promises.readFile(archetypePath, 'utf8'))
      return data.visual_references || []
    } catch (error) {
      // If directory-based path fails, try flat file path
      archetypePath = path.join(process.cwd(), 'data', 'archetypes', `${cleanArchetype}.json`)
      const data = JSON.parse(await fs.promises.readFile(archetypePath, 'utf8'))
      return data.visual_references || []
    }
  } catch (error) {
    console.error(`Error loading archetype ${archetypeName}:`, error)
    throw error
  }
}

async function generateLogoPrompt(
  brandName: string,
  primaryArchetype: string,
  secondaryArchetype: string,
  colorPalette: any,
  logoDirection: string
): Promise<string> {
  try {
    const bgColor = colorPalette.primary
    const iconColor = bgColor.toLowerCase().includes('#fff') ? (colorPalette.accent || '#000000') : '#FFFFFF'

    return `
Design a single brand icon for "${brandName}". 

MOST IMPORTANT - BACKGROUND:
- The entire canvas MUST be filled with a solid ${bgColor} color
- NO textures, NO gradients, NO patterns
- Think of it like a solid piece of colored paper

STYLE:
- Flat, modern, minimal, and iconic
- Create something original that captures the essence and feeling
- Focus on the brand's core personality: ${logoDirection}

COLOR:
- Background: solid ${bgColor}, filling the full square canvas
- Icon: solid ${iconColor}

COMPOSITION:
- Single icon centered in frame
- Icon should be bold and clear at small sizes
- Generous padding around icon
- Clean, geometric shapes preferred
- No text, no letters, just a symbol

TECHNICAL:
- Output as a 1024x1024 square
- Flat 2D design only
- No 3D effects
- No shadows
- No gradients
- No textures
- No patterns
- Just two solid colors: background and icon

IMPORTANT NOTES:
- The design must be completely original
- Do not use any copyrighted or trademarked elements
- Keep it simple and iconic
- The icon should work at any size
    `.trim()
  } catch (error) {
    console.error('Error in generateLogoPrompt:', error)
    throw error
  }
}

export async function POST(req: Request) {
  try {
    const body: GenerateLogoRequest = await req.json()
    console.log('Received request body:', JSON.stringify(body, null, 2))

    // Generate the logo prompt
    const prompt = await generateLogoPrompt(
      body.brand_name,
      body.archetype_primary,
      body.archetype_secondary,
      body.color_palette,
      body.logo_direction
    )

    console.log('Generated logo prompt:', prompt)

    // Generate logo with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "hd",
      style: "natural",
      response_format: "url"
    })

    if (!response.data?.[0]?.url) {
      throw new Error('No logo generated from DALL-E')
    }

    // Download the image
    const imageResponse = await fetch(response.data[0].url)
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    // Upload to Supabase and get public URL
    const fileName = `logos/${body.brand_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      console.error('Error uploading logo:', error)
      throw error
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(fileName)

    console.log('Attempting to update brain_id:', body.brain_id, 'with logo URL:', publicUrl)

    // First verify the brain exists
    const { data: existingBrain, error: fetchError } = await supabase
      .from('brand_brains')
      .select('id')
      .eq('id', body.brain_id)
      .single()

    if (fetchError || !existingBrain) {
      console.error('Brain not found:', body.brain_id, fetchError)
      throw new Error(`Brain not found: ${body.brain_id}`)
    }

    // Save the logo URL to the brand_brains table
    const { data: updateData, error: updateError } = await supabase
      .from('brand_brains')
      .update({ logo_url: publicUrl })
      .eq('id', body.brain_id)
      .select()

    if (updateError) {
      console.error('Error updating brand_brains:', updateError)
      console.error('Update attempted with:', { 
        brain_id: body.brain_id, 
        logo_url: publicUrl 
      })
      throw new Error(`Failed to update brand with logo URL: ${updateError.message}`)
    }

    console.log('Successfully updated brain with logo URL:', updateData)

    return Response.json({ 
      success: true,
      logoUrl: publicUrl
    })

  } catch (error: any) {
    console.error('Error in generateLogo:', error)
    return Response.json({ 
      error: error.message || 'Failed to generate logo',
      details: error
    }, { 
      status: 500 
    })
  }
} 