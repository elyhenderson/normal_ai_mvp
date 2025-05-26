import { supabase } from '../../../lib/supabaseClient'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

interface GenerateMockupsRequest {
  brand_name: string
  brand_type: string // e.g. "restaurant", "tech company", "fashion brand"
  logo_url: string
  color_palette: {
    primary: string
    secondary: string
    accent: string
    neutral: string
  }
  brain_id: string
}

async function generateMockupPrompt(
  brandName: string,
  brandType: string,
  logoUrl: string,
  colorPalette: any,
  mockupType: string
): Promise<string> {
  const mockupPrompts = {
    billboard: `Create a photorealistic mockup of a large outdoor billboard for "${brandName}". 
- Show the billboard in a contemporary urban setting at dusk/golden hour
- Natural city environment with modern architecture in background
- Subtle ambient lighting and atmospheric effects
- Logo should be elegantly integrated, not just pasted on
- Use ${colorPalette.primary} as the dominant architectural element
- Focus on creating a premium, high-end feel
- Make it feel like a real location, not a template`,
    
    storefront: `Create a photorealistic mockup of a retail/business entrance for "${brandName}".
- Design a modern, minimalist storefront that fits the brand's aesthetic
- Integrate the logo naturally into the facade architecture
- Use ${colorPalette.primary} and ${colorPalette.accent} in the structural elements
- Add depth with glass reflections and subtle environmental lighting
- Include organic elements like blurred pedestrians or street activity
- Make it feel like a premium location in a design-forward neighborhood
- Focus on architectural details that complement the brand style`,
    
    product: `Create a photorealistic product mockup for "${brandName}" that makes sense for a ${brandType}.
- Design an elegant, minimal product presentation
- Use materials and finishes that reflect the brand's premium positioning
- Integrate the logo subtly and naturally into the product design
- Create soft, natural lighting with delicate shadows
- Add minimal styling elements that enhance but don't distract
- Make it feel like a professional product photo shoot
- Focus on texture and material quality`,
    
    stationery: `Create a photorealistic mockup of premium business stationery for "${brandName}".
- Arrange business cards, letterhead, and materials in an editorial style
- Use ${colorPalette.primary} and ${colorPalette.accent} thoughtfully in the materials
- Create a sophisticated flat-lay composition with natural shadows
- Add subtle texture and depth through paper materials
- Make it feel like a high-end brand photography session
- Focus on premium print finishes and materials
- Include small styling elements that add life without overwhelming`,
    
    environment: `Create a photorealistic environmental mockup showing "${brandName}" in context.
- Design a space that naturally fits a ${brandType} brand
- Integrate brand colors (${colorPalette.primary}, ${colorPalette.accent}) architecturally
- Create a sophisticated atmosphere with thoughtful lighting
- Add life through subtle environmental elements
- Make it feel like a real, lived-in premium space
- Focus on architectural details and material quality
- Ensure the brand presence feels organic, not forced`
  }

  return `
IMPORTANT - Create a photorealistic mockup:
- This should look like a professional photograph
- Focus on lighting, shadows, and reflections
- Use high-quality materials and textures
- Create a believable environment
- Make it feel premium and sophisticated
- Avoid template-like or generic presentations
- Ensure natural integration of brand elements

${mockupPrompts[mockupType as keyof typeof mockupPrompts]}

Remember: This must be PHOTOREALISTIC - like a high-end commercial photograph.
`.trim()
}

export async function POST(req: Request) {
  try {
    const body: GenerateMockupsRequest = await req.json()
    console.log('Received mockup request:', JSON.stringify(body, null, 2))

    const mockupTypes = ['billboard', 'storefront', 'product', 'stationery', 'environment']
    const mockupUrls: string[] = []

    // Generate each mockup type
    for (const mockupType of mockupTypes) {
      try {
        const prompt = await generateMockupPrompt(
          body.brand_name,
          body.brand_type,
          body.logo_url,
          body.color_palette,
          mockupType
        )

        console.log(`Generating ${mockupType} mockup with prompt:`, prompt)

        // Generate mockup with DALL-E 3
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
          throw new Error(`No mockup generated for ${mockupType}`)
        }

        // Download the image
        const imageResponse = await fetch(response.data[0].url)
        const imageBuffer = Buffer.from(await imageResponse.arrayBuffer())

        // Upload to Supabase and get public URL
        const fileName = `mockups/${body.brand_name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${mockupType}-${Date.now()}.png`
        const { data, error } = await supabase.storage
          .from('brand-assets')
          .upload(fileName, imageBuffer, {
            contentType: 'image/png',
            upsert: true
          })

        if (error) {
          console.error(`Error uploading ${mockupType} mockup:`, error)
          throw error
        }

        // Get the public URL
        const { data: { publicUrl } } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(fileName)

        mockupUrls.push(publicUrl)
        console.log(`Successfully generated ${mockupType} mockup:`, publicUrl)

      } catch (error) {
        console.error(`Error generating ${mockupType} mockup:`, error)
        throw error
      }
    }

    // Update the brand_brains table with mockup URLs
    const { data: updateData, error: updateError } = await supabase
      .from('brand_brains')
      .update({ 
        mockup_urls: mockupUrls // Store as array directly since we're using JSONB
      })
      .eq('id', body.brain_id)
      .select()

    if (updateError) {
      console.error('Error updating brand_brains with mockup URLs:', updateError)
      throw updateError
    }

    return Response.json({ 
      success: true,
      mockupUrls // Return as array
    })

  } catch (error: any) {
    console.error('Error in generateMockups:', error)
    return Response.json({ 
      error: error.message || 'Failed to generate mockups',
      details: error
    }, { 
      status: 500 
    })
  }
} 