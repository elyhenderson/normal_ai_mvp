import { supabase } from '@/lib/supabaseClient'

export async function GET() {
  try {
    const { data, error } = await supabase.from('test').select('*').limit(1)
    
    if (error) {
      throw error
    }

    return Response.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return Response.json({ error: 'Failed to fetch data' }, { status: 500 })
  }
} 