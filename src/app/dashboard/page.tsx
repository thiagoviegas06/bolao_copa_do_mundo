import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, LogOut, Users } from 'lucide-react'
import CreateBolaoDialog from '@/components/bolao/CreateBolaoDialog'
import JoinBolaoDialog from '@/components/bolao/JoinBolaoDialog'
import {
  IS_DEV_MODE, MOCK_USER, MOCK_PROFILE, MOCK_BOLOES,
  MOCK_MEMBER_POINTS, MOCK_MEMBER_COUNTS,
} from '@/lib/dev-data'
import { Bolao, Profile } from '@/types/database'

async function getData() {
  if (IS_DEV_MODE) {
    return {
      user: MOCK_USER,
      profile: MOCK_PROFILE,
      boloes: MOCK_BOLOES,
      pointsMap: MOCK_MEMBER_POINTS,
      memberCounts: MOCK_MEMBER_COUNTS,
    }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', user.id).single()

  const { data: members } = await supabase
    .from('bolao_members').select('bolao_id, total_points').eq('user_id', user.id)

  const bolaoIds = (members ?? []).map((m) => m.bolao_id)

  const { data: boloes } = bolaoIds.length
    ? await supabase.from('boloes').select('*').in('id', bolaoIds)
    : { data: [] as Bolao[] }

  const memberCounts: Record<string, number> = {}
  if (bolaoIds.length) {
    const { data: counts } = await supabase
      .from('bolao_members').select('bolao_id').in('bolao_id', bolaoIds)
    counts?.forEach((c) => {
      memberCounts[c.bolao_id] = (memberCounts[c.bolao_id] ?? 0) + 1
    })
  }

  return {
    user,
    profile: profile as Profile | null,
    boloes: boloes ?? [],
    pointsMap: Object.fromEntries((members ?? []).map((m) => [m.bolao_id, m.total_points])),
    memberCounts,
  }
}

export default async function DashboardPage() {
  const data = await getData()

  if (!data) redirect('/login')

  const { user, profile, boloes, pointsMap, memberCounts } = data

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-800 text-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <Trophy className="w-6 h-6 text-yellow-400" />
            Bolão Copa 2026
          </div>
          <div className="flex items-center gap-3">
            {IS_DEV_MODE && (
              <Badge className="bg-yellow-500 text-black text-xs">DEV</Badge>
            )}
            <span className="text-green-200 text-sm">
              Olá, {profile?.full_name || profile?.username}
            </span>
            {!IS_DEV_MODE && (
              <form action="/api/auth/signout" method="POST">
                <Button size="sm" variant="ghost" className="text-white hover:bg-green-700" type="submit">
                  <LogOut className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Meus Bolões</h1>
          <div className="flex gap-2">
            <JoinBolaoDialog userId={user.id} />
            <CreateBolaoDialog userId={user.id} />
          </div>
        </div>

        {boloes.length === 0 ? (
          <div className="text-center py-20">
            <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-2">Você ainda não participa de nenhum bolão</p>
            <p className="text-gray-400">Crie um novo bolão ou entre com um código de convite!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {boloes.map((bolao) => {
              const isOwner = bolao.owner_id === user.id
              const memberCount = memberCounts[bolao.id] ?? 0
              const myPoints = pointsMap[bolao.id] ?? 0

              return (
                <Link key={bolao.id} href={`/bolao/${bolao.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{bolao.name}</CardTitle>
                        {isOwner && <Badge variant="secondary">Admin</Badge>}
                      </div>
                      {bolao.description && (
                        <CardDescription>{bolao.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {memberCount} participante{memberCount !== 1 ? 's' : ''}
                        </span>
                        <span className="font-bold text-green-700">{myPoints} pts</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Código: <span className="font-mono font-bold">{bolao.invite_code}</span>
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
