'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TournamentPrediction, Bolao } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Trophy, Zap, Lock, Info } from 'lucide-react'
import { ALL_TEAMS, SUGGESTED_TOP_SCORERS } from '@/lib/copa2026'

interface Props {
  bolao: Bolao
  userId: string
  existing: TournamentPrediction | null
  locked: boolean
}

export default function TournamentPredictions({ bolao, userId, existing, locked }: Props) {
  const [champion, setChampion] = useState(existing?.champion ?? '')
  const [topScorer, setTopScorer] = useState(existing?.top_scorer ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [scorerInput, setScorerInput] = useState(existing?.top_scorer ?? '')
  const [scorerSuggestions, setScorerSuggestions] = useState<string[]>([])

  function onScorerChange(val: string) {
    setScorerInput(val)
    setTopScorer(val)
    if (val.length > 1) {
      setScorerSuggestions(
        SUGGESTED_TOP_SCORERS.filter((s) => s.toLowerCase().includes(val.toLowerCase())).slice(0, 4)
      )
    } else {
      setScorerSuggestions([])
    }
  }

  async function handleSave() {
    if (!champion || !topScorer) return
    setSaving(true)

    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      const supabase = createClient()
      await supabase.from('tournament_predictions').upsert(
        {
          user_id: userId,
          bolao_id: bolao.id,
          champion,
          top_scorer: topScorer,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,bolao_id' }
      )
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const hasExisting = !!existing?.champion

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-start gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <Info className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
        <div className="text-sm text-yellow-700">
          <p className="font-medium mb-1">Palpites únicos de torneio</p>
          <p className="text-xs">Esses palpites só podem ser feitos antes do torneio começar. Se acertar, você ganha pontos bônus no final!</p>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
          <Lock className="w-4 h-4" />
          O torneio já começou — palpites bloqueados.
        </div>
      )}

      {/* Campeão */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold">Campeão</h3>
          </div>
          <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-300">
            +{bolao.scoring_champion} pts
          </Badge>
        </div>
        <Label className="text-xs text-gray-500">Qual seleção vai vencer a Copa do Mundo 2026?</Label>
        {locked ? (
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            {champion || <span className="text-gray-400 italic">Não preenchido</span>}
            {existing?.champion_points != null && (
              <Badge className={existing.champion_points > 0 ? 'bg-green-600' : 'bg-gray-200 text-gray-500'}>
                {existing.champion_points > 0 ? `+${existing.champion_points} pts` : '0 pts'}
              </Badge>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {ALL_TEAMS.map((team) => (
              <button
                key={team}
                type="button"
                onClick={() => setChampion(team)}
                className={`text-xs px-2 py-1.5 rounded-lg border text-left transition-all ${
                  champion === team
                    ? 'bg-green-700 text-white border-green-700 font-bold'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                }`}
              >
                {team}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Artilheiro */}
      <div className="bg-white rounded-xl border p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold">Artilheiro</h3>
          </div>
          <Badge className="bg-orange-100 text-orange-700 border border-orange-300">
            +{bolao.scoring_top_scorer} pts
          </Badge>
        </div>
        <Label className="text-xs text-gray-500">Qual jogador vai terminar como artilheiro da Copa?</Label>
        {locked ? (
          <div className="flex items-center gap-2 text-gray-700 font-medium">
            {topScorer || <span className="text-gray-400 italic">Não preenchido</span>}
            {existing?.top_scorer_points != null && (
              <Badge className={existing.top_scorer_points > 0 ? 'bg-green-600' : 'bg-gray-200 text-gray-500'}>
                {existing.top_scorer_points > 0 ? `+${existing.top_scorer_points} pts` : '0 pts'}
              </Badge>
            )}
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={scorerInput}
              onChange={(e) => onScorerChange(e.target.value)}
              placeholder="Digite o nome do jogador..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {scorerSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border rounded-lg shadow-lg z-10 mt-1 overflow-hidden">
                {scorerSuggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setTopScorer(s); setScorerInput(s); setScorerSuggestions([]) }}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {!locked && (
        <Button
          onClick={handleSave}
          disabled={saving || !champion || !topScorer}
          className="w-full bg-green-700 hover:bg-green-600"
        >
          {saved ? (
            <><CheckCircle2 className="w-4 h-4 mr-1" /> Salvo!</>
          ) : saving ? 'Salvando...' : hasExisting ? 'Atualizar palpites' : 'Salvar palpites'}
        </Button>
      )}
    </div>
  )
}
