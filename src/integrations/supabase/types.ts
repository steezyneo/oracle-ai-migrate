export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      deployment_logs: {
        Row: {
          created_at: string
          error_message: string | null
          file_count: number
          id: string
          lines_of_sql: number
          migration_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_count?: number
          id?: string
          lines_of_sql?: number
          migration_id?: string | null
          status: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_count?: number
          id?: string
          lines_of_sql?: number
          migration_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      migration_files: {
        Row: {
          conversion_status: string
          converted_content: string | null
          created_at: string
          data_type_mapping: Json | null
          error_message: string | null
          file_name: string
          file_path: string
          file_type: string
          id: string
          issues: Json | null
          migration_id: string
          original_content: string | null
          performance_metrics: Json | null
          syntax_differences: Json | null
          updated_at: string
        }
        Insert: {
          conversion_status?: string
          converted_content?: string | null
          created_at?: string
          data_type_mapping?: Json | null
          error_message?: string | null
          file_name: string
          file_path: string
          file_type: string
          id?: string
          issues?: Json | null
          migration_id: string
          original_content?: string | null
          performance_metrics?: Json | null
          syntax_differences?: Json | null
          updated_at?: string
        }
        Update: {
          conversion_status?: string
          converted_content?: string | null
          created_at?: string
          data_type_mapping?: Json | null
          error_message?: string | null
          file_name?: string
          file_path?: string
          file_type?: string
          id?: string
          issues?: Json | null
          migration_id?: string
          original_content?: string | null
          performance_metrics?: Json | null
          syntax_differences?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "migration_files_migration_id_fkey"
            columns: ["migration_id"]
            isOneToOne: false
            referencedRelation: "migrations"
            referencedColumns: ["id"]
          },
        ]
      }
      migration_reports: {
        Row: {
          created_at: string
          efficiency_metrics: Json | null
          id: string
          migration_id: string
          report_content: string
        }
        Insert: {
          created_at?: string
          efficiency_metrics?: Json | null
          id?: string
          migration_id: string
          report_content: string
        }
        Update: {
          created_at?: string
          efficiency_metrics?: Json | null
          id?: string
          migration_id?: string
          report_content?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          created_at: string
          folder_structure: Json | null
          id: string
          project_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          folder_structure?: Json | null
          id?: string
          project_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          folder_structure?: Json | null
          id?: string
          project_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      unreviewed_files: {
        Row: {
          converted_code: string
          created_at: string
          file_name: string
          id: string
          original_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          converted_code: string
          created_at?: string
          file_name: string
          id?: string
          original_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          converted_code?: string
          created_at?: string
          file_name?: string
          id?: string
          original_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      file_comments: {
        Row: {
          id: string;
          file_path: string;
          content: string;
          tag: 'Issue' | 'Suggestion' | 'Question' | 'Resolved' | 'Note' | 'Todo' | 'Praise';
          created_at: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          id?: string;
          file_path: string;
          content: string;
          tag: 'Issue' | 'Suggestion' | 'Question' | 'Resolved' | 'Note' | 'Todo' | 'Praise';
          created_at?: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          id?: string;
          file_path?: string;
          content?: string;
          tag?: 'Issue' | 'Suggestion' | 'Question' | 'Resolved' | 'Note' | 'Todo' | 'Praise';
          created_at?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "file_comments_user_id_fkey",
            columns: ["user_id"],
            isOneToOne: false,
            referencedRelation: "users",
            referencedColumns: ["id"]
          }
        ];
      };
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
