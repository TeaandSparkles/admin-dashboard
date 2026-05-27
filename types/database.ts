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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          created_at: string | null
          duration_seconds: number | null
          id: string
          story_id: string | null
          title: string | null
          video_url: string | null
        }
        Insert: {
          chapter_number: number
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          story_id?: string | null
          title?: string | null
          video_url?: string | null
        }
        Update: {
          chapter_number?: number
          created_at?: string | null
          duration_seconds?: number | null
          id?: string
          story_id?: string | null
          title?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
        ]
      }
      coin_transactions: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          reason: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          reason?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coin_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      novels: {
        Row: {
          age_group: string | null
          content_type: string | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          id: string
          published: boolean | null
          theme: string | null
          title: string
        }
        Insert: {
          age_group?: string | null
          content_type?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          published?: boolean | null
          theme?: string | null
          title: string
        }
        Update: {
          age_group?: string | null
          content_type?: string | null
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          published?: boolean | null
          theme?: string | null
          title?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          base_print_cost: number | null
          cancellation_deadline: string | null
          created_at: string | null
          id: string
          shipping_address: string | null
          shipping_cost: number | null
          shipping_email: string | null
          shipping_name: string | null
          shipping_phone: string | null
          status: string | null
          story_id: string | null
          story_price: number | null
          total_amount: number | null
          user_id: string | null
        }
        Insert: {
          base_print_cost?: number | null
          cancellation_deadline?: string | null
          created_at?: string | null
          id?: string
          shipping_address?: string | null
          shipping_cost?: number | null
          shipping_email?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          status?: string | null
          story_id?: string | null
          story_price?: number | null
          total_amount?: number | null
          user_id?: string | null
        }
        Update: {
          base_print_cost?: number | null
          cancellation_deadline?: string | null
          created_at?: string | null
          id?: string
          shipping_address?: string | null
          shipping_cost?: number | null
          shipping_email?: string | null
          shipping_name?: string | null
          shipping_phone?: string | null
          status?: string | null
          story_id?: string | null
          story_price?: number | null
          total_amount?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          order_id: string | null
          provider: string | null
          provider_payment_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          order_id?: string | null
          provider?: string | null
          provider_payment_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referred_user_id: string | null
          referrer_user_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referred_user_id?: string | null
          referrer_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_user_id_fkey"
            columns: ["referrer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          default_print_cost: number | null
          default_shipping_cost: number | null
          founders_pass_enabled: boolean | null
          id: string
          referral_purchase_reward: number | null
          referral_signup_reward: number | null
          story_default_coin_cost: number | null
          updated_at: string | null
        }
        Insert: {
          default_print_cost?: number | null
          default_shipping_cost?: number | null
          founders_pass_enabled?: boolean | null
          id?: string
          referral_purchase_reward?: number | null
          referral_signup_reward?: number | null
          story_default_coin_cost?: number | null
          updated_at?: string | null
        }
        Update: {
          default_print_cost?: number | null
          default_shipping_cost?: number | null
          founders_pass_enabled?: boolean | null
          id?: string
          referral_purchase_reward?: number | null
          referral_signup_reward?: number | null
          story_default_coin_cost?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string | null
          type: string
          title: string
          message: string | null
          read: boolean
          created_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          type: string
          title: string
          message?: string | null
          read?: boolean
          created_at?: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          user_id?: string | null
          type?: string
          title?: string
          message?: string | null
          read?: boolean
          created_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      media_assets: {
        Row: {
          id: string
          type: string
          url: string
          linked_chapter_id: string | null
          linked_story_id: string | null
          linked_novel_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          type: string
          url: string
          linked_chapter_id?: string | null
          linked_story_id?: string | null
          linked_novel_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          type?: string
          url?: string
          linked_chapter_id?: string | null
          linked_story_id?: string | null
          linked_novel_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          id: string
          chapter_id: string | null
          story_id: string | null
          version_number: number
          prompt_used: string | null
          generated_text: string | null
          status: string
          approved_by: string | null
          approved_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chapter_id?: string | null
          story_id?: string | null
          version_number?: number
          prompt_used?: string | null
          generated_text?: string | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chapter_id?: string | null
          story_id?: string | null
          version_number?: number
          prompt_used?: string | null
          generated_text?: string | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string | null
          id: string
          order_id: string | null
          package_photo_url: string | null
          status: string | null
          tracking_number: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          package_photo_url?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string | null
          id?: string
          order_id?: string | null
          package_photo_url?: string | null
          status?: string | null
          tracking_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          created_at: string | null
          description: string | null
          free_preview_minutes: number | null
          fulfillment_type: string | null
          id: string
          novel_id: string | null
          order_index: number | null
          published: boolean | null
          story_price: number | null
          title: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          free_preview_minutes?: number | null
          fulfillment_type?: string | null
          id?: string
          novel_id?: string | null
          order_index?: number | null
          published?: boolean | null
          story_price?: number | null
          title: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          free_preview_minutes?: number | null
          fulfillment_type?: string | null
          id?: string
          novel_id?: string | null
          order_index?: number | null
          published?: boolean | null
          story_price?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
        ]
      }
      story_access: {
        Row: {
          access_type: string | null
          created_at: string | null
          id: string
          story_id: string | null
          user_id: string | null
        }
        Insert: {
          access_type?: string | null
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Update: {
          access_type?: string | null
          created_at?: string | null
          id?: string
          story_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_access_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "stories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "story_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_entitlements: {
        Row: {
          entitlement_type: string
          id: string
          purchased_at: string | null
          scope_policy: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          entitlement_type: string
          id?: string
          purchased_at?: string | null
          scope_policy?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          entitlement_type?: string
          id?: string
          purchased_at?: string | null
          scope_policy?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_entitlements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_library: {
        Row: {
          created_at: string | null
          id: string
          novel_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          novel_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          novel_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_library_novel_id_fkey"
            columns: ["novel_id"]
            isOneToOne: false
            referencedRelation: "novels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_library_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          chapter_id: string | null
          completed: boolean | null
          id: string
          last_position_seconds: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          chapter_id?: string | null
          completed?: boolean | null
          id?: string
          last_position_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          chapter_id?: string | null
          completed?: boolean | null
          id?: string
          last_position_seconds?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_progress_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          coin_balance: number | null
          created_at: string | null
          default_shipping_address: string | null
          default_shipping_name: string | null
          default_shipping_phone: string | null
          email: string | null
          email_verified: boolean | null
          id: string
          phone_number: string | null
          phone_verified: boolean | null
          referral_code: string | null
          referred_by_user_id: string | null
          role: string | null
          username: string
        }
        Insert: {
          coin_balance?: number | null
          created_at?: string | null
          default_shipping_address?: string | null
          default_shipping_name?: string | null
          default_shipping_phone?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by_user_id?: string | null
          role?: string | null
          username: string
        }
        Update: {
          coin_balance?: number | null
          created_at?: string | null
          default_shipping_address?: string | null
          default_shipping_name?: string | null
          default_shipping_phone?: string | null
          email?: string | null
          email_verified?: boolean | null
          id?: string
          phone_number?: string | null
          phone_verified?: boolean | null
          referral_code?: string | null
          referred_by_user_id?: string | null
          role?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_user_id_fkey"
            columns: ["referred_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_accounting: { Args: never; Returns: boolean }
      is_admin: { Args: never; Returns: boolean }
      is_management: { Args: never; Returns: boolean }
      is_admin_or_accounting: { Args: never; Returns: boolean }
      is_admin_or_management: { Args: never; Returns: boolean }
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
