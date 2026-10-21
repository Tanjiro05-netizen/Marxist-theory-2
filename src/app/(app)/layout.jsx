'use client';

import MainLayout from '@/src/components/MainLayout.jsx';

/**
 * Shared chrome for all app routes. Because this layout wraps every page
 * in the (app) group, Header/Footer/FAB mount ONCE and persist across
 * navigations instead of rebuilding on every route change.
 */
export default function AppLayout({ children }) {
  return <MainLayout>{children}</MainLayout>;
}
