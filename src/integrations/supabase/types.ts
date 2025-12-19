export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      calendar_connections: {
        Row: {
          access_token: string
          calendar_email: string | null
          created_at: string
          id: string
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          calendar_email?: string | null
          created_at?: string
          id?: string
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          calendar_email?: string | null
          created_at?: string
          id?: string
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_recommendations: {
        Row: {
          calendar_event_id: string | null
          created_at: string
          description: string | null
          goal_id: string | null
          id: string
          recommended_end: string
          recommended_start: string
          status: string
          title: string
          user_id: string
          week_of: string
        }
        Insert: {
          calendar_event_id?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          recommended_end: string
          recommended_start: string
          status?: string
          title: string
          user_id: string
          week_of?: string
        }
        Update: {
          calendar_event_id?: string | null
          created_at?: string
          description?: string | null
          goal_id?: string | null
          id?: string
          recommended_end?: string
          recommended_start?: string
          status?: string
          title?: string
          user_id?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_recommendations_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      downtime_logs: {
        Row: {
          created_at: string
          downtime_type: string
          duration_minutes: number
          id: string
          logged_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          downtime_type: string
          duration_minutes: number
          id?: string
          logged_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          downtime_type?: string
          duration_minutes?: number
          id?: string
          logged_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      exercise_goals: {
        Row: {
          created_at: string
          id: string
          sessions_per_week: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          sessions_per_week?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          sessions_per_week?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exercise_logs: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number
          id: string
          logged_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          duration_minutes: number
          id?: string
          logged_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number
          id?: string
          logged_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      goal_logs: {
        Row: {
          duration_minutes: number | null
          goal_id: string
          id: string
          logged_at: string | null
          notes: string | null
          people_involved: string[] | null
          user_id: string
        }
        Insert: {
          duration_minutes?: number | null
          goal_id: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          people_involved?: string[] | null
          user_id: string
        }
        Update: {
          duration_minutes?: number | null
          goal_id?: string
          id?: string
          logged_at?: string | null
          notes?: string | null
          people_involved?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_logs_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string | null
          current_progress: number | null
          icon: string | null
          id: string
          name: string
          ramp_current_week: number | null
          ramp_duration_weeks: number | null
          ramp_enabled: boolean | null
          ramp_start: number | null
          target_per_week: number
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string | null
          current_progress?: number | null
          icon?: string | null
          id?: string
          name: string
          ramp_current_week?: number | null
          ramp_duration_weeks?: number | null
          ramp_enabled?: boolean | null
          ramp_start?: number | null
          target_per_week?: number
          unit?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string | null
          current_progress?: number | null
          icon?: string | null
          id?: string
          name?: string
          ramp_current_week?: number | null
          ramp_duration_weeks?: number | null
          ramp_enabled?: boolean | null
          ramp_start?: number | null
          target_per_week?: number
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      important_dates: {
        Row: {
          created_at: string | null
          date: string
          id: string
          is_recurring: boolean | null
          person_id: string | null
          reminder_days_before: number | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          is_recurring?: boolean | null
          person_id?: string | null
          reminder_days_before?: number | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          is_recurring?: boolean | null
          person_id?: string | null
          reminder_days_before?: number | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "important_dates_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      mood_checkins: {
        Row: {
          created_at: string
          date: string
          drained_by: string | null
          energized_by: string | null
          energy_level: number | null
          id: string
          mood_score: number | null
          stress_level: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          drained_by?: string | null
          energized_by?: string | null
          energy_level?: number | null
          id?: string
          mood_score?: number | null
          stress_level?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          drained_by?: string | null
          energized_by?: string | null
          energy_level?: number | null
          id?: string
          mood_score?: number | null
          stress_level?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_checkins: {
        Row: {
          ate_regular_meals: boolean | null
          ate_whole_foods: boolean | null
          created_at: string
          date: string
          drank_enough_water: boolean | null
          id: string
          note: string | null
          user_id: string
        }
        Insert: {
          ate_regular_meals?: boolean | null
          ate_whole_foods?: boolean | null
          created_at?: string
          date?: string
          drank_enough_water?: boolean | null
          id?: string
          note?: string | null
          user_id: string
        }
        Update: {
          ate_regular_meals?: boolean | null
          ate_whole_foods?: boolean | null
          created_at?: string
          date?: string
          drank_enough_water?: boolean | null
          id?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      people: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          id: string
          interests: string[] | null
          last_quality_time: string | null
          location: string | null
          name: string
          notes: string | null
          relationship: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          interests?: string[] | null
          last_quality_time?: string | null
          location?: string | null
          name: string
          notes?: string | null
          relationship: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          id?: string
          interests?: string[] | null
          last_quality_time?: string | null
          location?: string | null
          name?: string
          notes?: string | null
          relationship?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      personal_rituals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          reminder_enabled: boolean | null
          time_of_day: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          reminder_enabled?: boolean | null
          time_of_day?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          reminder_enabled?: boolean | null
          time_of_day?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          onboarding_completed: boolean | null
          priority_areas: string[] | null
          timezone: string | null
          updated_at: string | null
          work_end_hour: number | null
          work_start_hour: number | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          onboarding_completed?: boolean | null
          priority_areas?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          work_end_hour?: number | null
          work_start_hour?: number | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          onboarding_completed?: boolean | null
          priority_areas?: string[] | null
          timezone?: string | null
          updated_at?: string | null
          work_end_hour?: number | null
          work_start_hour?: number | null
        }
        Relationships: []
      }
      ritual_completions: {
        Row: {
          completed_date: string
          created_at: string
          id: string
          ritual_id: string
          user_id: string
        }
        Insert: {
          completed_date?: string
          created_at?: string
          id?: string
          ritual_id: string
          user_id: string
        }
        Update: {
          completed_date?: string
          created_at?: string
          id?: string
          ritual_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ritual_completions_ritual_id_fkey"
            columns: ["ritual_id"]
            isOneToOne: false
            referencedRelation: "personal_rituals"
            referencedColumns: ["id"]
          },
        ]
      }
      todos: {
        Row: {
          created_at: string | null
          description: string | null
          due_date: string | null
          goal_id: string | null
          id: string
          is_completed: boolean | null
          person_id: string | null
          priority: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string | null
          id?: string
          is_completed?: boolean | null
          person_id?: string | null
          priority?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          goal_id?: string | null
          id?: string
          is_completed?: boolean | null
          person_id?: string | null
          priority?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "todos_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "todos_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
