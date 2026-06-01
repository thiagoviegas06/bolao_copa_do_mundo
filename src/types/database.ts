export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Relationships: []
      }
      boloes: {
        Row: {
          id: string
          name: string
          description: string | null
          invite_code: string
          owner_id: string
          scoring_correct_result: number
          scoring_correct_score: number
          scoring_draw: number
          scoring_correct_diff: number
          scoring_knockout: number
          scoring_champion: number
          scoring_top_scorer: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          invite_code?: string
          owner_id: string
          scoring_correct_result?: number
          scoring_correct_score?: number
          scoring_draw?: number
          scoring_correct_diff?: number
          scoring_knockout?: number
          scoring_champion?: number
          scoring_top_scorer?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          invite_code?: string
          owner_id?: string
          scoring_correct_result?: number
          scoring_correct_score?: number
          scoring_draw?: number
          scoring_correct_diff?: number
          scoring_knockout?: number
          scoring_champion?: number
          scoring_top_scorer?: number
          created_at?: string
        }
        Relationships: []
      }
      bolao_members: {
        Row: {
          id: string
          bolao_id: string
          user_id: string
          joined_at: string
          total_points: number
        }
        Insert: {
          id?: string
          bolao_id: string
          user_id: string
          joined_at?: string
          total_points?: number
        }
        Update: {
          id?: string
          bolao_id?: string
          user_id?: string
          joined_at?: string
          total_points?: number
        }
        Relationships: []
      }
      matches: {
        Row: {
          id: string
          external_id: number
          home_team: string
          away_team: string
          home_team_flag: string | null
          away_team_flag: string | null
          match_date: string
          stage: string
          home_score: number | null
          away_score: number | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          external_id: number
          home_team: string
          away_team: string
          home_team_flag?: string | null
          away_team_flag?: string | null
          match_date: string
          stage: string
          home_score?: number | null
          away_score?: number | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          external_id?: number
          home_team?: string
          away_team?: string
          home_team_flag?: string | null
          away_team_flag?: string | null
          match_date?: string
          stage?: string
          home_score?: number | null
          away_score?: number | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
      predictions: {
        Row: {
          id: string
          user_id: string
          match_id: string
          bolao_id: string
          home_score: number
          away_score: number
          points: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          match_id: string
          bolao_id: string
          home_score: number
          away_score: number
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          match_id?: string
          bolao_id?: string
          home_score?: number
          away_score?: number
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      group_predictions: {
        Row: {
          id: string
          user_id: string
          bolao_id: string
          group_name: string
          first_place: string | null
          second_place: string | null
          third_place: string | null
          fourth_place: string | null
          points: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bolao_id: string
          group_name: string
          first_place?: string | null
          second_place?: string | null
          third_place?: string | null
          fourth_place?: string | null
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bolao_id?: string
          group_name?: string
          first_place?: string | null
          second_place?: string | null
          third_place?: string | null
          fourth_place?: string | null
          points?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tournament_predictions: {
        Row: {
          id: string
          user_id: string
          bolao_id: string
          champion: string | null
          top_scorer: string | null
          champion_points: number | null
          top_scorer_points: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          bolao_id: string
          champion?: string | null
          top_scorer?: string | null
          champion_points?: number | null
          top_scorer_points?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          bolao_id?: string
          champion?: string | null
          top_scorer?: string | null
          champion_points?: number | null
          top_scorer_points?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Profile = Database['public']['Tables']['profiles']['Row']
export type Bolao = Database['public']['Tables']['boloes']['Row']
export type BolaoMember = Database['public']['Tables']['bolao_members']['Row']
export type Match = Database['public']['Tables']['matches']['Row']
export type Prediction = Database['public']['Tables']['predictions']['Row']
export type GroupPrediction = Database['public']['Tables']['group_predictions']['Row']
export type TournamentPrediction = Database['public']['Tables']['tournament_predictions']['Row']

export interface MatchWithPrediction extends Match {
  prediction?: Prediction | null
}

export interface RankingEntry {
  user_id: string
  username: string
  full_name: string | null
  total_points: number
  rank: number
}

export interface WorldCupGroup {
  name: string
  teams: string[]
}
