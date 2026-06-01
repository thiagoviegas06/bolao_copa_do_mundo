'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', password: '', username: '', full_name: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.username.trim().length < 3) {
      setError('O nome de usuário deve ter pelo menos 3 caracteres.')
      setLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) {
      setError('Use apenas letras, números e underscore no nome de usuário.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          username: form.username.toLowerCase().trim(),
          full_name: form.full_name.trim(),
        },
      },
    })

    if (signUpError) {
      const msg = signUpError.message
      if (msg.includes('already registered') || msg.includes('already been registered')) {
        setError('Este e-mail já está cadastrado.')
      } else if (msg.includes('Password should be')) {
        setError('A senha deve ter pelo menos 6 caracteres.')
      } else {
        setError(msg)
      }
      setLoading(false)
      return
    }

    // Se não tem sessão, confirmação de e-mail ainda está ativa no Supabase
    if (!data.session) {
      setError('Verifique seu e-mail para confirmar o cadastro antes de entrar.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <Trophy className="w-10 h-10 text-yellow-500" />
          </div>
          <CardTitle className="text-2xl">Criar conta</CardTitle>
          <CardDescription>Entre no maior bolão de Copa do Mundo!</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="full_name">Nome completo</Label>
              <Input
                id="full_name"
                placeholder="Seu nome"
                value={form.full_name}
                onChange={set('full_name')}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="username">Nome de usuário</Label>
              <Input
                id="username"
                placeholder="nome_usuario"
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/\s/g, '_') }))}
                required
              />
              <p className="text-xs text-gray-400">Só letras, números e _ (sem espaços)</p>
            </div>
            <div className="space-y-1">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={form.email}
                onChange={set('email')}
                required
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.password}
                onChange={set('password')}
                minLength={6}
                required
              />
            </div>
            {error && (
              <p className={`text-sm ${error.includes('Verifique') ? 'text-blue-600' : 'text-red-600'}`}>
                {error}
              </p>
            )}
            <Button type="submit" className="w-full bg-green-700 hover:bg-green-600" disabled={loading}>
              {loading ? 'Criando conta...' : 'Criar conta'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Já tem conta?{' '}
            <Link href="/login" className="text-green-700 font-medium hover:underline">
              Entrar
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
