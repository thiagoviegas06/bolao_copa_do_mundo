'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MatchWithPrediction } from '@/types/database'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Clock, Trophy, Lock } from 'lucide-react'

interface Props {
  matches: MatchWithPrediction[]
  bolaoId: string
  userId: string
  scoringResult: number
  scoringScore: number
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Fase de Grupos',
  ROUND_OF_16: 'Oitavas de Final',
  QUARTER_FINALS: 'Quartas de Final',
  SEMI_FINALS: 'Semifinal',
  FINAL: 'Final',
  THIRD_PLACE: '3º Lugar',
}

function formatStage(stage: string) {
  return STAGE_LABELS[stage] ?? stage
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
  })
}

function dateKey(match_date: string) {
  return new Date(match_date).toLocaleDateString('pt-BR', {
    weekday: 'long', day: '2-digit', month: 'long'
  })
}

function groupByDate(matches: MatchWithPrediction[]) {
  const groups: Record<string, MatchWithPrediction[]> = {}
  matches.forEach((m) => {
    const key = dateKey(m.match_date)
    if (!groups[key]) groups[key] = []
    groups[key].push(m)
  })
  return groups
}

function earliestByDate(matches: MatchWithPrediction[]): Record<string, Date> {
  const map: Record<string, Date> = {}
  matches.forEach((m) => {
    const key = dateKey(m.match_date)
    const d = new Date(m.match_date)
    if (!map[key] || d < map[key]) map[key] = d
  })
  return map
}

export default function MatchesList({ matches, bolaoId, userId, scoringResult, scoringScore }: Props) {
  const [predictions, setPredictions] = useState<Record<string, { home: string; away: string }>>(
    Object.fromEntries(
      matches.map((m) => [
        m.id,
        {
          home: m.prediction?.home_score?.toString() ?? '',
          away: m.prediction?.away_score?.toString() ?? '',
        },
      ])
    )
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  const grouped = groupByDate(matches)
  const lockByDate = earliestByDate(matches)
  const now = new Date()

  async function savePrediction(matchId: string) {
    const pred = predictions[matchId]
    if (pred.home === '' || pred.away === '') return
    setSaving((s) => ({ ...s, [matchId]: true }))

    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      const supabase = createClient()
      await supabase.from('predictions').upsert(
        {
          user_id: userId,
          match_id: matchId,
          bolao_id: bolaoId,
          home_score: parseInt(pred.home),
          away_score: parseInt(pred.away),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,match_id,bolao_id' }
      )
    }

    setSaving((s) => ({ ...s, [matchId]: false }))
    setSaved((s) => ({ ...s, [matchId]: true }))
    setTimeout(() => setSaved((s) => ({ ...s, [matchId]: false })), 2000)
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum jogo cadastrado ainda.</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {Object.entries(grouped).map(([date, dayMatches]) => {
        const isLocked = lockByDate[date] <= now
        return (
        <div key={date}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3 capitalize">
            {date}
          </h3>
          <div className="space-y-3">
            {dayMatches.map((match) => {
              const pred = predictions[match.id]
              const hasResult = match.status === 'FINISHED' && match.home_score !== null

              let pointsBadge = null
              if (hasResult && match.prediction) {
                const pts = match.prediction.points
                if (pts === scoringScore) pointsBadge = <Badge className="bg-yellow-500 text-black">+{pts} Placar!</Badge>
                else if (pts === scoringResult) pointsBadge = <Badge className="bg-green-600">+{pts} Resultado</Badge>
                else if (pts === 0) pointsBadge = <Badge variant="secondary">0 pts</Badge>
              }

              return (
                <div
                  key={match.id}
                  className={`bg-white rounded-xl border p-4 ${isLocked ? 'opacity-80' : ''}`}
                >
                  <div className="flex items-center justify-between gap-4">
                    {/* Home team */}
                    <div className="flex-1 text-right flex items-center justify-end gap-2">
                      <span className="font-semibold text-gray-800">{match.home_team}</span>
                      {match.home_team_flag && (
                        <img src={match.home_team_flag} alt={match.home_team} className="w-6 h-6 object-contain" />
                      )}
                    </div>

                    {/* Score / Prediction */}
                    <div className="flex items-center gap-2">
                      {hasResult ? (
                        <div className="flex items-center gap-1 text-lg font-bold">
                          <span className="w-8 text-center text-gray-800">{match.home_score}</span>
                          <span className="text-gray-400">:</span>
                          <span className="w-8 text-center text-gray-800">{match.away_score}</span>
                        </div>
                      ) : isLocked ? (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          <Lock className="w-3 h-3" />
                          <span>{pred.home || '?'} : {pred.away || '?'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            min={0}
                            max={99}
                            value={pred.home}
                            onChange={(e) =>
                              setPredictions((p) => ({
                                ...p,
                                [match.id]: { ...p[match.id], home: e.target.value },
                              }))
                            }
                            className="w-12 text-center font-bold p-1"
                            placeholder="?"
                          />
                          <span className="text-gray-400 font-bold">:</span>
                          <Input
                            type="number"
                            min={0}
                            max={99}
                            value={pred.away}
                            onChange={(e) =>
                              setPredictions((p) => ({
                                ...p,
                                [match.id]: { ...p[match.id], away: e.target.value },
                              }))
                            }
                            className="w-12 text-center font-bold p-1"
                            placeholder="?"
                          />
                        </div>
                      )}
                    </div>

                    {/* Away team */}
                    <div className="flex-1 text-left flex items-center gap-2">
                      {match.away_team_flag && (
                        <img src={match.away_team_flag} alt={match.away_team} className="w-6 h-6 object-contain" />
                      )}
                      <span className="font-semibold text-gray-800">{match.away_team}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatDate(match.match_date)}
                      <Badge variant="outline" className="text-xs">{formatStage(match.stage)}</Badge>
                      {match.status === 'LIVE' && (
                        <Badge className="bg-red-500 text-white animate-pulse">AO VIVO</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {pointsBadge}
                      {!isLocked && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving[match.id] || pred.home === '' || pred.away === ''}
                          onClick={() => savePrediction(match.id)}
                          className="text-xs"
                        >
                          {saved[match.id] ? (
                            <><CheckCircle2 className="w-3 h-3 mr-1 text-green-600" /> Salvo!</>
                          ) : saving[match.id] ? 'Salvando...' : 'Salvar palpite'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )
      })}
    </div>
  )
}
