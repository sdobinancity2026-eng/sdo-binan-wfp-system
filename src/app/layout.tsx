import '@/globals.css';
import { ReactNode } from 'react';

export const metadata = {
  title: 'SDO Biñan WFP Monitoring Portal',
  description: 'Work and Financial Plan Monitoring System - DepEd SDO Biñan City',
  icons: {
    icon: '/DOB_LOGO.png',
    shortcut: '/DOB_LOGO.png',
    apple: '/DOB_LOGO.png',
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-50 antialiased text-slate-900">{children}</body>
    </html>
  );
}