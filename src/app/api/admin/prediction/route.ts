import { NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { recalcTotalPoints } from '@/lib/scoring'

function calcPoints(
  predHome: number, predAway: number,
  realHome: number, realAway: number,
  pts: { result: number; score: number; draw: number; diff: number }
): number {
  if (predHome === realHome && predAway === realAway) return pts.score

  const predResult = predHome > predAway ? 'H' : predHome < predAway ? 'A' : 'D'
  const realResult = realHome > realAway ? 'H' : realHome < realAway ? 'A' : 'D'

  if (realResult === 'D' && predResult === 'D') return pts.draw

  if (realResult !== 'D' && predResult === realResult) {
    if (Math.abs(predHome - predAway) === Math.abs(realHome - realAway)) return pts.diff
    return pts.result
  }

  return 0
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { userId, matchId, bolaoId, homeScore, awayScore } = await request.json()

  const { data: bolao } = await supabase.from('boloes').select('*').eq('id', bolaoId).single()
  if (!bolao || bolao.owner_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: match } = await admin.from('matches').select('*').eq('id', matchId).single()

  let points: number | null = null
  if (match?.status === 'FINISHED' && match.home_score !== null && match.away_score !== null) {
    points = calcPoints(homeScore, awayScore, match.home_score, match.away_score, {
      result: bolao.scoring_correct_result,
      score: bolao.scoring_correct_score,
      draw: bolao.scoring_draw,
      diff: bolao.scoring_correct_diff,
    })
  }

  const { error } = await admin.from('predictions').upsert({
    user_id: userId,
    match_id: matchId,
    bolao_id: bolaoId,
    home_score: homeScore,
    away_score: awayScore,
    points,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id,match_id,bolao_id' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await recalcTotalPoints(admin, bolaoId, userId)

  return NextResponse.json({ ok: true, points })
}
