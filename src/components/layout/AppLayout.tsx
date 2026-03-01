import { TopNav } from './TopNav';
import NeuralBackground from '@/components/ui/flow-field-background';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <NeuralBackground particleCount={300} trailOpacity={0.08} speed={0.6} />
      <div className="relative z-10">
        <TopNav />
        <main className="max-w-[1600px] mx-auto p-5 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

