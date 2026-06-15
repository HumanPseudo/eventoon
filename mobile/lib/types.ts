export interface Event {
  id: number;
  name: string;
  description: string;
  date: string;
  max_capacity: number;
  attendee_count: number;
}

export interface EventStats {
  id: number;
  name: string;
  total_registrations: number;
  max_capacity: number;
}

export interface AISummary {
  summary: string;
  cached: boolean;
}

export interface Registration {
  id: number;
  event_id: number;
  user_name: string;
  email: string;
  registration_date: string;
}
