import { CampusEvent } from '@/types/event';
import { getLocationCoordinates, getPublishedChallenges } from '@/lib/adminChallenges';

export async function getActiveEvents(): Promise<CampusEvent[]> {
  if (typeof window === 'undefined') {
    return [];
  }

  return getPublishedChallenges().map((challenge) => {
    const coordinates = getLocationCoordinates(challenge.location);

    return {
      id: challenge.id,
      title: challenge.card?.title ?? challenge.title,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      radius_meters: coordinates.radius_meters,
      start_time: challenge.createdAt,
      end_time: '2030-01-01T00:00:00Z',
    };
  });
}