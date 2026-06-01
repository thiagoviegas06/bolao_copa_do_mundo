import { WorldCupGroup } from '@/types/database'

// Copa do Mundo 2026 — 48 times, 12 grupos de 4
export const COPA_2026_GROUPS: WorldCupGroup[] = [
  { name: 'A', teams: ['México', 'EUA', 'Canadá', 'Jamaica'] },
  { name: 'B', teams: ['Brasil', 'Colômbia', 'Equador', 'Bolívia'] },
  { name: 'C', teams: ['Argentina', 'Uruguai', 'Chile', 'Peru'] },
  { name: 'D', teams: ['França', 'Bélgica', 'Holanda', 'Dinamarca'] },
  { name: 'E', teams: ['Espanha', 'Portugal', 'Croácia', 'Albânia'] },
  { name: 'F', teams: ['Alemanha', 'Inglaterra', 'Áustria', 'Suíça'] },
  { name: 'G', teams: ['Marrocos', 'Senegal', 'Camarões', 'Costa do Marfim'] },
  { name: 'H', teams: ['Japão', 'Coreia do Sul', 'Austrália', 'Arábia Saudita'] },
  { name: 'I', teams: ['Polônia', 'República Tcheca', 'Romênia', 'Eslováquia'] },
  { name: 'J', teams: ['Turquia', 'Grécia', 'Sérvia', 'Eslovênia'] },
  { name: 'K', teams: ['Irã', 'Iraque', 'Qatar', 'Jordânia'] },
  { name: 'L', teams: ['Costa Rica', 'Panamá', 'Honduras', 'El Salvador'] },
]

export const ALL_TEAMS = COPA_2026_GROUPS.flatMap((g) => g.teams).sort()

// Jogadores famosos como sugestão de artilheiros
export const SUGGESTED_TOP_SCORERS = [
  'Vinicius Jr.', 'Kylian Mbappé', 'Erling Haaland', 'Harry Kane',
  'Lautaro Martínez', 'Pedri', 'Jude Bellingham', 'Rodri',
  'Rafael Leão', 'Darwin Núñez', 'Cody Gakpo', 'Federico Chiesa',
]
