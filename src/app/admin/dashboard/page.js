'use client';

import ShowcaseDashboard from '@/app/dashboard/page';

export default function PlatformAdminDashboardPage() {
  return (
    <ShowcaseDashboard roleLock="admin" hideSwitcher={true} />
  );
}
