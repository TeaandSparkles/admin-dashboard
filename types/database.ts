// Minimal hand-written types. Replace with the generated output of:
//   npx supabase gen types typescript --project-id <your-project-id> > types/database.ts
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          role: string;
          created_at: string;
          referral_code: string | null;
        };
        Insert: Partial<{ id: string; email: string; role: string; created_at: string; referral_code: string | null }>;
        Update: Partial<{ id: string; email: string; role: string; created_at: string; referral_code: string | null }>;
      };
      novels: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          cover_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<{ id: string; title: string; description: string | null; cover_url: string | null; created_at: string; updated_at: string }>;
        Update: Partial<{ id: string; title: string; description: string | null; cover_url: string | null; created_at: string; updated_at: string }>;
      };
      stories: {
        Row: {
          id: string;
          novel_id: string;
          title: string;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<{ id: string; novel_id: string; title: string; order_index: number; created_at: string }>;
        Update: Partial<{ id: string; novel_id: string; title: string; order_index: number; created_at: string }>;
      };
      chapters: {
        Row: {
          id: string;
          story_id: string;
          title: string;
          content: string | null;
          order_index: number;
          created_at: string;
        };
        Insert: Partial<{ id: string; story_id: string; title: string; content: string | null; order_index: number; created_at: string }>;
        Update: Partial<{ id: string; story_id: string; title: string; content: string | null; order_index: number; created_at: string }>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string;
          total_amount: number;
          status: string;
          created_at: string;
        };
        Insert: Partial<{ id: string; user_id: string; total_amount: number; status: string; created_at: string }>;
        Update: Partial<{ id: string; user_id: string; total_amount: number; status: string; created_at: string }>;
      };
      shipments: {
        Row: {
          id: string;
          order_id: string;
          tracking_number: string | null;
          carrier: string | null;
          status: string;
          shipped_at: string | null;
          delivered_at: string | null;
        };
        Insert: Partial<{ id: string; order_id: string; tracking_number: string | null; carrier: string | null; status: string; shipped_at: string | null; delivered_at: string | null }>;
        Update: Partial<{ id: string; order_id: string; tracking_number: string | null; carrier: string | null; status: string; shipped_at: string | null; delivered_at: string | null }>;
      };
      coin_transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          type: string;
          description: string | null;
          created_at: string;
        };
        Insert: Partial<{ id: string; user_id: string; amount: number; type: string; description: string | null; created_at: string }>;
        Update: Partial<{ id: string; user_id: string; amount: number; type: string; description: string | null; created_at: string }>;
      };
      referrals: {
        Row: { id: string; referrer_id: string; referred_id: string; created_at: string };
        Insert: Partial<{ id: string; referrer_id: string; referred_id: string; created_at: string }>;
        Update: Partial<{ id: string; referrer_id: string; referred_id: string; created_at: string }>;
      };
      story_access: {
        Row: { id: string; user_id: string; story_id: string; granted_at: string };
        Insert: Partial<{ id: string; user_id: string; story_id: string; granted_at: string }>;
        Update: Partial<{ id: string; user_id: string; story_id: string; granted_at: string }>;
      };
      user_progress: {
        Row: { id: string; user_id: string; chapter_id: string; updated_at: string };
        Insert: Partial<{ id: string; user_id: string; chapter_id: string; updated_at: string }>;
        Update: Partial<{ id: string; user_id: string; chapter_id: string; updated_at: string }>;
      };
      user_entitlements: {
        Row: { id: string; user_id: string; entitlement: string; created_at: string };
        Insert: Partial<{ id: string; user_id: string; entitlement: string; created_at: string }>;
        Update: Partial<{ id: string; user_id: string; entitlement: string; created_at: string }>;
      };
      audit_logs: {
        Row: { id: string; user_id: string; action: string; metadata: unknown; created_at: string };
        Insert: Partial<{ id: string; user_id: string; action: string; metadata: unknown; created_at: string }>;
        Update: Partial<{ id: string; user_id: string; action: string; metadata: unknown; created_at: string }>;
      };
      settings: {
        Row: { id: string; key: string; value: unknown; updated_at: string };
        Insert: Partial<{ id: string; key: string; value: unknown; updated_at: string }>;
        Update: Partial<{ id: string; key: string; value: unknown; updated_at: string }>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
