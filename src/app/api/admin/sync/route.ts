import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'

const COMPETITION_ID = 2000

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'SCHEDULED', TIMED: 'SCHEDULED',
    IN_PLAY: 'LIVE', PAUSED: 'LIVE',
    FINISHED: 'FINISHED', POSTPONED: 'POSTPONED',
    SUSPENDED: 'POSTPONED', CANCELLED: 'POSTPONED',
  }
  return map[status] ?? 'SCHEDULED'
}

export async function POST(request: Request) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verifica que é dono de pelo menos um bolão
  const { data: owned } = await supabase.from('boloes').select('id').eq('owner_id', user.id).limit(1)
  if (!owned?.length) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'FOOTBALL_API_KEY não configurada' }, { status: 500 })

  const res = await fetch(
    `${process.env.FOOTBALL_API_BASE}/competitions/${COMPETITION_ID}/matches`,
    { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 })

  const { matches = [] } = await res.json()

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const upsertData = matches.map((m: any) => ({
    external_id: m.id,
    home_team: m.homeTeam.shortName || m.homeTeam.name || 'A definir',
    away_team: m.awayTeam.shortName || m.awayTeam.name || 'A definir',
    home_team_flag: m.homeTeam.crest,
    away_team_flag: m.awayTeam.crest,
    match_date: m.utcDate,
    stage: m.stage,
    home_score: m.score.fullTime.home,
    away_score: m.score.fullTime.away,
    status: mapStatus(m.status),
  }))

  const { error } = await admin.from('matches').upsert(upsertData, { onConflict: 'external_id' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, synced: upsertData.length })
}
