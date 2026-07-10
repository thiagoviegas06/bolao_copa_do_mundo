import { Match, Prediction, Bolao, Profile, GroupPrediction, TournamentPrediction } from '@/types/database'

export const IS_DEV_MODE = process.env.DEV_MODE === 'true'

export const MOCK_USER = {
  id: 'dev-user-1',
  email: 'thiago@dev.local',
}

export const MOCK_PROFILE: Profile = {
  id: 'dev-user-1',
  username: 'thiago',
  full_name: 'Thiago (Dev)',
  avatar_url: null,
  created_at: '2026-01-01T00:00:00Z',
}

export const MOCK_BOLOES: Bolao[] = [
  {
    id: 'bolao-1',
    name: 'Bolão dos Amigos',
    description: 'O melhor bolão de todos',
    invite_code: 'AMIGOS01',
    owner_id: 'dev-user-1',
    scoring_correct_result: 1,
    scoring_correct_score: 3,
    scoring_draw: 2,
    scoring_correct_diff: 2,
    scoring_knockout: 5,
    scoring_champion: 15,
    scoring_top_scorer: 10,
    created_at: '2026-01-01T00:00:00Z',
  },
  {
    id: 'bolao-2',
    name: 'Bolão NYU',
    description: null,
    invite_code: 'NYU2026',
    owner_id: 'dev-user-2',
    scoring_correct_result: 1,
    scoring_correct_score: 3,
    scoring_draw: 2,
    scoring_correct_diff: 2,
    scoring_knockout: 5,
    scoring_champion: 15,
    scoring_top_scorer: 10,
    created_at: '2026-01-02T00:00:00Z',
  },
]

export const MOCK_MEMBER_POINTS: Record<string, number> = {
  'bolao-1': 7,
  'bolao-2': 3,
}

export const MOCK_MEMBER_COUNTS: Record<string, number> = {
  'bolao-1': 5,
  'bolao-2': 8,
}

export const MOCK_RANKING = [
  { user_id: 'dev-user-3', username: 'carlos', full_name: 'Carlos Silva', total_points: 14, rank: 1 },
  { user_id: 'dev-user-4', username: 'fernanda', full_name: 'Fernanda Lima', total_points: 10, rank: 2 },
  { user_id: 'dev-user-1', username: 'thiago', full_name: 'Thiago (Dev)', total_points: 7, rank: 3 },
  { user_id: 'dev-user-5', username: 'pedro', full_name: 'Pedro Alves', total_points: 4, rank: 4 },
  { user_id: 'dev-user-2', username: 'julia', full_name: 'Júlia Costa', total_points: 1, rank: 5 },
]

const now = new Date()
const d = (daysFromNow: number, hour = 18) => {
  const dt = new Date(now)
  dt.setDate(dt.getDate() + daysFromNow)
  dt.setHours(hour, 0, 0, 0)
  return dt.toISOString()
}

