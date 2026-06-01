'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, X, HelpCircle } from 'lucide-react'

type ScoringForm = {
  scoring_correct_result: number
  scoring_correct_score: number
  scoring_draw: number
  scoring_correct_diff: number
  scoring_knockout: number
  scoring_champion: number
  scoring_top_scorer: number
}

const DEFAULTS: ScoringForm = {
  scoring_correct_result: 1,
  scoring_correct_score: 3,
  scoring_draw: 2,
  scoring_correct_diff: 2,
  scoring_knockout: 5,
  scoring_champion: 15,
  scoring_top_scorer: 10,
}

type Tab = 'info' | 'jogos' | 'torneio'

const TABS: { id: Tab; label: string }[] = [
  { id: 'info', label: 'Geral' },
  { id: 'jogos', label: 'Placares' },
  { id: 'torneio', label: 'Torneio' },
]

function ScoreField({
  label, hint, value, onChange,
}: {
  label: string; hint: string; value: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-800">{label}</p>
        <p className="text-xs text-gray-400">{hint}</p>
      </div>
      <div className="flex items-center gap-1">
        <Input
          type="number"
          min={0}
          max={99}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-16 text-center font-bold"
        />
        <span className="text-xs text-gray-400">pts</span>
      </div>
    </div>
  )
}

export default function CreateBolaoDialog({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<Tab>('info')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [scoring, setScoring] = useState<ScoringForm>(DEFAULTS)

  function setScore(field: keyof ScoringForm) {
    return (v: number) => setScoring((s) => ({ ...s, [field]: v }))
  }

  function resetAndClose() {
    setOpen(false)
    setTab('info')
    setName('')
    setDescription('')
    setScoring(DEFAULTS)
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setTab('info'); setError('O nome do bolão é obrigatório.'); return }
    setLoading(true)
    setError('')

    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      await new Promise((r) => setTimeout(r, 400))
      resetAndClose()
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: bolao, error: bolaoError } = await supabase
      .from('boloes')
      .insert({ name: name.trim(), description: description || null, owner_id: userId, ...scoring })
      .select()
      .single()

    if (bolaoError || !bolao) {
      setError('Erro ao criar bolão. Tente novamente.')
      setLoading(false)
      return
    }

    await supabase.from('bolao_members').insert({ bolao_id: bolao.id, user_id: userId })
    resetAndClose()
    router.refresh()
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} className="bg-green-700 hover:bg-green-600">
        <Plus className="w-4 h-4 mr-1" /> Criar bolão
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex justify-between items-center px-6 pt-5 pb-3 border-b">
          <h2 className="text-xl font-bold">Criar novo bolão</h2>
          <button onClick={resetAndClose}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'border-b-2 border-green-700 text-green-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">

            {tab === 'info' && (
              <>
                <div className="space-y-1">
                  <Label>Nome do bolão *</Label>
                  <Input
                    placeholder="Ex: Bolão dos Amigos"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label>Descrição (opcional)</Label>
                  <Input
                    placeholder="Uma breve descrição..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
                <div className="bg-blue-50 rounded-lg p-3 flex gap-2 text-xs text-blue-700">
                  <HelpCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>Nas abas ao lado você pode personalizar a pontuação de cada categoria. Os valores padrão já estão configurados.</span>
                </div>
              </>
            )}

            {tab === 'jogos' && (
              <div className="divide-y">
                <ScoreField
                  label="Placar exato (cravada)"
                  hint="Acertar o placar exato do jogo (ex: 2×1)"
                  value={scoring.scoring_correct_score}
                  onChange={setScore('scoring_correct_score')}
                />
                <ScoreField
                  label="Empate certo"
                  hint="Resultado é empate e apostou empate (qualquer placar de empate)"
                  value={scoring.scoring_draw}
                  onChange={setScore('scoring_draw')}
                />
                <ScoreField
                  label="Vitória + saldo"
                  hint="Acertou quem ganhou e a diferença de gols (ex: ganhou por 1)"
                  value={scoring.scoring_correct_diff}
                  onChange={setScore('scoring_correct_diff')}
                />
                <ScoreField
                  label="Resultado certo"
                  hint="Só acertou quem ganhou, sem acertar o saldo"
                  value={scoring.scoring_correct_result}
                  onChange={setScore('scoring_correct_result')}
                />
              </div>
            )}

            {tab === 'torneio' && (
              <>
                <p className="text-xs text-gray-500 bg-gray-50 rounded p-3">
                  Palpites únicos feitos antes do torneio. Acertou? Recebe os pontos ao final.
                </p>
                <div className="divide-y">
                  <ScoreField
                    label="Campeão"
                    hint="Acertar qual seleção vai vencer a Copa"
                    value={scoring.scoring_champion}
                    onChange={setScore('scoring_champion')}
                  />
                  <ScoreField
                    label="Artilheiro"
                    hint="Acertar qual jogador vai terminar como artilheiro"
                    value={scoring.scoring_top_scorer}
                    onChange={setScore('scoring_top_scorer')}
                  />
                  <ScoreField
                    label="Vencedor do mata-mata"
                    hint="Por cada jogo do mata-mata em que o participante acerta o vencedor"
                    value={scoring.scoring_knockout}
                    onChange={setScore('scoring_knockout')}
                  />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>

          {/* Footer */}
          <div className="flex gap-2 justify-end px-6 py-4 border-t">
            <Button type="button" variant="outline" onClick={resetAndClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-green-700 hover:bg-green-600">
              {loading ? 'Criando...' : 'Criar bolão'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
