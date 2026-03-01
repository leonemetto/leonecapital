import { AppSidebar } from './AppSidebar';
import NeuralBackground from '@/components/ui/flow-field-background';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="relative min-h-screen bg-background overflow-hidden flex [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      <NeuralBackground particleCount={200} trailOpacity={0.05} speed={0.4} />
      <AppSidebar />
      <div className="relative z-10 flex-1 min-w-0">
        <main className="max-w-[1600px] mx-auto p-5 md:p-6 lg:p-8 pt-16 lg:pt-8">
          {children}
        </main>
      </div>
    </div>
  );
}
