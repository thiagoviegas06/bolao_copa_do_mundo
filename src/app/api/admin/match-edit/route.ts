import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { matchId, bolaoId, homeTeam, awayTeam, matchDate, stage, locked } = await request.json()

  if (!matchId || !bolaoId || !homeTeam || !awayTeam || !matchDate || !stage) {
    return NextResponse.json({ error: 'Campos obrigatórios ausentes' }, { status: 400 })
  }

  const { data: bolao } = await supabase.from('boloes').select('owner_id').eq('id', bolaoId).single()
  if (!bolao || bolao.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { error } = await admin.from('matches').update({
    home_team: homeTeam,
    away_team: awayTeam,
    match_date: matchDate,
    stage,
    locked: locked ?? true,
  }).eq('id', matchId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
