import { chatWithGPT } from '@/lib/gpt'

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    
    const messages = [
      {
        role: 'user',
        content: prompt
      }
    ]

    const response = await chatWithGPT(messages)
    return Response.json({ result: response })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to process request' }, { status: 500 })
  }
} 