import { WorldCupGroup } from '@/types/database'

// Copa do Mundo 2026 — 48 times, 12 grupos de 4
export const COPA_2026_GROUPS: WorldCupGroup[] = [
  { name: 'A', teams: ['Mexico', 'South Africa', 'South Korea', 'Czechia'] },
  { name: 'B', teams: ['Canada', 'Bosnia and Herzegovina', 'Qatar', 'Switzerland'] },
  { name: 'C', teams: ['Brazil', 'Morocco', 'Haiti', 'Scotland'] },
  { name: 'D', teams: ['United States', 'Paraguay', 'Australia', 'Türkiye'] },
  { name: 'E', teams: ['Germany', 'Curaçao', 'Ivory Coast', 'Ecuador'] },
  { name: 'F', teams: ['Netherlands', 'Japan', 'Sweden', 'Tunisia'] },
  { name: 'G', teams: ['Belgium', 'Egypt', 'Iran', 'New Zealand'] },
  { name: 'H', teams: ['Spain', 'Cabo Verde', 'Saudi Arabia', 'Uruguay'] },
  { name: 'I', teams: ['France', 'Senegal', 'Iraq', 'Norway'] },
  { name: 'J', teams: ['Argentina', 'Algeria', 'Austria', 'Jordan'] },
  { name: 'K', teams: ['Portugal', 'DR Congo', 'Uzbekistan', 'Colombia'] },
  { name: 'L', teams: ['England', 'Croatia', 'Ghana', 'Panama'] },
]

export const ALL_TEAMS = COPA_2026_GROUPS.flatMap((g) => g.teams).sort()

// Jogadores famosos como sugestão de artilheiros
export const SUGGESTED_TOP_SCORERS = [
  'Vinicius Jr.', 'Kylian Mbappé', 'Erling Haaland', 'Harry Kane',
  'Lautaro Martínez', 'Pedri', 'Jude Bellingham', 'Rodri',
  'Rafael Leão', 'Darwin Núñez', 'Cody Gakpo', 'Federico Chiesa',
]
