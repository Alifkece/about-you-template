import type { ReactNode } from 'react';
import '@/styles/dashboard-globals.css';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
