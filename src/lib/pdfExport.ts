import jsPDF from 'jspdf';
import { Trade } from '@/types/trade';
import { calculateAnalytics, getSessionPerformance, getStrategyPerformance } from './analytics';

const BLACK = '#0a0a0a';
const WHITE = '#ffffff';
const GREEN = '#10b981';
const RED = '#f87171';
const MUTED = '#666666';
const BORDER = '#222222';

function pnlColor(pnl: number): string {
  return pnl >= 0 ? GREEN : RED;
}

function addPageBackground(doc: jsPDF) {
  doc.setFillColor(BLACK);
  doc.rect(0, 0, 210, 297, 'F');
}

function sectionLabel(doc: jsPDF, text: string, x: number, y: number) {
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MUTED);
  doc.text(text.toUpperCase(), x, y);
}

function statBlock(doc: jsPDF, label: string, value: string, x: number, y: number, color = WHITE, w = 40) {
  // Card background
  doc.setFillColor('#111111');
  doc.setDrawColor(BORDER);
  doc.roundedRect(x, y, w, 20, 2, 2, 'FD');
  // Label
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text(label.toUpperCase(), x + 4, y + 7);
  // Value
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(color);
  doc.text(value, x + 4, y + 15);
}

export function exportTradePDF(trades: Trade[], nickname = 'Trader', accountName = 'All Accounts') {
  if (trades.length === 0) return;

  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const analytics = calculateAnalytics(trades);
  const sessions = getSessionPerformance(trades);
  const strategies = getStrategyPerformance(trades);
  const now = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  // ── Page 1 ─────────────────────────────────────────────────────────────────
  addPageBackground(doc);

  // Header bar
  doc.setFillColor('#111111');
  doc.rect(0, 0, 210, 28, 'F');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text('EDGEFLOW', 14, 10);

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE);
  doc.text('Performance Report', 14, 20);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text(`${nickname}  ·  ${accountName}  ·  Generated ${now}`, 14, 26);

  // Divider
  doc.setDrawColor(BORDER);
  doc.line(14, 30, 196, 30);

  // ── Stat blocks row 1 ──
  const stats = [
    { label: 'Total Trades', value: String(analytics.totalTrades), color: WHITE },
    { label: 'Win Rate', value: `${analytics.winRate.toFixed(1)}%`, color: analytics.winRate >= 50 ? GREEN : RED },
    { label: 'Net P&L', value: `$${analytics.netPnl.toFixed(2)}`, color: pnlColor(analytics.netPnl) },
    { label: 'Profit Factor', value: String(analytics.profitFactor), color: analytics.profitFactor >= 1 ? GREEN : RED },
  ];
  stats.forEach((s, i) => statBlock(doc, s.label, s.value, 14 + i * 46, 36, s.color, 43));

  const stats2 = [
    { label: 'Avg Win', value: `$${analytics.avgWin.toFixed(2)}`, color: GREEN },
    { label: 'Avg Loss', value: `$${analytics.avgLoss.toFixed(2)}`, color: RED },
    { label: 'R Expectancy', value: `${analytics.rExpectancy >= 0 ? '+' : ''}${analytics.rExpectancy.toFixed(2)}R`, color: analytics.rExpectancy >= 0 ? GREEN : RED },
    { label: 'Max Drawdown', value: `$${analytics.maxDrawdown}`, color: RED },
  ];
  stats2.forEach((s, i) => statBlock(doc, s.label, s.value, 14 + i * 46, 61, s.color, 43));

  // ── Session breakdown ──
  let y = 92;
  sectionLabel(doc, 'Session Performance', 14, y);
  y += 5;

  const sessionColW = [60, 25, 25, 30, 35];
  const sessionHeaders = ['Session', 'Trades', 'Win %', 'Avg R', 'Net P&L'];
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MUTED);
  let cx = 14;
  sessionHeaders.forEach((h, i) => { doc.text(h, cx, y); cx += sessionColW[i]; });
  y += 2;
  doc.setDrawColor(BORDER);
  doc.line(14, y, 196, y);
  y += 4;

  sessions.slice(0, 6).forEach((s) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(WHITE);
    cx = 14;
    doc.text(s.session, cx, y); cx += sessionColW[0];
    doc.text(String(s.total), cx, y); cx += sessionColW[1];
    doc.setTextColor(parseFloat(s.winRate) >= 50 ? GREEN : RED);
    doc.text(`${s.winRate}%`, cx, y); cx += sessionColW[2];
    doc.setTextColor(WHITE);
    doc.text(s.avgR ?? '—', cx, y); cx += sessionColW[3];
    doc.setTextColor(pnlColor(s.pnl));
    doc.text(`$${s.pnl.toFixed(2)}`, cx, y);
    y += 6;
  });

  // ── Strategy breakdown ──
  y += 4;
  sectionLabel(doc, 'Strategy Performance', 14, y);
  y += 5;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MUTED);
  cx = 14;
  sessionHeaders.forEach((h, i) => { doc.text(h === 'Session' ? 'Strategy' : h, cx, y); cx += sessionColW[i]; });
  y += 2;
  doc.line(14, y, 196, y);
  y += 4;

  strategies.slice(0, 6).forEach((s) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(WHITE);
    cx = 14;
    doc.text(s.strategy || '—', cx, y); cx += sessionColW[0];
    doc.text(String(s.total), cx, y); cx += sessionColW[1];
    doc.setTextColor(parseFloat(s.winRate) >= 50 ? GREEN : RED);
    doc.text(`${s.winRate}%`, cx, y); cx += sessionColW[2];
    doc.setTextColor(WHITE);
    doc.text(s.avgR ?? '—', cx, y); cx += sessionColW[3];
    doc.setTextColor(pnlColor(s.pnl));
    doc.text(`$${s.pnl.toFixed(2)}`, cx, y);
    y += 6;
  });

  // ── Page 2: Recent trades table ──────────────────────────────────────────
  doc.addPage();
  addPageBackground(doc);

  doc.setFillColor('#111111');
  doc.rect(0, 0, 210, 14, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(WHITE);
  doc.text('Recent Trades', 14, 10);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text(`Last ${Math.min(trades.length, 50)} trades`, 196, 10, { align: 'right' });

  const cols = ['Date', 'Instrument', 'Dir', 'Session', 'Outcome', 'P&L', 'R', 'Plan'];
  const colW = [24, 30, 14, 28, 20, 24, 16, 14];
  y = 22;

  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(MUTED);
  cx = 14;
  cols.forEach((c, i) => { doc.text(c, cx, y); cx += colW[i]; });
  y += 2;
  doc.setDrawColor(BORDER);
  doc.line(14, y, 196, y);
  y += 4;

  const recentTrades = [...trades].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 50);
  recentTrades.forEach((t) => {
    if (y > 280) { doc.addPage(); addPageBackground(doc); y = 14; }
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    cx = 14;
    doc.setTextColor(WHITE); doc.text(t.date, cx, y); cx += colW[0];
    doc.text(t.instrument, cx, y); cx += colW[1];
    doc.setTextColor(t.direction === 'long' ? GREEN : RED); doc.text(t.direction === 'long' ? 'L' : 'S', cx, y); cx += colW[2];
    doc.setTextColor(WHITE); doc.text(t.session || '—', cx, y); cx += colW[3];
    doc.setTextColor(t.outcome === 'win' ? GREEN : t.outcome === 'loss' ? RED : WHITE);
    doc.text(t.outcome, cx, y); cx += colW[4];
    doc.setTextColor(pnlColor(t.pnl)); doc.text(`$${t.pnl.toFixed(2)}`, cx, y); cx += colW[5];
    doc.setTextColor(WHITE); doc.text(t.rMultiple != null ? `${t.rMultiple}R` : '—', cx, y); cx += colW[6];
    doc.text(t.followedPlan == null ? '—' : t.followedPlan ? 'Y' : 'N', cx, y);
    y += 5.5;
  });

  // Footer on last page
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(MUTED);
  doc.text('Generated by EdgeFlow · leone.capital', 14, 290);
  doc.text(now, 196, 290, { align: 'right' });

  doc.save(`edgeflow_report_${new Date().toISOString().slice(0, 10)}.pdf`);
}
