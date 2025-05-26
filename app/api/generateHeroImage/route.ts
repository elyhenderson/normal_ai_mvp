import { supabase } from '../../../lib/supabaseClient'
import OpenAI from 'openai'
import fs from 'fs'
import path from 'path'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

async function loadBrandData(brandId: string) {
  console.log('Attempting to load brand data with ID:', brandId)
  
  // First check if the brain exists
  const { data: brainCheck, error: brainError } = await supabase
    .from('brand_brains')
    .select('id')
    .eq('id', brandId)
    .single()

  if (brainError) {
    console.error('Error checking brain:', brainError)
    throw new Error(`Brain not found: ${brandId}`)
  }

  // Now get the full data with the brand relationship
  const { data, error } = await supabase
    .from('brand_brains')
    .select(`
      *,
      brand:brand_id (
        name,
        primary_archetype,
        secondary_archetype
      )
    `)
    .eq('id', brandId)
    .single()

  if (error) {
    console.error('Error loading brand data:', error)
    throw new Error(`Failed to load brand data for ID: ${brandId}`)
  }

  if (!data) {
    console.error('No data returned for brand ID:', brandId)
    throw new Error(`No data found for brand ID: ${brandId}`)
  }

  console.log('Loaded brand data:', JSON.stringify(data, null, 2))
  
  // Extract archetype data from the brands table
  const brandData = {
    ...data,
    primary_archetype: data.brand?.primary_archetype,
    secondary_archetype: data.brand?.secondary_archetype,
    name: data.brand?.name
  }

  if (!brandData.primary_archetype || !brandData.secondary_archetype) {
    console.error('Missing archetype data:', brandData)
    throw new Error('Missing archetype data in brand')
  }

  return brandData
}

async function loadArchetypeDetails(archetypeName: string): Promise<any> {
  const cleanName = archetypeName.toLowerCase().replace(/^the\s+/, '').trim()
  const archetypePath = path.join(process.cwd(), 'data', 'archetypes', cleanName, `${cleanName}.json`)
  const data = JSON.parse(await fs.promises.readFile(archetypePath, 'utf8'))
  return data
}

function extractDesignLanguage(primary: any, secondary: any): string {
  const layout = (primary.layout_preferences || []).concat(secondary.layout_preferences || []).slice(0, 2).join(', ')
  const materials = (primary.moodboard_tags || []).concat(secondary.moodboard_tags || []).slice(0, 3).join(', ')
  const photoStyle = (primary.photo_transforms || []).concat(secondary.photo_transforms || []).slice(0, 1).join(', ')

  return `
COMPOSITION GUIDANCE:
- Layout preference: ${layout}
- Materials to feature: ${materials}
- Visual treatment: ${photoStyle}
- Lighting should support structural logic, not mood
- Ensure hierarchy through spatial tension and contrast
  `.trim()
}

async function generateCreativePrompt(brand: any, primary: any, secondary: any): Promise<string> {
  const colors = [brand.primary_color, brand.secondary_color, brand.accent_color, brand.neutral_color].filter(Boolean).join(', ') || 'harmonious colors'

  const styleMetaphors: { [key: string]: string } = {
    creator: "artisan's workshop, creative sanctuary",
    magician: "mystical laboratory, enchanted space",
    sage: "timeless library, wisdom temple",
    rebel: "urban underground, raw energy space",
    architect: "geometric sanctuary, structured harmony"
  }

  const primaryKey = brand.primary_archetype?.toLowerCase() || 'creator'
  const secondaryKey = brand.secondary_archetype?.toLowerCase() || 'architect'
  const primaryMetaphor = styleMetaphors[primaryKey] || `${primaryKey} space`
  const secondaryMetaphor = styleMetaphors[secondaryKey] || `${secondaryKey} realm`
  const designGuidance = extractDesignLanguage(primary, secondary)

  return `
MOST IMPORTANT:
- Create a COMPLETELY ORIGINAL hero image
- Do NOT reference or copy any existing designs
- Focus on creating a unique, ownable visual world

CREATIVE DIRECTION:
- Blend the essence of ${primaryMetaphor} with subtle hints of ${secondaryKey}
- Create an abstract, conceptual environment that feels both familiar and extraordinary
- Use ${colors} as your primary palette
- Keep the composition clean and intentional

${designGuidance}

TECHNICAL REQUIREMENTS:
- Output as a 1792x1024 hero image
- Ensure the design works edge-to-edge
- Create clear focal points that draw the eye
- Leave space for text overlay if needed
- Maintain visual hierarchy and balance

IMPORTANT NOTES:
- The design must be completely original
- Do not use any copyrighted or trademarked elements
- Create something distinctive and ownable
- Focus on quality and professionalism
`.trim()
}

export async function POST(req: Request) {
  try {
    const {
      brand_name,
      archetype_primary,
      archetype_secondary,
      color_palette,
      photo_transformation,
      brain_id
    } = await req.json()
    
    console.log('Received request:', {
      brand_name,
      archetype_primary,
      archetype_secondary,
      color_palette,
      photo_transformation,
      brain_id
    })

    // Load archetype details
    const primary = await loadArchetypeDetails(archetype_primary)
    const secondary = await loadArchetypeDetails(archetype_secondary)

    // Generate the creative prompt
    const prompt = await generateCreativePrompt(
      { 
        name: brand_name,
        primary_archetype: archetype_primary,
        secondary_archetype: archetype_secondary,
        primary_color: color_palette.primary,
        secondary_color: color_palette.secondary,
        accent_color: color_palette.accent,
        neutral_color: color_palette.neutral
      },
      primary,
      secondary
    )

    console.log('Generated creative prompt:', prompt)

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "natural",
      response_format: "url"
    })

    if (!response.data?.[0]?.url) {
      throw new Error('No image generated from DALL-E')
    }

    // Download and upload image
    const imageResponse = await fetch(response.data[0].url)
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

    const fileName = `hero-images/${brand_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}.png`
    const { data, error } = await supabase.storage
      .from('brand-assets')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      })

    if (error) {
      throw new Error('Failed to upload image to Supabase')
    }

    const { data: { publicUrl } } = supabase.storage.from('brand-assets').getPublicUrl(fileName)

    // Update the brain with the hero image URL
    const { error: updateError } = await supabase
      .from('brand_brains')
      .update({ hero_image_url: publicUrl })
      .eq('id', brain_id)

    if (updateError) {
      throw new Error('Failed to update brand with hero image URL')
    }

    return Response.json({ success: true, imageUrl: publicUrl })

  } catch (error: any) {
    console.error('Error in generateHeroImage:', error)
    return Response.json({ 
      error: error.message || 'Failed to generate hero image',
      details: error
    }, { status: 500 })
  }
}
