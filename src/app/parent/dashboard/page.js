'use client';

import ShowcaseDashboard from '@/app/dashboard/page';

export default function ParentDashboardPage() {
  return (
    <ShowcaseDashboard roleLock="parent" hideSwitcher={true} />
  );
}
