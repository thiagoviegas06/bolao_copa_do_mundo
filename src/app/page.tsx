import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Trophy, Users, Target, BarChart3 } from 'lucide-react'

export default function Home() {
  if (process.env.DEV_MODE === 'true') redirect('/dashboard')
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-900 to-green-700 text-white">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <Trophy className="w-8 h-8 text-yellow-400" />
          Bolão Copa 2026
        </div>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="outline" className="text-white border-white hover:bg-white/20 bg-transparent">
              Entrar
            </Button>
          </Link>
          <Link href="/register">
            <Button className="bg-yellow-400 text-green-900 hover:bg-yellow-300 font-bold">
              Criar conta
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
          Seu Bolão da<br />
          <span className="text-yellow-400">Copa do Mundo</span>
        </h1>
        <p className="text-xl text-green-200 mb-10 max-w-xl mx-auto">
          Crie bolões, convide seus amigos, faça seus palpites e veja quem conhece mais de futebol!
        </p>
        <Link href="/register">
          <Button size="lg" className="bg-yellow-400 text-green-900 hover:bg-yellow-300 font-bold text-lg px-10 py-6">
            Começar agora — é grátis!
          </Button>
        </Link>

        <div className="grid md:grid-cols-4 gap-6 mt-24 text-left">
          {[
            { icon: Users, title: 'Crie bolões', desc: 'Crie quantos bolões quiser e convide seus amigos com um código' },
            { icon: Target, title: 'Faça palpites', desc: 'Chute o placar de cada jogo antes da partida começar' },
            { icon: BarChart3, title: 'Veja o ranking', desc: 'Acompanhe a classificação em tempo real no seu bolão' },
            { icon: Trophy, title: 'Acerte mais', desc: 'Placar certo vale 3 pontos, resultado certo vale 1 ponto' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white/10 rounded-2xl p-6 backdrop-blur">
              <Icon className="w-10 h-10 text-yellow-400 mb-3" />
              <h3 className="text-lg font-bold mb-2">{title}</h3>
              <p className="text-green-200 text-sm">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
