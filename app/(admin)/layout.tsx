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
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('admin_theme');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark')}else{document.documentElement.classList.remove('dark');document.documentElement.removeAttribute('data-theme')}}catch(e){}})();`,
        }}
      />
      <AdminShell>{children}</AdminShell>
    </>
  );
}
