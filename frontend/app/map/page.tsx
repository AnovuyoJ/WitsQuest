'use client';

import dynamic from 'next/dynamic';

const CampusMap = dynamic(() => import('@/components/CampusMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>,
});

export default function MapPage() {
  return <CampusMap />;
}