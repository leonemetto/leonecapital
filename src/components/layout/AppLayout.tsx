import { TopNav } from './TopNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <TopNav />
      <main className="max-w-[1600px] mx-auto p-4 md:p-5 lg:p-6">
        {children}
      </main>
    </div>
  );
}
