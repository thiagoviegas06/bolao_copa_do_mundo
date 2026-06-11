import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const bolaoId = searchParams.get('bolaoId')
  const userId = searchParams.get('userId')
  if (!bolaoId || !userId) return NextResponse.json({ error: 'Missing params' }, { status: 400 })

  const { data: bolao } = await supabase.from('boloes').select('owner_id').eq('id', bolaoId).single()
  if (!bolao || bolao.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await admin
    .from('predictions')
    .select('*')
    .eq('bolao_id', bolaoId)
    .eq('user_id', userId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data ?? [])
}
