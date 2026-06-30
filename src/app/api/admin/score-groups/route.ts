import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { recalcTotalPoints } from '@/lib/scoring'

const COMPETITION_ID = 2000
const POINTS_GROUP_WINNER = 2

// Mapeia nomes da API para os nomes usados em copa2026.ts
const API_TO_LOCAL: Record<string, string> = {
  'Korea Republic': 'South Korea',
  'Czech Republic': 'Czechia',
  'Czechia': 'Czechia',
  'United States': 'United States',
  'USA': 'United States',
  'Turkey': 'Türkiye',
  "Côte d'Ivoire": 'Ivory Coast',
  'Bosnia-Herzegovina': 'Bosnia and Herzegovina',
  'Brasil': 'Brazil',
  'México': 'Mexico',
}

function normalize(name: string): string {
  return API_TO_LOCAL[name] ?? name
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { bolaoId } = await request.json()

  const { data: bolao } = await supabase.from('boloes').select('owner_id').eq('id', bolaoId).single()
  if (!bolao || bolao.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'FOOTBALL_API_KEY não configurada' }, { status: 500 })

  const res = await fetch(
    `${process.env.FOOTBALL_API_BASE}/competitions/${COMPETITION_ID}/standings`,
    { headers: { 'X-Auth-Token': apiKey }, cache: 'no-store' }
  )
  if (!res.ok) return NextResponse.json({ error: `API error ${res.status}` }, { status: 502 })

  const { standings } = await res.json()

  // standings.group é "GROUP_A", "GROUP_B", etc.
  const groupWinners: Record<string, string> = {}
  for (const s of (standings ?? [])) {
    if (s.type !== 'TOTAL' || !s.group || !s.table?.length) continue
    const letter = (s.group as string).replace('GROUP_', '')
    const teamName = normalize(s.table[0].team.shortName || s.table[0].team.name)
    groupWinners[letter] = teamName
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: preds, error: predsErr } = await admin
    .from('group_predictions')
    .select('id, user_id, group_name, first_place')
    .eq('bolao_id', bolaoId)

  if (predsErr) return NextResponse.json({ error: predsErr.message }, { status: 500 })

  let scoredCount = 0
  const updates = (preds ?? []).map((p) => {
    const actual = groupWinners[p.group_name]
    const points = actual !== undefined
      ? (p.first_place === actual ? POINTS_GROUP_WINNER : 0)
      : null
    if (points === POINTS_GROUP_WINNER) scoredCount++
    return { id: p.id, points }
  }).filter((u) => u.points !== null)

  for (const { id, points } of updates) {
    await admin.from('group_predictions').update({ points }).eq('id', id)
  }

  // Recalcula total_points de todos os membros
  const { data: members } = await admin
    .from('bolao_members')
    .select('user_id')
    .eq('bolao_id', bolaoId)

  await Promise.all((members ?? []).map((m) => recalcTotalPoints(admin, bolaoId, m.user_id)))

  return NextResponse.json({ ok: true, groupWinners, scoredCount, total: updates.length })
}
