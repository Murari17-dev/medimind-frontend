export type Confidence = 'high' | 'medium' | 'low';

export interface Medication {
  name: string;
  dosage: string;
  instructions: string;
  times_of_day: string[];
  frequency_per_day?: number | null;
  duration_days?: number | null;
  verification_note?: string | null;
  name_confidence?: Confidence;
  dosage_confidence?: Confidence;
  frequency_confidence?: Confidence;
}

export interface Prescription {
  id: number;
  doctor_notes?: string | null;
  created_at?: string | null;
  medications: Medication[];
}

export interface Reminder {
  id: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  reminder_time: string;
  start_date: string;
  end_date: string;
  timezone: string;
  enabled: boolean;
  prescription_id?: number | null;
}

export interface DueReminder {
  id: string;
  medication_name: string;
  dosage: string;
  instructions: string;
  timezone: string;
  scheduled_for: string;
  occurrence_status: 'due' | 'missed';
}
