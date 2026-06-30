import { SupabaseClient } from '@supabase/supabase-js'

export async function recalcTotalPoints(admin: SupabaseClient, bolaoId: string, userId: string) {
  const [matchRes, groupRes, tourRes] = await Promise.all([
    admin.from('predictions').select('points').eq('bolao_id', bolaoId).eq('user_id', userId),
    admin.from('group_predictions').select('points').eq('bolao_id', bolaoId).eq('user_id', userId),
    admin.from('tournament_predictions').select('champion_points, top_scorer_points').eq('bolao_id', bolaoId).eq('user_id', userId),
  ])

  const matchPts = (matchRes.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0)
  const groupPts = (groupRes.data ?? []).reduce((s, p) => s + (p.points ?? 0), 0)
  const tourPts = (tourRes.data ?? []).reduce((s, p) => s + (p.champion_points ?? 0) + (p.top_scorer_points ?? 0), 0)

  await admin.from('bolao_members')
    .update({ total_points: matchPts + groupPts + tourPts })
    .eq('bolao_id', bolaoId)
    .eq('user_id', userId)
}
