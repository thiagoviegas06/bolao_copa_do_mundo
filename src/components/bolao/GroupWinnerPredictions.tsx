'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GroupPrediction } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, Lock, Info } from 'lucide-react'
import { COPA_2026_GROUPS } from '@/lib/copa2026'

interface Props {
  bolaoId: string
  userId: string
  existingPredictions: GroupPrediction[]
  locked: boolean
}

export default function GroupWinnerPredictions({ bolaoId, userId, existingPredictions, locked }: Props) {
  const [winners, setWinners] = useState<Record<string, string>>(
    Object.fromEntries(existingPredictions.map((p) => [p.group_name, p.first_place ?? '']))
  )
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const filledCount = Object.values(winners).filter(Boolean).length

  async function saveAll() {
    setSaving(true)
    const supabase = createClient()
    const upserts = COPA_2026_GROUPS
      .filter((g) => winners[g.name])
      .map((g) => ({
        user_id: userId,
        bolao_id: bolaoId,
        group_name: g.name,
        first_place: winners[g.name],
        updated_at: new Date().toISOString(),
      }))

    await supabase
      .from('group_predictions')
      .upsert(upserts, { onConflict: 'user_id,bolao_id,group_name' })

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="space-y-5 mt-6">
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Vencedor de cada grupo</p>
          <p className="text-xs">Escolha qual time vai terminar em 1º em cada grupo da fase de grupos.</p>
        </div>
      </div>

      {locked && (
        <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl p-3 text-sm text-orange-700">
          <Lock className="w-4 h-4" />
          Prazo encerrado — palpites bloqueados.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {COPA_2026_GROUPS.map((group) => {
          const selected = winners[group.name] ?? ''
          return (
            <div key={group.name} className="bg-white rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700 text-sm">Grupo {group.name}</h3>
                {selected && (
                  <Badge className="bg-green-100 text-green-700 border border-green-300 text-xs">
                    {selected}
                  </Badge>
                )}
              </div>
              <div className="space-y-1.5">
                {group.teams.map((team) => (
                  <button
                    key={team}
                    type="button"
                    disabled={locked}
                    onClick={() => setWinners((w) => ({ ...w, [group.name]: team }))}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg border transition-all ${
                      selected === team
                        ? 'bg-green-700 text-white border-green-700 font-bold'
                        : locked
                          ? 'bg-gray-50 text-gray-400 border-gray-100 cursor-not-allowed'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-green-400'
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {!locked && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">{filledCount} de {COPA_2026_GROUPS.length} grupos preenchidos</span>
          <Button
            onClick={saveAll}
            disabled={saving || filledCount === 0}
            className="bg-green-700 hover:bg-green-600"
          >
            {saved ? (
              <><CheckCircle2 className="w-4 h-4 mr-1" /> Salvo!</>
            ) : saving ? 'Salvando...' : 'Salvar palpites de grupos'}
          </Button>
        </div>
      )}
    </div>
  )
}
