import { CampusEvent } from '@/types/event';

//mock data for now — remove once Supabase table exists
const MOCK_EVENTS: CampusEvent[] = [
  {
    id: '1',
    title: 'Origins Centre Trivia',
    latitude: -26.1918,
    longitude: 28.0295,
    radius_meters: 30,
    start_time: '2026-01-01T00:00:00Z',
    end_time: '2030-01-01T00:00:00Z',
  },
  {
    id: '2',
    title: 'Great Hall Landmark Quiz',
    latitude: -26.1925,
    longitude: 28.0310,
    radius_meters: 25,
    start_time: '2026-01-01T00:00:00Z',
    end_time: '2030-01-01T00:00:00Z',
  },
];

export async function getActiveEvents(): Promise<CampusEvent[]> {
  //replace with real Supabase query once the events table exists
  //const { data, error } = await supabase.from('events').select('*');
  //if (error) throw error;
  //return data;

  return Promise.resolve(MOCK_EVENTS);
}