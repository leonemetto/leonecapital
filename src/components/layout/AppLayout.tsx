import { TopNav } from './TopNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] noise-overlay">
      <div className="relative z-10">
        <TopNav />
        <main className="max-w-[1400px] mx-auto px-5 md:px-8 lg:px-10 py-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
