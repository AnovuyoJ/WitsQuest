//calculates distance

export function getDistanceMeters(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371000; // Earth radius in meters
    const toRad = (deg: number) => (deg * Math.PI) / 180;
  
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
  
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
    return R * c;
  }
  
  export function getEventStatus(
    event: { latitude: number; longitude: number; radius_meters: number; start_time: string; end_time: string },
    playerLat: number,
    playerLon: number
  ): 'in-range' | 'out-of-range' | 'expired' {
    const now = new Date();
    if (now > new Date(event.end_time)) return 'expired';
  
    const distance = getDistanceMeters(playerLat, playerLon, event.latitude, event.longitude);
    return distance <= event.radius_meters ? 'in-range' : 'out-of-range';
  }