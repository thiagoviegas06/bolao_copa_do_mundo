'use client'

import { useState } from 'react'
import { Match, RankingEntry, Prediction } from '@/types/database'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Settings, Users, RefreshCw } from 'lucide-react'

interface Props {
  matches: Match[]
  ranking: RankingEntry[]
  bolaoId: string
}

const STAGE_LABELS: Record<string, string> = {
  GROUP_STAGE: 'Grupos',
  ROUND_OF_16: 'Oitavas',
  QUARTER_FINALS: 'Quartas',
  SEMI_FINALS: 'Semi',
  FINAL: 'Final',
  THIRD_PLACE: '3º Lugar',
}

const STATUS_OPTIONS = ['SCHEDULED', 'LIVE', 'FINISHED', 'POSTPONED']

type MatchEdit = { home: string; away: string; status: string }
type PredEdit = { home: string; away: string }

export default function AdminPanel({ matches, ranking, bolaoId }: Props) {
  const [matchEdits, setMatchEdits] = useState<Record<string, MatchEdit>>(
    Object.fromEntries(matches.map((m) => [m.id, {
      home: m.home_score?.toString() ?? '',
      away: m.away_score?.toString() ?? '',
      status: m.status,
    }]))
  )
  const [matchSaving, setMatchSaving] = useState<Record<string, boolean>>({})
  const [matchSaved, setMatchSaved] = useState<Record<string, boolean>>({})
  const [matchError, setMatchError] = useState<Record<string, string>>({})

  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  const [selectedUserId, setSelectedUserId] = useState('')
  const [predByMatch, setPredByMatch] = useState<Record<string, Prediction>>({})
  const [loadingPreds, setLoadingPreds] = useState(false)
  const [predEdits, setPredEdits] = useState<Record<string, PredEdit>>({})
  const [predSaving, setPredSaving] = useState<Record<string, boolean>>({})
  const [predSaved, setPredSaved] = useState<Record<string, boolean>>({})
  const [predError, setPredError] = useState<Record<string, string>>({})

  const matchMap = Object.fromEntries(matches.map((m) => [m.id, m]))

  async function triggerSync() {
    setSyncing(true)
    setSyncMsg('')
    const res = await fetch('/api/admin/sync', { method: 'POST' })
    const data = await res.json()
    setSyncing(false)
    setSyncMsg(res.ok ? `✓ ${data.synced} jogos atualizados` : `Erro: ${data.error}`)
    setTimeout(() => setSyncMsg(''), 5000)
  }

  async function saveMatchResult(matchId: string) {
    const edit = matchEdits[matchId]
    setMatchSaving((s) => ({ ...s, [matchId]: true }))
    setMatchError((e) => ({ ...e, [matchId]: '' }))

    const res = await fetch('/api/admin/match-result', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        matchId,
        bolaoId,
        homeScore: edit.home !== '' ? parseInt(edit.home) : null,
        awayScore: edit.away !== '' ? parseInt(edit.away) : null,
        status: edit.status,
      }),
    })

    setMatchSaving((s) => ({ ...s, [matchId]: false }))
    if (res.ok) {
      setMatchSaved((s) => ({ ...s, [matchId]: true }))
      setTimeout(() => setMatchSaved((s) => ({ ...s, [matchId]: false })), 2000)
    } else {
      const data = await res.json()
      setMatchError((e) => ({ ...e, [matchId]: data.error ?? 'Erro ao salvar' }))
    }
  }

  async function loadUserPredictions(userId: string) {
    setSelectedUserId(userId)
    setPredByMatch({})
    setPredEdits({})
    if (!userId) return

    setLoadingPreds(true)
    const res = await fetch(`/api/admin/predictions?bolaoId=${bolaoId}&userId=${userId}`)
    setLoadingPreds(false)

    const preds: Prediction[] = res.ok ? await res.json() : []
    const byMatch = Object.fromEntries(preds.map((p) => [p.match_id, p]))
    setPredByMatch(byMatch)
    setPredEdits(
      Object.fromEntries(matches.map((m) => [m.id, {
        home: byMatch[m.id]?.home_score?.toString() ?? '',
        away: byMatch[m.id]?.away_score?.toString() ?? '',
      }]))
    )
  }

  async function savePrediction(matchId: string) {
    const edit = predEdits[matchId]
    setPredSaving((s) => ({ ...s, [matchId]: true }))
    setPredError((e) => ({ ...e, [matchId]: '' }))

    const res = await fetch('/api/admin/prediction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: selectedUserId,
        matchId,
        bolaoId,
        homeScore: parseInt(edit.home),
        awayScore: parseInt(edit.away),
      }),
    })

    setPredSaving((s) => ({ ...s, [matchId]: false }))
    if (res.ok) {
      const { points } = await res.json()
      setPredByMatch((prev) => ({
        ...prev,
        [matchId]: {
          ...(prev[matchId] ?? { user_id: selectedUserId, match_id: matchId, bolao_id: bolaoId }),
          home_score: parseInt(edit.home),
          away_score: parseInt(edit.away),
          points,
        } as Prediction,
      }))
      setPredSaved((s) => ({ ...s, [matchId]: true }))
      setTimeout(() => setPredSaved((s) => ({ ...s, [matchId]: false })), 2000)
    } else {
      const data = await res.json()
      setPredError((e) => ({ ...e, [matchId]: data.error ?? 'Erro ao salvar' }))
    }
  }

  return (
    <div className="space-y-10">
      {/* Sync */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="sm"
          disabled={syncing}
          onClick={triggerSync}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar resultados agora'}
        </Button>
        {syncMsg && <span className="text-sm text-gray-600">{syncMsg}</span>}
      </div>

      {/* Match Results */}
      <div>
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Resultados dos Jogos
        </h2>
        <div className="space-y-2">
          {matches.map((m) => {
            const edit = matchEdits[m.id]
            return (
              <div key={m.id} className="bg-white border rounded-xl p-3 flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">
                    {m.home_team} vs {m.away_team}
                  </div>
                  <div className="text-xs text-gray-400">
                    {new Date(m.match_date).toLocaleDateString('pt-BR', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                    })} · {STAGE_LABELS[m.stage] ?? m.stage}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="number" min={0} max={99}
                    value={edit.home}
                    onChange={(e) => setMatchEdits((s) => ({ ...s, [m.id]: { ...s[m.id], home: e.target.value } }))}
                    className="w-10 text-center p-1 text-sm"
                    placeholder="?"
                  />
                  <span className="text-gray-400 font-bold text-sm">:</span>
                  <Input
                    type="number" min={0} max={99}
                    value={edit.away}
                    onChange={(e) => setMatchEdits((s) => ({ ...s, [m.id]: { ...s[m.id], away: e.target.value } }))}
                    className="w-10 text-center p-1 text-sm"
                    placeholder="?"
                  />
                </div>
                <select
                  value={edit.status}
                  onChange={(e) => setMatchEdits((s) => ({ ...s, [m.id]: { ...s[m.id], status: e.target.value } }))}
                  className="text-xs border rounded-lg px-2 py-1.5 bg-white text-gray-700"
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={matchSaving[m.id]}
                  onClick={() => saveMatchResult(m.id)}
                  className="text-xs"
                >
                  {matchSaved[m.id] ? (
                    <><CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />Salvo</>
                  ) : matchSaving[m.id] ? 'Salvando...' : 'Salvar'}
                </Button>
                {matchError[m.id] && (
                  <span className="text-xs text-red-500 w-full">{matchError[m.id]}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* User Predictions */}
      <div>
        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          Palpites dos Participantes
        </h2>
        <select
          value={selectedUserId}
          onChange={(e) => loadUserPredictions(e.target.value)}
          className="text-sm border rounded-lg px-3 py-2 bg-white text-gray-700 w-full max-w-xs mb-4"
        >
          <option value="">Selecione um participante...</option>
          {ranking.map((r) => (
            <option key={r.user_id} value={r.user_id}>
              {r.full_name ?? r.username} ({r.total_points} pts)
            </option>
          ))}
        </select>

        {loadingPreds && (
          <div className="text-sm text-gray-400 py-4 text-center">Carregando palpites...</div>
        )}

        {selectedUserId && !loadingPreds && (
          <div className="space-y-6">
            {matches.map((match) => {
              const existing = predByMatch[match.id]
              const edit = predEdits[match.id]
              if (!edit) return null
              const hasPred = existing !== undefined

              return (
                <div
                  key={match.id}
                  className={`bg-white border rounded-xl p-3 flex flex-wrap items-center gap-3 ${!hasPred ? 'border-dashed border-orange-200' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">
                      {match.home_team} vs {match.away_team}
                    </div>
                    <div className="text-xs text-gray-400 flex items-center gap-1.5">
                      {new Date(match.match_date).toLocaleDateString('pt-BR', {
                        day: '2-digit', month: 'short',
                      })}
                      {!hasPred && (
                        <span className="text-orange-500 font-medium">sem palpite</span>
                      )}
                      {existing?.points !== null && existing?.points !== undefined && (
                        <Badge variant="secondary" className="text-xs">{existing.points} pts</Badge>
                      )}
                      {match.status === 'FINISHED' && match.home_score !== null && (
                        <span>(resultado: {match.home_score}:{match.away_score})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number" min={0} max={99}
                      value={edit.home}
                      onChange={(e) => setPredEdits((s) => ({ ...s, [match.id]: { ...s[match.id], home: e.target.value } }))}
                      className="w-10 text-center p-1 text-sm"
                      placeholder="?"
                    />
                    <span className="text-gray-400 font-bold text-sm">:</span>
                    <Input
                      type="number" min={0} max={99}
                      value={edit.away}
                      onChange={(e) => setPredEdits((s) => ({ ...s, [match.id]: { ...s[match.id], away: e.target.value } }))}
                      className="w-10 text-center p-1 text-sm"
                      placeholder="?"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={hasPred ? 'outline' : 'default'}
                    disabled={predSaving[match.id] || edit.home === '' || edit.away === ''}
                    onClick={() => savePrediction(match.id)}
                    className={`text-xs ${!hasPred ? 'bg-orange-500 hover:bg-orange-600 border-orange-500' : ''}`}
                  >
                    {predSaved[match.id] ? (
                      <><CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />Salvo</>
                    ) : predSaving[match.id] ? 'Salvando...' : hasPred ? 'Salvar' : 'Adicionar'}
                  </Button>
                  {predError[match.id] && (
                    <span className="text-xs text-red-500 w-full">{predError[match.id]}</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
