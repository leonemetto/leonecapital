import { AppLayout } from '@/components/layout/AppLayout';
import { TradingCalendar } from '@/components/calendar/TradingCalendar';
import { useTrades } from '@/hooks/useTrades';

const CalendarPage = () => {
  const { trades } = useTrades();

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-sm text-muted-foreground">Visualize your daily trading performance</p>
      </div>
      <div className="max-w-3xl">
        <TradingCalendar trades={trades} />
      </div>
    </AppLayout>
  );
};

export default CalendarPage;
