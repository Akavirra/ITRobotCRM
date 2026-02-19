import type { Metadata } from 'next';
import './globals.css';
import GroupModalsWrapper from '@/components/GroupModalsWrapper';

export const metadata: Metadata = {
  title: 'Адміністрування школи',
  description: 'Панель керування школою курсів',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uk">
      <body>
        {children}
        <GroupModalsWrapper />
      </body>
    </html>
  );
}
