'use client';

import React, { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { PracticePageContent } from '../../../../page';

export default function NestedPracticePage() {
  const params = useParams();

  return (
    <Suspense fallback={<div style={{ padding: 40, fontWeight: 800, color: '#0f172a' }}>Loading practice session...</div>}>
      <PracticePageContent routeParams={params} />
    </Suspense>
  );
}
