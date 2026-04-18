import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Agentic Components Workspace',
  description: 'Visual Components 4.8 inspired industrial simulation workspace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='zh-CN' className='h-full'>
      <body className='min-h-full bg-[var(--bg-canvas)] font-sans text-[var(--text-primary)]'>
        {children}
      </body>
    </html>
  );
}
