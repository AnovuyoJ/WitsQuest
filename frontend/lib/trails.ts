export type TrailStop = {
  event_id: string; position: number; event_title: string | null; available: boolean;
  active: boolean; completed: boolean; total_questions: number; completed_questions: number;
  starts_at: string | null; ends_at: string | null;
};
export type Trail = {
  id: string; title: string; description: string | null; stops: TrailStop[];
  completed_stops: number; next_event_id: string | null;
};
export type TrailDraft = {
  id: string; title: string; description: string | null; event_ids: string[];
  draft_revision: number; published_revision: number | null;
};
