export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      click_events: {
        Row: {
          category: string;
          created_at: string;
          id: string;
          kind: string;
          label: string;
          product_id: string | null;
        };
        Insert: {
          category?: string;
          created_at?: string;
          id?: string;
          kind: string;
          label?: string;
          product_id?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          label?: string;
          product_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "click_events_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      hero_slides: {
        Row: {
          active: boolean;
          created_at: string;
          cta_href: string;
          cta_label: string;
          eyebrow: string;
          headline: string;
          id: string;
          image_url: string | null;
          overlay_opacity: number;
          sort_order: number;
          subtext: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          cta_href?: string;
          cta_label?: string;
          eyebrow?: string;
          headline?: string;
          id?: string;
          image_url?: string | null;
          overlay_opacity?: number;
          sort_order?: number;
          subtext?: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          cta_href?: string;
          cta_label?: string;
          eyebrow?: string;
          headline?: string;
          id?: string;
          image_url?: string | null;
          overlay_opacity?: number;
          sort_order?: number;
          subtext?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      leads: {
        Row: {
          budget: string | null;
          company: string | null;
          created_at: string;
          details: string | null;
          email: string;
          id: string;
          name: string;
          notes: string | null;
          service: string | null;
          starting_point: string | null;
          status: string;
          timeline: string | null;
          updated_at: string;
        };
        Insert: {
          budget?: string | null;
          company?: string | null;
          created_at?: string;
          details?: string | null;
          email: string;
          id?: string;
          name: string;
          notes?: string | null;
          service?: string | null;
          starting_point?: string | null;
          status?: string;
          timeline?: string | null;
          updated_at?: string;
        };
        Update: {
          budget?: string | null;
          company?: string | null;
          created_at?: string;
          details?: string | null;
          email?: string;
          id?: string;
          name?: string;
          notes?: string | null;
          service?: string | null;
          starting_point?: string | null;
          status?: string;
          timeline?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_sections: {
        Row: {
          created_at: string;
          heading: string;
          id: string;
          is_visible: boolean;
          key: string;
          name: string;
          sort_order: number;
          subheading: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          heading?: string;
          id?: string;
          is_visible?: boolean;
          key: string;
          name: string;
          sort_order?: number;
          subheading?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          heading?: string;
          id?: string;
          is_visible?: boolean;
          key?: string;
          name?: string;
          sort_order?: number;
          subheading?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_content_revisions: {
        Row: {
          created_at: string;
          created_by: string | null;
          document: Json;
          id: string;
          page_id: string;
          revision: number;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          document: Json;
          id?: string;
          page_id: string;
          revision: number;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          document?: Json;
          id?: string;
          page_id?: string;
          revision?: number;
        };
        Relationships: [];
      };
      saved_sections: {
        Row: {
          created_at: string;
          created_by: string | null;
          document: Json;
          id: string;
          name: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          document?: Json;
          id?: string;
          name: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          document?: Json;
          id?: string;
          name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      page_content: {
        Row: {
          created_at: string;
          draft: Json;
          draft_revision: number;
          page_id: string;
          published: Json;
          published_at: string | null;
          published_by: string | null;
          published_revision: number;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          created_at?: string;
          draft?: Json;
          draft_revision?: number;
          page_id: string;
          published?: Json;
          published_at?: string | null;
          published_by?: string | null;
          published_revision?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          created_at?: string;
          draft?: Json;
          draft_revision?: number;
          page_id?: string;
          published?: Json;
          published_at?: string | null;
          published_by?: string | null;
          published_revision?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
      page_published_content: {
        Row: {
          document: Json;
          page_id: string;
          published_at: string;
          revision: number;
        };
        Insert: {
          document?: Json;
          page_id: string;
          published_at?: string;
          revision?: number;
        };
        Update: {
          document?: Json;
          page_id?: string;
          published_at?: string;
          revision?: number;
        };
        Relationships: [];
      };
      products: {
        Row: {
          active: boolean;
          badges: string[];
          category: string;
          created_at: string;
          description: string;
          featured: boolean;
          id: string;
          image_url: string | null;
          images: string[];
          price_from: number;
          sale_price: number | null;
          sort_order: number;
          sku: string;
          stock_quantity: number;
          subtitle: string;
          title: string;
          updated_at: string;
          whatsapp_payload: string;
        };
        Insert: {
          active?: boolean;
          badges?: string[];
          category?: string;
          created_at?: string;
          description?: string;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          images?: string[];
          price_from?: number;
          sale_price?: number | null;
          sort_order?: number;
          sku?: string;
          stock_quantity?: number;
          subtitle?: string;
          title: string;
          updated_at?: string;
          whatsapp_payload?: string;
        };
        Update: {
          active?: boolean;
          badges?: string[];
          category?: string;
          created_at?: string;
          description?: string;
          featured?: boolean;
          id?: string;
          image_url?: string | null;
          images?: string[];
          price_from?: number;
          sale_price?: number | null;
          sort_order?: number;
          sku?: string;
          stock_quantity?: number;
          subtitle?: string;
          title?: string;
          updated_at?: string;
          whatsapp_payload?: string;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          body: string[];
          category: string;
          client: string;
          created_at: string;
          id: string;
          image_url: string | null;
          label: string;
          meta: string;
          published: boolean;
          services: string[];
          slug: string;
          sort_order: number;
          summary: string;
          title: string;
          updated_at: string;
          year: string;
        };
        Insert: {
          body?: string[];
          category?: string;
          client?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          label?: string;
          meta?: string;
          published?: boolean;
          services?: string[];
          slug: string;
          sort_order?: number;
          summary?: string;
          title: string;
          updated_at?: string;
          year?: string;
        };
        Update: {
          body?: string[];
          category?: string;
          client?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          label?: string;
          meta?: string;
          published?: boolean;
          services?: string[];
          slug?: string;
          sort_order?: number;
          summary?: string;
          title?: string;
          updated_at?: string;
          year?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          active: boolean;
          created_at: string;
          deliverables: string[];
          detail: string;
          id: string;
          name: string;
          sort_order: number;
          tag: string;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          deliverables?: string[];
          detail?: string;
          id?: string;
          name: string;
          sort_order?: number;
          tag?: string;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          deliverables?: string[];
          detail?: string;
          id?: string;
          name?: string;
          sort_order?: number;
          tag?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      site_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      social_links: {
        Row: {
          active: boolean;
          created_at: string;
          href: string;
          icon_key: string;
          id: string;
          label: string;
          sort_order: number;
          updated_at: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          href: string;
          icon_key?: string;
          id?: string;
          label: string;
          sort_order?: number;
          updated_at?: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          href?: string;
          icon_key?: string;
          id?: string;
          label?: string;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          permissions: Json;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          permissions?: Json;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          permissions?: Json;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      whatsapp_leads: {
        Row: {
          created_at: string;
          id: string;
          message: string;
          name: string;
          phone: string;
          product_id: string | null;
          product_title: string;
          source: string;
          status: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          message?: string;
          name?: string;
          phone: string;
          product_id?: string | null;
          product_title?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          message?: string;
          name?: string;
          phone?: string;
          product_id?: string | null;
          product_title?: string;
          source?: string;
          status?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_leads_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      app_role: "admin" | "editor" | "author" | "contributor" | "subscriber";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "editor", "author", "contributor", "subscriber"],
    },
  },
} as const;
