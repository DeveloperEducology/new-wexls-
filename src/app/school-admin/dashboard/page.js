'use client';

import ShowcaseDashboard from '@/app/dashboard/page';

export default function SchoolAdminDashboardPage() {
  return (
    <ShowcaseDashboard roleLock="school-admin" hideSwitcher={true} />
  );
}
