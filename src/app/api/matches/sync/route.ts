import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const COMPETITION_ID = 2000 // FIFA World Cup na football-data.org

interface FootballTeam {
  name: string
  shortName: string
  crest: string
}

interface FootballScore {
  home: number | null
  away: number | null
}

interface FootballMatch {
  id: number
  utcDate: string
  status: string
  stage: string
  homeTeam: FootballTeam
  awayTeam: FootballTeam
  score: {
    fullTime: FootballScore
  }
}

function flagEmoji(crestUrl: string): string {
  // Use the crest URL directly — stored as URL, displayed as <img>
  return crestUrl
}

function mapStatus(status: string): string {
  const map: Record<string, string> = {
    SCHEDULED: 'SCHEDULED',
    TIMED: 'SCHEDULED',
    IN_PLAY: 'LIVE',
    PAUSED: 'LIVE',
    FINISHED: 'FINISHED',
    POSTPONED: 'POSTPONED',
    SUSPENDED: 'POSTPONED',
    CANCELLED: 'POSTPONED',
  }
  return map[status] ?? 'SCHEDULED'
}

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.FOOTBALL_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const res = await fetch(
    `${process.env.FOOTBALL_API_BASE}/competitions/${COMPETITION_ID}/matches`,
    { headers: { 'X-Auth-Token': apiKey } }
  )

  if (!res.ok) {
    return NextResponse.json({ error: 'Football API error', status: res.status }, { status: 502 })
  }

  const data = await res.json()
  const matches: FootballMatch[] = data.matches ?? []

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Partidas editadas manualmente pelo admin (locked) mantêm time/data/fase
  // mesmo que a API retorne dados diferentes — só o placar/status é sincronizado.
  // Partidas já FINISHED no banco não são mais tocadas — a API às vezes manda
  // resultado errado pra jogos antigos, então o resultado final fica travado.
  const { data: existing } = await supabase
    .from('matches')
    .select('external_id, home_team, away_team, home_team_flag, away_team_flag, match_date, stage, locked, status')
  const existingByExternalId = new Map((existing ?? []).map((m) => [m.external_id, m]))

  const upsertData = matches
    .filter((m) => existingByExternalId.get(m.id)?.status !== 'FINISHED')
    .map((m) => {
      const prev = existingByExternalId.get(m.id)
      if (prev?.locked) {
        return {
          external_id: m.id,
          home_team: prev.home_team,
          away_team: prev.away_team,
          home_team_flag: prev.home_team_flag,
          away_team_flag: prev.away_team_flag,
          match_date: prev.match_date,
          stage: prev.stage,
          home_score: m.score.fullTime.home,
          away_score: m.score.fullTime.away,
          status: mapStatus(m.status),
        }
      }
      return {
        external_id: m.id,
        home_team: m.homeTeam.shortName || m.homeTeam.name || 'A definir',
        away_team: m.awayTeam.shortName || m.awayTeam.name || 'A definir',
        home_team_flag: flagEmoji(m.homeTeam.crest),
        away_team_flag: flagEmoji(m.awayTeam.crest),
        match_date: m.utcDate,
        stage: m.stage,
        home_score: m.score.fullTime.home,
        away_score: m.score.fullTime.away,
        status: mapStatus(m.status),
      }
    })

  if (upsertData.length > 0) {
    const { error } = await supabase
      .from('matches')
      .upsert(upsertData, { onConflict: 'external_id' })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ synced: upsertData.length })
}

export async function GET(request: Request) {
  return POST(request)
}
