'use client'

import { Trophy, Medal } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface RankingEntry {
  user_id: string
  username: string
  full_name: string | null
  total_points: number
  rank: number
}

interface Props {
  ranking: RankingEntry[]
  currentUserId: string
}

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />
  if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />
  if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />
  return <span className="w-5 text-center text-gray-500 text-sm font-bold">{rank}</span>
}

export default function RankingTable({ ranking, currentUserId }: Props) {
  if (ranking.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>Nenhum participante ainda.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden">
      <div className="divide-y">
        {ranking.map((entry) => {
          const isMe = entry.user_id === currentUserId
          return (
            <div
              key={entry.user_id}
              className={`flex items-center gap-4 px-4 py-3 ${isMe ? 'bg-green-50 border-l-4 border-l-green-600' : ''}`}
            >
              <div className="flex items-center justify-center w-6">
                <RankIcon rank={entry.rank} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">
                    {entry.full_name || entry.username}
                  </span>
                  <span className="text-xs text-gray-400">@{entry.username}</span>
                  {isMe && <Badge variant="secondary" className="text-xs">Você</Badge>}
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-green-700">{entry.total_points}</span>
                <span className="text-xs text-gray-400 ml-1">pts</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