export const MOCK_MATCHES: Match[] = [
  // Fase de grupos — finalizados
  {
    id: 'match-1', external_id: 1001,
    home_team: 'Brasil', away_team: 'México',
    home_team_flag: '🇧🇷', away_team_flag: '🇲🇽',
    match_date: d(-3), stage: 'Fase de Grupos',
    home_score: 2, away_score: 0, status: 'FINISHED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-2', external_id: 1002,
    home_team: 'Argentina', away_team: 'Canadá',
    home_team_flag: '🇦🇷', away_team_flag: '🇨🇦',
    match_date: d(-3, 21), stage: 'Fase de Grupos',
    home_score: 1, away_score: 1, status: 'FINISHED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-3', external_id: 1003,
    home_team: 'França', away_team: 'Alemanha',
    home_team_flag: '🇫🇷', away_team_flag: '🇩🇪',
    match_date: d(-1), stage: 'Fase de Grupos',
    home_score: 3, away_score: 2, status: 'FINISHED', locked: false, created_at: d(-10),
  },
  // Ao vivo
  {
    id: 'match-4', external_id: 1004,
    home_team: 'Portugal', away_team: 'Espanha',
    home_team_flag: '🇵🇹', away_team_flag: '🇪🇸',
    match_date: d(0, now.getHours() - 1), stage: 'Fase de Grupos',
    home_score: 1, away_score: 0, status: 'LIVE', locked: false, created_at: d(-10),
  },
  // Agendados — fase de grupos
  {
    id: 'match-5', external_id: 1005,
    home_team: 'Brasil', away_team: 'Argentina',
    home_team_flag: '🇧🇷', away_team_flag: '🇦🇷',
    match_date: d(1), stage: 'Fase de Grupos',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-6', external_id: 1006,
    home_team: 'Japão', away_team: 'Marrocos',
    home_team_flag: '🇯🇵', away_team_flag: '🇲🇦',
    match_date: d(1, 21), stage: 'Fase de Grupos',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-7', external_id: 1007,
    home_team: 'EUA', away_team: 'Holanda',
    home_team_flag: '🇺🇸', away_team_flag: '🇳🇱',
    match_date: d(3), stage: 'Fase de Grupos',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  // Mata-mata — agendados
  {
    id: 'match-8', external_id: 1008,
    home_team: 'Brasil', away_team: 'França',
    home_team_flag: '🇧🇷', away_team_flag: '🇫🇷',
    match_date: d(8), stage: 'Oitavas de Final',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-9', external_id: 1009,
    home_team: 'Argentina', away_team: 'Espanha',
    home_team_flag: '🇦🇷', away_team_flag: '🇪🇸',
    match_date: d(9), stage: 'Oitavas de Final',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-10', external_id: 1010,
    home_team: 'Alemanha', away_team: 'Portugal',
    home_team_flag: '🇩🇪', away_team_flag: '🇵🇹',
    match_date: d(10), stage: 'Oitavas de Final',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-11', external_id: 1011,
    home_team: 'Japão', away_team: 'EUA',
    home_team_flag: '🇯🇵', away_team_flag: '🇺🇸',
    match_date: d(11), stage: 'Oitavas de Final',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-12', external_id: 1012,
    home_team: 'A vencer', away_team: 'A vencer',
    home_team_flag: null, away_team_flag: null,
    match_date: d(15), stage: 'Quartas de Final',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-13', external_id: 1013,
    home_team: 'A vencer', away_team: 'A vencer',
    home_team_flag: null, away_team_flag: null,
    match_date: d(18), stage: 'Semifinal',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
  {
    id: 'match-14', external_id: 1014,
    home_team: 'A vencer', away_team: 'A vencer',
    home_team_flag: null, away_team_flag: null,
    match_date: d(22), stage: 'Final',
    home_score: null, away_score: null, status: 'SCHEDULED', locked: false, created_at: d(-10),
  },
]

export const MOCK_PREDICTIONS: Prediction[] = [
  { id: 'pred-1', user_id: 'dev-user-1', match_id: 'match-1', bolao_id: 'bolao-1', home_score: 2, away_score: 0, points: 3, created_at: d(-5), updated_at: d(-5) },
  { id: 'pred-2', user_id: 'dev-user-1', match_id: 'match-2', bolao_id: 'bolao-1', home_score: 2, away_score: 1, points: 0, created_at: d(-5), updated_at: d(-5) },
  { id: 'pred-3', user_id: 'dev-user-1', match_id: 'match-3', bolao_id: 'bolao-1', home_score: 2, away_score: 1, points: 1, created_at: d(-3), updated_at: d(-3) },
  { id: 'pred-4', user_id: 'dev-user-1', match_id: 'match-4', bolao_id: 'bolao-1', home_score: 2, away_score: 0, points: null, created_at: d(-1), updated_at: d(-1) },
  { id: 'pred-5', user_id: 'dev-user-1', match_id: 'match-5', bolao_id: 'bolao-1', home_score: 3, away_score: 1, points: null, created_at: d(0), updated_at: d(0) },
]

export const MOCK_GROUP_PREDICTIONS: GroupPrediction[] = [
  { id: 'gp-1', user_id: 'dev-user-1', bolao_id: 'bolao-1', group_name: 'A', first_place: 'México', second_place: 'EUA', third_place: 'Canadá', fourth_place: 'Jamaica', points: null, created_at: d(-5), updated_at: d(-5) },
  { id: 'gp-2', user_id: 'dev-user-1', bolao_id: 'bolao-1', group_name: 'B', first_place: 'Brasil', second_place: 'Colômbia', third_place: 'Equador', fourth_place: 'Bolívia', points: null, created_at: d(-5), updated_at: d(-5) },
]

export const MOCK_TOURNAMENT_PREDICTION: TournamentPrediction = {
  id: 'tp-1',
  user_id: 'dev-user-1',
  bolao_id: 'bolao-1',
  champion: 'Brasil',
  top_scorer: 'Vinicius Jr.',
  champion_points: null,
  top_scorer_points: null,
  created_at: d(-5),
  updated_at: d(-5),
}
