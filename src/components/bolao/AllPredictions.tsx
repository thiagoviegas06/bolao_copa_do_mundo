'use client'

import { useState } from 'react'
import { Prediction, Match, RankingEntry, TournamentPrediction } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Clock, Trophy, Zap } from 'lucide-react'

interface Props {
  allPredictions: Prediction[]
  allTournamentPredictions: TournamentPrediction[]
  matches: Match[]
  ranking: RankingEntry[]
  currentUserId: string
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_16: 'Oitavas de Final',
  QUARTER_FINALS: 'Quartas de Final',
  SEMI_FINALS: 'Semifinal',
  FINAL: 'Final',
  THIRD_PLACE: '3º Lugar',
}

function dateKey(match_date: string) {
  return new Date(match_date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long',
  })
}

function groupByDate(matches: Match[]) {
  const groups: Record<string, Match[]> = {}
  matches.forEach((m) => {
    const key = dateKey(m.match_date)
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return groups
}

export default function AllPredictions({ allPredictions, allTournamentPredictions, matches, ranking, currentUserId }: Props) {
  const [selectedUserId, setSelectedUserId] = useState(currentUserId)

  const grouped = groupByDate(matches)
  const predMap = new Map(
    allPredictions
      .filter((p) => p.user_id === selectedUserId)
      .map((p) => [p.match_id, p])
  )
  const tournamentPred = allTournamentPredictions.find((t) => t.user_id === selectedUserId) ?? null

  const selectedUser = ranking.find((r) => r.user_id === selectedUserId)
  const predictedCount = allPredictions.filter((p) => p.user_id === selectedUserId).length

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum jogo cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User selector */}
      <div className="flex flex-wrap gap-2">
        {ranking.map((r) => (
          <button
            key={r.user_id}
            type="button"
            onClick={() => setSelectedUserId(r.user_id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              r.user_id === selectedUserId
                ? 'bg-green-700 text-white border-green-700'
                : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
            }`}
          >
            {r.full_name ?? r.username}
            {r.user_id === currentUserId && (
              <span className={`text-xs ${r.user_id === selectedUserId ? 'text-green-200' : 'text-gray-400'}`}>
                (você)
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Summary bar */}
      {selectedUser && (
        <div className="flex items-center gap-3 text-sm text-gray-500">
          <span className="font-medium text-gray-700">{selectedUser.full_name ?? selectedUser.username}</span>
          <span>·</span>
          <span>{predictedCount} palpite{predictedCount !== 1 ? 's' : ''}</span>
          <span>·</span>
          <span className="font-bold text-green-700">{selectedUser.total_points} pts</span>
        </div>
      )}

      {/* Tournament prediction card */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-yellow-500" />
          Palpites de Torneio
        </h4>
        {tournamentPred ? (
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-xs text-gray-400 mb-0.5">Campeão</p>
              <p className="text-sm font-medium text-gray-800">{tournamentPred.champion ?? <span className="text-gray-300 italic">não preenchido</span>}</p>
              {tournamentPred.champion_points !== null && (
                <Badge className={tournamentPred.champion_points > 0 ? 'bg-green-600 text-white mt-1' : 'bg-gray-100 text-gray-500 mt-1'}>
                  {tournamentPred.champion_points > 0 ? `+${tournamentPred.champion_points}` : '0'} pts
                </Badge>
              )}
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Zap className="w-3 h-3 text-orange-400" />Artilheiro</p>
              <p className="text-sm font-medium text-gray-800">{tournamentPred.top_scorer ?? <span className="text-gray-300 italic">não preenchido</span>}</p>
              {tournamentPred.top_scorer_points !== null && (
                <Badge className={tournamentPred.top_scorer_points > 0 ? 'bg-green-600 text-white mt-1' : 'bg-gray-100 text-gray-500 mt-1'}>
                  {tournamentPred.top_scorer_points > 0 ? `+${tournamentPred.top_scorer_points}` : '0'} pts
                </Badge>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic">Sem palpites de torneio.</p>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <span className="font-bold text-gray-600">Palpite</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="text-gray-400">resultado real</span>
        </span>
      </div>

      {/* Matches by day */}
      <div className="space-y-8">
        {Object.entries(grouped).map(([date, dayMatches]) => (
          <div key={date}>
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 capitalize">
              {date}
            </h3>
            <div className="space-y-2">
              {dayMatches.map((match) => {
                const pred = predMap.get(match.id)
                const hasResult = match.status === 'FINISHED' && match.home_score !== null

                let pointsBadge = null
                if (hasResult && pred) {
                  const pts = pred.points
                  if (pts === null || pts === undefined) pointsBadge = null
                  else if (pts === 0) pointsBadge = <Badge variant="secondary" className="text-xs shrink-0">0 pts</Badge>
                  else pointsBadge = <Badge className="bg-green-600 text-white text-xs shrink-0">+{pts} pts</Badge>
                }

                return (
                  <div
                    key={match.id}
                    className={`bg-white rounded-xl border p-3 ${!pred ? 'opacity-60' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {/* Home */}
                      <div className="flex-1 flex items-center justify-end gap-1.5 min-w-0">
                        <span className="text-sm font-semibold text-gray-800 truncate">{match.home_team}</span>
                        {match.home_team_flag && (
                          <img src={match.home_team_flag} alt={match.home_team} className="w-5 h-5 object-contain shrink-0" />
                        )}
                      </div>

                      {/* Scores column */}
                      <div className="flex flex-col items-center w-24 shrink-0">
                        {pred ? (
                          <div className="flex items-center gap-1 text-sm font-bold text-gray-800">
                            <span className="w-6 text-center">{pred.home_score}</span>
                            <span className="text-gray-400">:</span>
                            <span className="w-6 text-center">{pred.away_score}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-300 italic">sem palpite</span>
                        )}
                        {hasResult && (
                          <div className="flex items-center gap-1 text-xs text-gray-400 mt-0.5">
                            <span className="w-6 text-center">{match.home_score}</span>
                            <span>:</span>
                            <span className="w-6 text-center">{match.away_score}</span>
                          </div>
                        )}
                      </div>

                      {/* Away */}
                      <div className="flex-1 flex items-center gap-1.5 min-w-0">
                        {match.away_team_flag && (
                          <img src={match.away_team_flag} alt={match.away_team} className="w-5 h-5 object-contain shrink-0" />
                        )}
                        <span className="text-sm font-semibold text-gray-800 truncate">{match.away_team}</span>
                      </div>

                      {/* Points */}
                      <div className="w-16 text-right shrink-0">
                        {pointsBadge}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1.5 ml-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {new Date(match.match_date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      <Badge variant="outline" className="text-xs">{STAGE_LABELS[match.stage] ?? match.stage}</Badge>
                      {match.status === 'LIVE' && (
                        <Badge className="bg-red-500 text-white text-xs animate-pulse">AO VIVO</Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
