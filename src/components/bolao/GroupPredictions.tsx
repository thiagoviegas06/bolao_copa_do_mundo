'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { GroupPrediction } from '@/types/database'
import { WorldCupGroup } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, GripVertical, Info } from 'lucide-react'

interface Props {
  groups: WorldCupGroup[]
  bolaoId: string
  userId: string
  existingPredictions: GroupPrediction[]
  locked: boolean
}

type GroupOrder = [string, string, string, string]

function buildInitial(groups: WorldCupGroup[], existing: GroupPrediction[]): Record<string, GroupOrder> {
  const map: Record<string, GroupOrder> = {}
  for (const g of groups) {
    const pred = existing.find((p) => p.group_name === g.name)
    if (pred?.first_place && pred.second_place && pred.third_place && pred.fourth_place) {
      map[g.name] = [pred.first_place, pred.second_place, pred.third_place, pred.fourth_place]
    } else {
      map[g.name] = [g.teams[0], g.teams[1], g.teams[2], g.teams[3]]
    }
  }
  return map
}

function GroupCard({
  group, order, onChange, locked, saved,
}: {
  group: WorldCupGroup
  order: GroupOrder
  onChange: (newOrder: GroupOrder) => void
  locked: boolean
  saved: boolean
}) {
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  function onDragStart(idx: number) { setDragIdx(idx) }
  function onDragOver(e: React.DragEvent, idx: number) {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) return
    const next = [...order] as GroupOrder
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    onChange(next)
    setDragIdx(idx)
  }
  function onDragEnd() { setDragIdx(null) }

  const posLabels = ['1º', '2º', '3º', '4º']
  const posColors = [
    'bg-yellow-100 text-yellow-700 border-yellow-300',
    'bg-green-100 text-green-700 border-green-300',
    'bg-gray-100 text-gray-500 border-gray-200',
    'bg-red-50 text-red-400 border-red-200',
  ]

  return (
    <div className="bg-white rounded-xl border p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-700">Grupo {group.name}</h3>
        {saved && (
          <span className="flex items-center gap-1 text-xs text-green-600">
            <CheckCircle2 className="w-3 h-3" /> Salvo
          </span>
        )}
        {locked && <Badge variant="secondary" className="text-xs">Bloqueado</Badge>}
      </div>
      <div className="space-y-1.5">
        {order.map((team, idx) => (
          <div
            key={team}
            draggable={!locked}
            onDragStart={() => onDragStart(idx)}
            onDragOver={(e) => onDragOver(e, idx)}
            onDragEnd={onDragEnd}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-opacity ${posColors[idx]} ${!locked ? 'cursor-grab active:cursor-grabbing' : ''} ${dragIdx === idx ? 'opacity-50' : ''}`}
          >
            {!locked && <GripVertical className="w-3 h-3 opacity-40 shrink-0" />}
            <span className="font-bold w-5 shrink-0">{posLabels[idx]}</span>
            <span className="flex-1 font-medium">{team}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function GroupPredictions({ groups, bolaoId, userId, existingPredictions, locked }: Props) {
  const [orders, setOrders] = useState<Record<string, GroupOrder>>(
    () => buildInitial(groups, existingPredictions)
  )
  const [saving, setSaving] = useState(false)
  const [savedGroups, setSavedGroups] = useState<Set<string>>(
    () => new Set(existingPredictions.map((p) => p.group_name))
  )
  const [globalSaved, setGlobalSaved] = useState(false)

  function setGroupOrder(groupName: string) {
    return (newOrder: GroupOrder) => setOrders((o) => ({ ...o, [groupName]: newOrder }))
  }

  async function saveAll() {
    setSaving(true)

    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') {
      const supabase = createClient()
      const upserts = groups.map((g) => {
        const [first_place, second_place, third_place, fourth_place] = orders[g.name]
        return {
          user_id: userId, bolao_id: bolaoId, group_name: g.name,
          first_place, second_place, third_place, fourth_place,
          updated_at: new Date().toISOString(),
        }
      })
      await supabase.from('group_predictions').upsert(upserts, { onConflict: 'user_id,bolao_id,group_name' })
    }

    setSavedGroups(new Set(groups.map((g) => g.name)))
    setGlobalSaved(true)
    setSaving(false)
    setTimeout(() => setGlobalSaved(false), 3000)
  }

  return (
    <div>
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <Info className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-sm text-blue-700">
          <p className="font-medium mb-1">Arraste os times para ordenar cada grupo</p>
          <p className="text-xs">Os 2 primeiros de cada grupo avançam para o mata-mata. Acertar a posição exata ou quem avança te dá pontos extras!</p>
        </div>
      </div>

      {locked && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4 text-sm text-orange-700 text-center">
          A fase de grupos já começou — palpites bloqueados.
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {groups.map((g) => (
          <GroupCard
            key={g.name}
            group={g}
            order={orders[g.name]}
            onChange={setGroupOrder(g.name)}
            locked={locked}
            saved={savedGroups.has(g.name)}
          />
        ))}
      </div>

      {!locked && (
        <div className="flex justify-end">
          <Button
            onClick={saveAll}
            disabled={saving}
            className="bg-green-700 hover:bg-green-600"
          >
            {globalSaved ? (
              <><CheckCircle2 className="w-4 h-4 mr-1" /> Palpites salvos!</>
            ) : saving ? 'Salvando...' : 'Salvar todos os grupos'}
          </Button>
        </div>
      )}
    </div>
  )
}
