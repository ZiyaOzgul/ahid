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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      articles: {
        Row: {
          author_avatar: string | null
          author_id: number | null
          author_name: string
          author_title: string | null
          board_member_id: number | null
          category: string
          content: string | null
          created_at: string
          id: number
          image_url: string | null
          published_at: string | null
          read_time: string | null
          slug: string
          summary: string | null
          title: string
          views_count: number | null
        }
        Insert: {
          author_avatar?: string | null
          author_id?: number | null
          author_name: string
          author_title?: string | null
          board_member_id?: number | null
          category: string
          content?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          published_at?: string | null
          read_time?: string | null
          slug: string
          summary?: string | null
          title: string
          views_count?: number | null
        }
        Update: {
          author_avatar?: string | null
          author_id?: number | null
          author_name?: string
          author_title?: string | null
          board_member_id?: number | null
          category?: string
          content?: string | null
          created_at?: string
          id?: never
          image_url?: string | null
          published_at?: string | null
          read_time?: string | null
          slug?: string
          summary?: string | null
          title?: string
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "articles_board_member_id_fkey"
            columns: ["board_member_id"]
            isOneToOne: false
            referencedRelation: "board_members"
            referencedColumns: ["id"]
          },
        ]
      }
      board_members: {
        Row: {
          achievements: string[] | null
          bio: string | null
          category: string
          created_at: string
          created_by: number | null
          focus_areas: string | null
          full_name: string
          id: number
          is_active: boolean | null
          is_founding_president: boolean | null
          order_no: number | null
          organization: string | null
          photo_url: string | null
          quote: string | null
          registry_info: string | null
          term_label: string | null
          term_period: string | null
          title: string
        }
        Insert: {
          achievements?: string[] | null
          bio?: string | null
          category?: string
          created_at?: string
          created_by?: number | null
          focus_areas?: string | null
          full_name: string
          id?: never
          is_active?: boolean | null
          is_founding_president?: boolean | null
          order_no?: number | null
          organization?: string | null
          photo_url?: string | null
          quote?: string | null
          registry_info?: string | null
          term_label?: string | null
          term_period?: string | null
          title: string
        }
        Update: {
          achievements?: string[] | null
          bio?: string | null
          category?: string
          created_at?: string
          created_by?: number | null
          focus_areas?: string | null
          full_name?: string
          id?: never
          is_active?: boolean | null
          is_founding_president?: boolean | null
          order_no?: number | null
          organization?: string | null
          photo_url?: string | null
          quote?: string | null
          registry_info?: string | null
          term_label?: string | null
          term_period?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_members_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_variables: {
        Row: {
          description: string | null
          id: number
          key: string
          page: string
          section: string
          updated_at: string
          updated_by: number | null
          value: string
        }
        Insert: {
          description?: string | null
          id?: never
          key: string
          page: string
          section: string
          updated_at?: string
          updated_by?: number | null
          value: string
        }
        Update: {
          description?: string | null
          id?: never
          key?: string
          page?: string
          section?: string
          updated_at?: string
          updated_by?: number | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "cms_variables_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_messages: {
        Row: {
          admin_notes: string | null
          created_at: string
          department: string | null
          email: string
          handled_by: number | null
          id: number
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
          type: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          department?: string | null
          email: string
          handled_by?: number | null
          id?: never
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          type?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          department?: string | null
          email?: string
          handled_by?: number | null
          id?: never
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_handled_by_fkey"
            columns: ["handled_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          authority: string | null
          category: string
          created_at: string
          description: string | null
          document_code: string | null
          file_format: string
          file_size: string | null
          file_url: string | null
          id: number
          is_featured: boolean | null
          revision_date: string | null
          signature_status: string | null
          subtitle: string | null
          title: string
          uploaded_by: number | null
        }
        Insert: {
          authority?: string | null
          category?: string
          created_at?: string
          description?: string | null
          document_code?: string | null
          file_format?: string
          file_size?: string | null
          file_url?: string | null
          id?: never
          is_featured?: boolean | null
          revision_date?: string | null
          signature_status?: string | null
          subtitle?: string | null
          title: string
          uploaded_by?: number | null
        }
        Update: {
          authority?: string | null
          category?: string
          created_at?: string
          description?: string | null
          document_code?: string | null
          file_format?: string
          file_size?: string | null
          file_url?: string | null
          id?: never
          is_featured?: boolean | null
          revision_date?: string | null
          signature_status?: string | null
          subtitle?: string | null
          title?: string
          uploaded_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string | null
          email: string
          event_id: number
          full_name: string
          id: number
          organization: string | null
          phone: string | null
          status: string | null
          ticket_type: string | null
          title: string | null
          user_id: number | null
        }
        Insert: {
          created_at?: string | null
          email: string
          event_id: number
          full_name: string
          id?: number
          organization?: string | null
          phone?: string | null
          status?: string | null
          ticket_type?: string | null
          title?: string | null
          user_id?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string
          event_id?: number
          full_name?: string
          id?: number
          organization?: string | null
          phone?: string | null
          status?: string | null
          ticket_type?: string | null
          title?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_registrations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          created_at: string
          created_by: number | null
          description: string | null
          event_date: string
          event_time: string | null
          id: number
          image_url: string | null
          is_featured: boolean | null
          location: string | null
          registration_open: boolean | null
          summary: string | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: number | null
          description?: string | null
          event_date: string
          event_time?: string | null
          id?: never
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          registration_open?: boolean | null
          summary?: string | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: number | null
          description?: string | null
          event_date?: string
          event_time?: string | null
          id?: never
          image_url?: string | null
          is_featured?: boolean | null
          location?: string | null
          registration_open?: boolean | null
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          alt_text: string | null
          aspect_ratio: string | null
          bucket: string
          category: string
          created_at: string
          dimensions: string | null
          file_name: string
          file_size: string | null
          file_url: string
          format: string | null
          id: number
          is_live: boolean | null
          title: string | null
          uploaded_by: number | null
          usage_locations: string[] | null
        }
        Insert: {
          alt_text?: string | null
          aspect_ratio?: string | null
          bucket?: string
          category?: string
          created_at?: string
          dimensions?: string | null
          file_name: string
          file_size?: string | null
          file_url: string
          format?: string | null
          id?: never
          is_live?: boolean | null
          title?: string | null
          uploaded_by?: number | null
          usage_locations?: string[] | null
        }
        Update: {
          alt_text?: string | null
          aspect_ratio?: string | null
          bucket?: string
          category?: string
          created_at?: string
          dimensions?: string | null
          file_name?: string
          file_size?: string | null
          file_url?: string
          format?: string | null
          id?: never
          is_live?: boolean | null
          title?: string | null
          uploaded_by?: number | null
          usage_locations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "media_assets_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      member_dues: {
        Row: {
          amount: number
          created_at: string
          id: number
          paid_at: string | null
          period: string
          receipt_no: string | null
          receipt_url: string | null
          status: string
          user_id: number
        }
        Insert: {
          amount?: number
          created_at?: string
          id?: never
          paid_at?: string | null
          period: string
          receipt_no?: string | null
          receipt_url?: string | null
          status?: string
          user_id: number
        }
        Update: {
          amount?: number
          created_at?: string
          id?: never
          paid_at?: string | null
          period?: string
          receipt_no?: string | null
          receipt_url?: string | null
          status?: string
          user_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "member_dues_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      membership_applications: {
        Row: {
          admin_notes: string | null
          application_no: string
          birth_date: string | null
          city: string | null
          created_at: string
          cv_url: string | null
          degree: string | null
          email: string
          experience_years: string | null
          first_name: string
          graduation_year: string | null
          id: number
          last_name: string
          linkedin_url: string | null
          organization: string | null
          phone: string
          position: string | null
          reviewed_by: number | null
          status: string
          tc_no: string
          tier: string
          university: string | null
          user_id: number | null
        }
        Insert: {
          admin_notes?: string | null
          application_no: string
          birth_date?: string | null
          city?: string | null
          created_at?: string
          cv_url?: string | null
          degree?: string | null
          email: string
          experience_years?: string | null
          first_name: string
          graduation_year?: string | null
          id?: never
          last_name: string
          linkedin_url?: string | null
          organization?: string | null
          phone: string
          position?: string | null
          reviewed_by?: number | null
          status?: string
          tc_no: string
          tier: string
          university?: string | null
          user_id?: number | null
        }
        Update: {
          admin_notes?: string | null
          application_no?: string
          birth_date?: string | null
          city?: string | null
          created_at?: string
          cv_url?: string | null
          degree?: string | null
          email?: string
          experience_years?: string | null
          first_name?: string
          graduation_year?: string | null
          id?: never
          last_name?: string
          linkedin_url?: string | null
          organization?: string | null
          phone?: string
          position?: string | null
          reviewed_by?: number | null
          status?: string
          tc_no?: string
          tier?: string
          university?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "membership_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membership_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      news_announcements: {
        Row: {
          author_id: number | null
          bulletin_no: string | null
          category: string
          content: string | null
          created_at: string
          highlights: string[] | null
          id: number
          image_url: string | null
          is_featured: boolean | null
          is_member_only: boolean | null
          location: string | null
          published_at: string | null
          read_time: string | null
          slug: string
          summary: string | null
          title: string
        }
        Insert: {
          author_id?: number | null
          bulletin_no?: string | null
          category?: string
          content?: string | null
          created_at?: string
          highlights?: string[] | null
          id?: never
          image_url?: string | null
          is_featured?: boolean | null
          is_member_only?: boolean | null
          location?: string | null
          published_at?: string | null
          read_time?: string | null
          slug: string
          summary?: string | null
          title: string
        }
        Update: {
          author_id?: number | null
          bulletin_no?: string | null
          category?: string
          content?: string | null
          created_at?: string
          highlights?: string[] | null
          id?: never
          image_url?: string | null
          is_featured?: boolean | null
          is_member_only?: boolean | null
          location?: string | null
          published_at?: string | null
          read_time?: string | null
          slug?: string
          summary?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_announcements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: number
          user_id: number | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: never
          user_id?: number | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: never
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_subscribers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          id: number
          member_no: string | null
          password_hash: string
          phone: string | null
          role: string
          tc_no: string | null
          title: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: never
          member_no?: string | null
          password_hash: string
          phone?: string | null
          role?: string
          tc_no?: string | null
          title?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: never
          member_no?: string | null
          password_hash?: string
          phone?: string | null
          role?: string
          tc_no?: string | null
          title?: string | null
        }
        Relationships: []
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
