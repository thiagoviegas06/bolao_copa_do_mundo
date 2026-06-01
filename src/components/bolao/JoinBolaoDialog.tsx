'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Users, X } from 'lucide-react'

export default function JoinBolaoDialog({ userId }: { userId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
      await new Promise((r) => setTimeout(r, 400))
      setOpen(false)
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: bolao } = await supabase
      .from('boloes').select('id, name').eq('invite_code', code.trim().toUpperCase()).single()

    if (!bolao) {
      setError('Código inválido. Verifique e tente novamente.')
      setLoading(false)
      return
    }

    const { error: joinError } = await supabase
      .from('bolao_members').insert({ bolao_id: bolao.id, user_id: userId })

    if (joinError) {
      setError(joinError.code === '23505'
        ? 'Você já participa deste bolão.'
        : 'Erro ao entrar no bolão. Tente novamente.')
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Users className="w-4 h-4 mr-1" /> Entrar com código
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Entrar em um bolão</h2>
          <button onClick={() => setOpen(false)}>
            <X className="w-5 h-5 text-gray-400 hover:text-gray-600" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="invite-code">Código de convite</Label>
            <Input
              id="invite-code"
              placeholder="Ex: AB12CD34"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono text-lg tracking-widest text-center uppercase"
              maxLength={8}
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || code.length < 6} className="bg-green-700 hover:bg-green-600">
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
