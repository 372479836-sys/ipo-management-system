import type { Metadata } from 'next';
import './globals.css';
import { IpoDataProvider } from '@/context/IpoDataContext';
import { AuditCommentProvider } from '@/context/AuditCommentContext';
import NavBar from '@/components/NavBar';

export const metadata: Metadata = {
  title: 'IPO 事项管理系统 — Project Yangtze',
  description: '港股 IPO 项目进度跟踪系统',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen">
        <IpoDataProvider>
          <AuditCommentProvider>
            <NavBar />
            <main className="max-w-7xl mx-auto px-6 py-8">
              {children}
            </main>
            <footer className="text-center text-xs text-slate-400 py-6">
              Project Yangtze · IPO 事项管理系统
            </footer>
          </AuditCommentProvider>
        </IpoDataProvider>
      </body>
    </html>
  );
}
