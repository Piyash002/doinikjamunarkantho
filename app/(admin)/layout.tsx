import type { Metadata } from 'next';

import AdminShell from '@/src/components/admin/AdminShell';
import './admin.css';

export const metadata: Metadata = {
  title: {
    default: 'প্রশাসন | দৈনিক যমুনা কণ্ঠ',
    template: '%s | প্রশাসন',
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: LayoutProps<'/'>) {
  return <AdminShell>{children}</AdminShell>;
}
