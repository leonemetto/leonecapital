import { TopNav } from './TopNav';
import NeuralBackground from '@/components/ui/flow-field-background';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden">
      <NeuralBackground particleCount={400} trailOpacity={0.1} speed={0.8} />
      <div className="relative z-10">
        <TopNav />
        <main className="max-w-[1600px] mx-auto p-4 md:p-5 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

