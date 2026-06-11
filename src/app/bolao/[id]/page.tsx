import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Trophy, ArrowLeft } from 'lucide-react'
import MatchesList from '@/components/bolao/MatchesList'
import RankingTable from '@/components/bolao/RankingTable'
import TournamentPredictions from '@/components/bolao/TournamentPredictions'
import CopyInviteButton from '@/components/bolao/CopyInviteButton'
import AdminPanel from '@/components/bolao/AdminPanel'
import AllPredictions from '@/components/bolao/AllPredictions'
import GroupWinnerPredictions from '@/components/bolao/GroupWinnerPredictions'
import {
  IS_DEV_MODE, MOCK_USER, MOCK_BOLOES, MOCK_MATCHES,
  MOCK_PREDICTIONS, MOCK_RANKING, MOCK_TOURNAMENT_PREDICTION,
} from '@/lib/dev-data'
import { RankingEntry, Prediction, GroupPrediction } from '@/types/database'

interface Props {
  params: Promise<{ id: string }>
}

const TOURNAMENT_LOCK_DATE = new Date('2026-06-12T03:00:00Z') // meia-noite dia 11 (horário Brasília)

async function getData(id: string) {
  if (IS_DEV_MODE) {
    const bolao = MOCK_BOLOES.find((b) => b.id === id) ?? MOCK_BOLOES[0]
    const myPreds = MOCK_PREDICTIONS.filter((p) => p.bolao_id === bolao.id && p.user_id === MOCK_USER.id)
    const predMap = new Map(myPreds.map((p) => [p.match_id, p]))
    return {
      user: MOCK_USER,
      bolao,
      matchesWithPredictions: MOCK_MATCHES.map((m) => ({ ...m, prediction: predMap.get(m.id) ?? null })),
      allPredictions: MOCK_PREDICTIONS.filter((p) => p.bolao_id === bolao.id) as Prediction[],
      allTournamentPredictions: MOCK_TOURNAMENT_PREDICTION ? [MOCK_TOURNAMENT_PREDICTION] : [],
      tournamentPrediction: MOCK_TOURNAMENT_PREDICTION,
      groupPredictions: [] as GroupPrediction[],
      ranking: MOCK_RANKING as RankingEntry[],
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: bolao } = await supabase.from('boloes').select('*').eq('id', id).single()
  if (!bolao) return 'not_found' as const

  const { data: membership } = await supabase
    .from('bolao_members').select('*').eq('bolao_id', id).eq('user_id', user.id).single()
  if (!membership) return 'not_member' as const

  const [
    { data: matches },
    { data: allPredictions },
    { data: rankingMembers },
    { data: allTournamentPredictions },
    { data: groupPredictions },
  ] = await Promise.all([
    supabase.from('matches').select('*').order('match_date', { ascending: true }),
    supabase.from('predictions').select('*').eq('bolao_id', id),
    supabase.from('bolao_members').select('user_id, total_points').eq('bolao_id', id).order('total_points', { ascending: false }),
    supabase.from('tournament_predictions').select('*').eq('bolao_id', id),
    supabase.from('group_predictions').select('*').eq('bolao_id', id).eq('user_id', user.id),
  ])

  const memberUserIds = (rankingMembers ?? []).map((m) => m.user_id)
  const { data: memberProfiles } = memberUserIds.length
    ? await supabase.from('profiles').select('id, username, full_name').in('id', memberUserIds)
    : { data: [] }

  const profileMap = Object.fromEntries((memberProfiles ?? []).map((p) => [p.id, p]))
  const myPreds = (allPredictions ?? []).filter((p) => p.user_id === user.id)
  const predMap = new Map(myPreds.map((p) => [p.match_id, p]))

  return {
    user,
    bolao,
    matchesWithPredictions: (matches ?? []).map((m) => ({ ...m, prediction: predMap.get(m.id) ?? null })),
    allPredictions: (allPredictions ?? []) as Prediction[],
    allTournamentPredictions: (allTournamentPredictions ?? []),
    tournamentPrediction: (allTournamentPredictions ?? []).find((t) => t.user_id === user.id) ?? null,
    groupPredictions: (groupPredictions ?? []) as GroupPrediction[],
    ranking: (rankingMembers ?? []).map((r, idx) => {
      const profile = profileMap[r.user_id]
      return {
        user_id: r.user_id,
        username: profile?.username ?? 'usuario',
        full_name: profile?.full_name ?? null,
        total_points: r.total_points,
        rank: idx + 1,
      }
    }) as RankingEntry[],
  }
}

export default async function BolaoPage({ params }: Props) {
  const { id } = await params
  const data = await getData(id)

  if (!data) redirect('/login')
  if (data === 'not_found') notFound()
  if (data === 'not_member') redirect('/dashboard')

  const { user, bolao, matchesWithPredictions, allPredictions, allTournamentPredictions, groupPredictions, ranking, tournamentPrediction } = data
  const now = new Date()
  const tournamentLocked = now >= TOURNAMENT_LOCK_DATE
  const isOwner = bolao.owner_id === user.id

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white shadow">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/dashboard" className="text-green-300 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="flex items-center gap-2 font-bold text-xl">
              <Trophy className="w-6 h-6 text-yellow-400" />
              {bolao.name}
            </div>
            {bolao.owner_id === user.id && <Badge className="bg-yellow-500 text-black">Admin</Badge>}
            {IS_DEV_MODE && <Badge className="bg-orange-500 text-white text-xs">DEV</Badge>}
          </div>
          <div className="flex items-center gap-3 ml-8 text-sm text-green-200">
            {bolao.description && <span>{bolao.description}</span>}
            <CopyInviteButton inviteCode={bolao.invite_code} />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="jogos">
          <TabsList className="mb-6 flex w-full">
            <TabsTrigger value="torneio" className="flex-1">Torneio</TabsTrigger>
            <TabsTrigger value="jogos" className="flex-1">Jogos</TabsTrigger>
            <TabsTrigger value="palpites" className="flex-1">Palpites</TabsTrigger>
            <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
            {isOwner && <TabsTrigger value="admin" className="flex-1">Admin</TabsTrigger>}
          </TabsList>

          <TabsContent value="torneio">
            <TournamentPredictions
              bolao={bolao}
              userId={user.id}
              existing={tournamentPrediction}
              locked={tournamentLocked}
            />
            <GroupWinnerPredictions
              bolaoId={bolao.id}
              userId={user.id}
              existingPredictions={groupPredictions}
              locked={tournamentLocked}
            />
          </TabsContent>

          <TabsContent value="jogos">
            <MatchesList
              matches={matchesWithPredictions}
              bolaoId={bolao.id}
              userId={user.id}
              scoringResult={bolao.scoring_correct_result}
              scoringScore={bolao.scoring_correct_score}
            />
          </TabsContent>

          <TabsContent value="palpites">
            <AllPredictions
              allPredictions={allPredictions}
              allTournamentPredictions={allTournamentPredictions}
              matches={matchesWithPredictions}
              ranking={ranking}
              currentUserId={user.id}
              tournamentLocked={tournamentLocked}
            />
          </TabsContent>

          <TabsContent value="ranking">
            <RankingTable ranking={ranking} currentUserId={user.id} />
          </TabsContent>

          {isOwner && (
            <TabsContent value="admin">
              <AdminPanel
                matches={matchesWithPredictions}
                ranking={ranking}
                bolaoId={bolao.id}
              />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  )
}
