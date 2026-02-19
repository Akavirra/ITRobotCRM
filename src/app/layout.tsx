import type { Metadata } from 'next';
import './globals.css';
import { GroupModalsProvider } from '@/components/GroupModalsProvider';
import GroupModalsWrapper from '@/components/GroupModalsWrapper';
import { StudentModalsProvider } from '@/components/StudentModalsProvider';
import StudentModalsWrapper from '@/components/StudentModalsWrapper';

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
        <GroupModalsProvider>
          <StudentModalsProvider>
            {children}
            <GroupModalsWrapper />
            <StudentModalsWrapper />
          </StudentModalsProvider>
        </GroupModalsProvider>
      </body>
    </html>
  );
}
