// Previously provided content of types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          password_hash: string
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          password_hash: string
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          password_hash?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultations: {
        Row: {
          additional_audio_urls: Json | null
          ai_generated_note: string | null
          primary_audio_url: string
          created_at: string
          doctor_id: string | null
          edited_note: string | null
          id: string
          image_urls: Json | null
          patient_number: number | null
          status: string
          submitted_by: string
          total_file_size_bytes: number | null
          file_retention_until: string | null
          updated_at: string
        }
        Insert: {
          additional_audio_urls?: Json | null
          ai_generated_note?: string | null
          primary_audio_url: string
          created_at?: string
          doctor_id?: string | null
          edited_note?: string | null
          id?: string
          image_urls?: Json | null
          patient_number?: number | null
          status?: string
          submitted_by: string
          total_file_size_bytes?: number | null
          file_retention_until?: string | null
          updated_at?: string
        }
        Update: {
          additional_audio_urls?: Json | null
          ai_generated_note?: string | null
          primary_audio_url?: string
          created_at?: string
          doctor_id?: string | null
          edited_note?: string | null
          id?: string
          image_urls?: Json | null
          patient_number?: number | null
          status?: string
          submitted_by?: string
          total_file_size_bytes?: number | null
          file_retention_until?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      doctors: {
        Row: {
          approved: boolean
          approved_at: string | null
          approved_by: string | null
          clinic_name: string | null
          created_at: string
          email: string
          id: string
          monthly_quota: number
          name: string
          password_hash: string
          phone: string | null
          quota_reset_at: string
          quota_used: number
          template_config: Json
          updated_at: string
        }
        Insert: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          clinic_name?: string | null
          created_at?: string
          email: string
          id?: string
          monthly_quota?: number
          name: string
          password_hash: string
          phone?: string | null
          quota_reset_at?: string
          quota_used?: number
          template_config?: Json
          updated_at?: string
        }
        Update: {
          approved?: boolean
          approved_at?: string | null
          approved_by?: string | null
          clinic_name?: string | null
          created_at?: string
          email?: string
          id?: string
          monthly_quota?: number
          name?: string
          password_hash?: string
          phone?: string | null
          quota_reset_at?: string
          quota_used?: number
          template_config?: Json
          updated_at?: string
        }
        Relationships: []
      }
      usage_logs: {
        Row: {
          action_type: string
          consultation_id: string | null
          created_at: string
          doctor_id: string | null
          id: string
          metadata: Json | null
          quota_after: number | null
          quota_before: number | null
        }
        Insert: {
          action_type: string
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          metadata?: Json | null
          quota_after?: number | null
          quota_before?: number | null
        }
        Update: {
          action_type?: string
          consultation_id?: string | null
          created_at?: string
          doctor_id?: string | null
          id?: string
          metadata?: Json | null
          quota_after?: number | null
          quota_before?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_logs_consultation_id_fkey"
            columns: ["consultation_id"]
            isOneToOne: false
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_logs_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "doctors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_and_update_quota: {
        Args: { doctor_uuid: string }
        Returns: boolean
      }
      reset_all_quotas: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_doctor_quota: {
        Args: { doctor_uuid: string; new_quota: number; admin_uuid: string }
        Returns: boolean
      }
      set_patient_number: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      }
      update_updated_at_column: {
        Args: Record<PropertyKey, never>;
        Returns: unknown;
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const

// *******************************************************************
// APPLICATION-SPECIFIC ADDITIONS (Crucial for your codebase to compile)
// *******************************************************************

// 1. Export `Doctor` type (convenience alias for Tables<'doctors'>)
export type Doctor = Tables<'doctors'>;

// 2. Export `Consultation` type (convenience alias for Tables<'consultations'>)
export type Consultation = Tables<'consultations'>;

// 3. Export `Admin` type (convenience alias for Tables<'admins'>)
export type Admin = Tables<'admins'>;

// 4. Define and Export `TemplateConfig` type
export interface TemplateConfig {
  prescription_format: 'standard' | string;
  language: 'english' | string;
  tone: 'professional' | string;
  sections: string[];
  [key: string]: Json;
}

// 5. Export `jsonToTemplateConfig` function
export const jsonToTemplateConfig = (json: Json | null): TemplateConfig => {
  const defaultTemplateConfig: TemplateConfig = {
    prescription_format: 'standard',
    language: 'english',
    tone: 'professional',
    sections: ['symptoms', 'diagnosis', 'prescription', 'advice', 'follow_up']
  };

  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    return defaultTemplateConfig;
  }

  // Remove any undefined values to satisfy the TemplateConfig index signature
  const filtered = Object.entries(json as Partial<TemplateConfig>)
    .filter(([_, v]) => v !== undefined)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
  return {
    ...defaultTemplateConfig,
    ...filtered
  };
};

// 6. Export `templateConfigToJson` function
export const templateConfigToJson = (config: TemplateConfig): Json => {
  return config as Json;
};

// 7. Define and Export `ApiResponse` type (for server actions/API responses)
export type ApiResponse<T> = { success: true; data: T } | { success: false; error: string };

// 8. Define and Export `AdminDashboardStats` type
export interface AdminDashboardStats {
  total_doctors: number;
  pending_approvals: number;
  approved_doctors: number;
  total_consultations: number;
  total_ai_generations: number;
  quota_usage_percentage: number;
}

// 9. Define and Export `DashboardStats` type
export interface DashboardStats {
  total_consultations: number;
  pending_consultations: number;
  generated_consultations: number;
  approved_consultations: number;
  today_consultations: number;
}

// 10. Define and Export `QuotaInfo` type - NEW
export interface QuotaInfo {
  monthly_quota: number;
  quota_used: number;
  quota_remaining: number;
  quota_percentage: number;
  quota_reset_at: string;
  days_until_reset: number;
}


// 11. Define and Export `DoctorWithStats` type (combines Doctor Row with derived stats)
// Omit 'consultations' as it's an intermediate query result, not part of the final type
export type DoctorWithStats = Omit<Tables<'doctors'>, 'consultations' | 'phone' | 'clinic_name' | 'approved_by' | 'approved_at' | 'template_config'> & {
  phone?: string;
  clinic_name?: string;
  approved_by?: string;
  approved_at?: string;
  template_config: TemplateConfig;

  total_consultations: number;
  this_month_generations: number;
  quota_percentage: number;
  last_activity?: string;
};

// 12. Define and Export `AdminActionRequest` type
export type AdminActionRequest =
  | { action: 'approve'; doctor_id: string }
  | { action: 'reject'; doctor_id: string }
  | { action: 'update_quota'; doctor_id: string; data: { quota: number; reason?: string } }
  | { action: 'disable'; doctor_id: string }
  | { action: 'enable'; doctor_id: string };

// 13. Define and Export `FormState` type
export interface FormState {
  success: boolean;
  message: string;
  fieldErrors?: { [key: string]: string[] };
}

// In src/lib/types.ts (modify existing definitions)

export interface ImageFile {
  id: string; // Used for key and filtering
  file: File; // Store the actual File object
  preview: string; // URL.createObjectURL for display
  name: string;
  type: string; // Ensure type is present for validation
  size: number; // Ensure size is present for validation
}

export interface ImageCaptureState {
  images: ImageFile[];
  status?: 'idle' | 'capturing' | 'uploaded' | 'error';
  error: string | null;
}

export interface AudioRecordingState {
  isRecording: boolean;
  duration: number; // In seconds
  audioBlob?: Blob; // Store the Blob object
  audioFile?: File; // Convert the Blob to a File for upload API
  error?: string | null;
  status?: 'idle' | 'recording' | 'recorded' | 'uploading' | 'uploaded' | 'error';
}
// 17. Define and Export `SessionPayload` type
export interface SessionPayload {
  userId: string;
  expiresAt: Date;
  adminId?: string;
  role?: 'admin' | 'super_admin';
}