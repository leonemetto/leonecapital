/* eslint-disable @typescript-eslint/no-explicit-any */
// Atlas evals harness.
//
// Usage:
//   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/atlas-evals/run.ts
//
// What it does:
//   1. Loads the synthetic fixture (./fixture.json) and the prompt suite (./prompts.json).
//   2. Builds the production system prompt using supabase/functions/_shared/atlas-prompt.ts
//      — the SAME function the deployed edge function uses. No drift.
//   3. Calls Claude Haiku 4.5 for each prompt (matches the model in trade-advisor/index.ts).
//   4. Sends each (user prompt, Atlas response, ground-truth fixture) to Claude Sonnet 4.6
//      with a structured rubric. Grader returns JSON scores 0-3 per criterion.
//   5. Prints a scorecard and writes ./results.json for diffing across runs.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { buildSystemPrompt } from "../../supabase/functions/_shared/atlas-prompt.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));

const HAIKU_MODEL = "claude-haiku-4-5-20251001";
const GRADER_MODEL = "claude-sonnet-4-6";
const MAX_OUTPUT_TOKENS = 1200;

const apiKey = process.env.ANTHROPIC_API_KEY;
if (!apiKey) {
  console.error("ANTHROPIC_API_KEY not set");
  process.exit(1);
}

type Trade = {
  id: string;
  date: string;
  instrument: string;
  direction: "long" | "short";
  strategy: string | null;
  session: string | null;
  outcome: "win" | "loss" | "breakeven";
  pnl: number;
  rMultiple: number | null;
  riskPercent: number | null;
  htfBias: string | null;
  emotionalState: number | null;
  confidenceLevel: number | null;
  followedPlan: boolean | null;
  timeInTrade: number | null;
  notes: string;
};

type Fixture = {
  trades: Trade[];
  criteriaDefinitions: Array<{ label: string; category: string }>;
  traderProfile: any | null;
};

type Prompt = {
  id: string;
  mode: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  expectations: string;
};

// Mirror of buildTradesSummary in src/pages/AIAdvisor.tsx.
// Kept in sync manually; covered by the eval suite itself.
function buildTradesSummary(trades: Trade[]): string {
  if (trades.length === 0) return "No trades logged yet.";

  const wins = trades.filter(t => t.outcome === "win").length;
  const losses = trades.filter(t => t.outcome === "loss").length;
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const winPnl = trades.filter(t => t.outcome === "win").reduce((s, t) => s + t.pnl, 0);
  const lossPnl = Math.abs(trades.filter(t => t.outcome === "loss").reduce((s, t) => s + t.pnl, 0));
  const avgWin = wins > 0 ? winPnl / wins : 0;
  const avgLoss = losses > 0 ? lossPnl / losses : 0;
  const profitFactor = lossPnl > 0 ? (winPnl / lossPnl).toFixed(2) : "N/A";
  const winRate = ((wins / trades.length) * 100).toFixed(1);

  const groupBy = (keyFn: (t: Trade) => string | null) => {
    const m = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
    for (const t of trades) {
      const k = keyFn(t);
      if (k == null || k === "") continue;
      const v = m.get(k) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      v.total++;
      if (t.outcome === "win") v.wins++;
      else if (t.outcome === "loss") v.losses++;
      v.pnl += t.pnl;
      m.set(k, v);
    }
    return m;
  };

  const fmt = (v: { wins: number; losses: number; pnl: number; total: number }) =>
    `${v.total} trades, ${v.total > 0 ? ((v.wins / v.total) * 100).toFixed(1) : 0}% WR, $${v.pnl.toFixed(2)} P&L`;

  const byInstrument = groupBy(t => t.instrument);
  const bySession = groupBy(t => t.session);
  const byStrategy = groupBy(t => t.strategy);
  const byDirection = groupBy(t => t.direction);
  const byMonth = groupBy(t => (t.date || "").slice(0, 7));

  const planMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  for (const t of trades) {
    if (t.followedPlan === true || t.followedPlan === false) {
      const key = t.followedPlan ? "On-plan (Followed Plan = YES)" : "Off-plan (Followed Plan = NO)";
      const v = planMap.get(key) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      v.total++;
      if (t.outcome === "win") v.wins++;
      else if (t.outcome === "loss") v.losses++;
      v.pnl += t.pnl;
      planMap.set(key, v);
    }
  }

  const emotionMap = new Map<number, { wins: number; losses: number; pnl: number; total: number }>();
  for (const t of trades) {
    if (typeof t.emotionalState === "number" && t.emotionalState >= 1 && t.emotionalState <= 5) {
      const v = emotionMap.get(t.emotionalState) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      v.total++;
      if (t.outcome === "win") v.wins++;
      else if (t.outcome === "loss") v.losses++;
      v.pnl += t.pnl;
      emotionMap.set(t.emotionalState, v);
    }
  }

  const htfMap = new Map<string, { wins: number; losses: number; pnl: number; total: number }>();
  for (const t of trades) {
    if (t.htfBias) {
      const aligned = (t.direction === "long" && t.htfBias === "Bullish") || (t.direction === "short" && t.htfBias === "Bearish");
      const key = aligned ? "HTF-aligned" : t.htfBias === "Neutral" ? "HTF-neutral" : "HTF-counter";
      const v = htfMap.get(key) || { wins: 0, losses: 0, pnl: 0, total: 0 };
      v.total++;
      if (t.outcome === "win") v.wins++;
      else if (t.outcome === "loss") v.losses++;
      v.pnl += t.pnl;
      htfMap.set(key, v);
    }
  }

  const earliest = trades[trades.length - 1]?.date ?? "";
  const latest = trades[0]?.date ?? "";

  const lines: string[] = [];
  if (earliest && latest) lines.push(`Trade period: ${earliest} → ${latest}`);
  lines.push(`Total trades: ${trades.length}`);
  lines.push(`Win rate: ${winRate}%`);
  lines.push(`Net P&L: $${totalPnl.toFixed(2)}`);
  lines.push(`Avg win: $${avgWin.toFixed(2)}, Avg loss: $${avgLoss.toFixed(2)}`);
  lines.push(`Profit factor: ${profitFactor}`);
  lines.push("");
  lines.push("BY STRATEGY:");
  for (const [k, v] of byStrategy) lines.push(`  ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY SESSION:");
  for (const [k, v] of bySession) lines.push(`  ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY INSTRUMENT:");
  for (const [k, v] of byInstrument) lines.push(`  ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY DIRECTION:");
  for (const [k, v] of byDirection) lines.push(`  ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY PLAN COMPLIANCE (Followed Plan field):");
  for (const [k, v] of planMap) lines.push(`  ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY EMOTIONAL STATE (1=worst, 5=best):");
  for (const [k, v] of [...emotionMap.entries()].sort((a, b) => a[0] - b[0])) lines.push(`  State ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY HTF BIAS ALIGNMENT (direction vs logged HTF bias):");
  for (const [k, v] of htfMap) lines.push(`  ${k}: ${fmt(v)}`);
  lines.push("");
  lines.push("BY MONTH:");
  for (const [k, v] of [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0]))) lines.push(`  ${k}: ${fmt(v)}`);
  return lines.join("\n");
}

async function callAnthropic(model: string, system: string, messages: Array<{ role: string; content: string }>, maxTokens = MAX_OUTPUT_TOKENS): Promise<string> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "content-type": "application/json", "x-api-key": apiKey!, "anthropic-version": "2023-06-01" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  });
  if (!r.ok) throw new Error(`Anthropic ${model} ${r.status}: ${await r.text()}`);
  const j = await r.json();
  return j.content?.[0]?.text ?? "";
}

const RUBRIC = `You are grading Atlas, an AI trading-journal analyst. You will be shown:
- The user's question (and any prior turns).
- Atlas's response.
- The ground-truth trades JSON Atlas had access to (you can recompute any stat).
- A short note on what a good response would do for this specific prompt.

Score each criterion 0-3 (0 = fails badly, 1 = significant issues, 2 = minor issues, 3 = no issues).

Criteria:
1. relevance — Did Atlas answer THIS specific question? Did it stay on topic and avoid unrequested data dumps?
2. factual_accuracy — Are all numeric claims correctly derivable from the trades data? Recompute and verify. Any wrong stat = 0 or 1.
3. no_fabricated_citations — When Atlas references specific trades by date/instrument/P&L/notes, do those match a real trade in the data? Any invented citation = 0.
4. no_banned_phrases — Atlas must not use these or near-variants (paraphrases with adverbs inserted still count): "where your edge lives", "where you're bleeding", "where the edge", "what's working", "what's not working", "your strategy is profitable. your discipline isn't." A single use = 0 or 1.
5. appropriate_length — Does the length fit the question? A "what's my win rate on NQ" should be ~50 words. A multi-part "review my performance" can be 400-500.
6. no_template_drift — Does the response feel templated (predictable paragraph order, recycled phrasings across responses)? Original prose = 3.
7. no_contradictions — Do the numbers cited actually support the conclusion stated? E.g., "X beats Y" when X% < Y% = 0.

Return ONLY valid JSON of this exact shape. Your VERY FIRST CHARACTER must be the opening brace. No preamble. No "Let me verify…". No markdown fences. Do any verification work silently in your head and emit only the final scored JSON object.
{
  "scores": {
    "relevance": 0|1|2|3,
    "factual_accuracy": 0|1|2|3,
    "no_fabricated_citations": 0|1|2|3,
    "no_banned_phrases": 0|1|2|3,
    "appropriate_length": 0|1|2|3,
    "no_template_drift": 0|1|2|3,
    "no_contradictions": 0|1|2|3
  },
  "issues": ["short string per concrete problem you found"],
  "notes": "one-sentence overall summary"
}`;

async function grade(prompt: Prompt, response: string, fixture: Fixture) {
  const userMsg = `### USER PROMPT (last turn shown last)
${prompt.messages.map(m => `[${m.role}] ${m.content}`).join("\n")}

### ATLAS RESPONSE
${response}

### GROUND-TRUTH TRADES
${JSON.stringify(fixture.trades)}

### EXPECTATIONS FOR THIS PROMPT
${prompt.expectations}`;

  const raw = await callAnthropic(GRADER_MODEL, RUBRIC, [{ role: "user", content: userMsg }], 4000);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error(`Grader did not return JSON for ${prompt.id}: ${raw.slice(0, 200)}`);
  return JSON.parse(jsonMatch[0]);
}

async function main() {
  const fixture: Fixture = JSON.parse(readFileSync(resolve(__dirname, "fixture.json"), "utf8"));
  const prompts: Prompt[] = JSON.parse(readFileSync(resolve(__dirname, "prompts.json"), "utf8"));

  const tradesSummary = buildTradesSummary(fixture.trades);
  const recentTrades = fixture.trades.map(t => ({
    ...t,
    checklistChecked: 0,
    checklistTotal: fixture.criteriaDefinitions.length,
    checklistFollowed: null, // simulate no trade_verifications rows (the real-world default)
    accountName: "Main",
  }));

  const systemPrompt = buildSystemPrompt(tradesSummary, recentTrades, fixture.traderProfile, fixture.criteriaDefinitions);

  console.log(`\nAtlas evals — ${prompts.length} prompts × ${HAIKU_MODEL} → graded by ${GRADER_MODEL}\n`);

  const results: any[] = [];
  for (const p of prompts) {
    process.stdout.write(`[${p.id}] running… `);
    let response = "";
    try {
      response = await callAnthropic(HAIKU_MODEL, systemPrompt, p.messages);
    } catch (e: any) {
      console.log("ERROR:", e.message);
      results.push({ id: p.id, error: e.message });
      continue;
    }
    let scoreObj: any;
    try {
      scoreObj = await grade(p, response, fixture);
    } catch (e: any) {
      console.log("GRADE ERROR:", e.message);
      results.push({ id: p.id, response, error: "grade: " + e.message });
      continue;
    }
    const s = scoreObj.scores;
    const total = Object.values(s).reduce((a: number, b: any) => a + b, 0);
    const max = Object.keys(s).length * 3;
    console.log(`${total}/${max} — ${scoreObj.notes ?? ""}`);
    if (scoreObj.issues?.length) for (const i of scoreObj.issues) console.log(`    - ${i}`);
    results.push({ id: p.id, response, ...scoreObj, total, max });
  }

  // Aggregate
  const valid = results.filter(r => r.scores);
  const criteria = Object.keys(valid[0]?.scores ?? {});
  const avgPer: Record<string, number> = {};
  for (const c of criteria) avgPer[c] = +(valid.reduce((s, r) => s + r.scores[c], 0) / valid.length).toFixed(2);
  const overall = valid.reduce((s, r) => s + r.total, 0);
  const overallMax = valid.reduce((s, r) => s + r.max, 0);

  console.log("\n─────────────────────────────────────────");
  console.log("Aggregate scores (avg per criterion, /3):");
  for (const c of criteria) console.log(`  ${c.padEnd(28)} ${avgPer[c]}`);
  console.log(`\nOverall: ${overall}/${overallMax} (${((overall / overallMax) * 100).toFixed(1)}%)`);
  console.log("─────────────────────────────────────────\n");

  writeFileSync(resolve(__dirname, "results.json"), JSON.stringify({ timestamp: new Date().toISOString(), avgPer, overall, overallMax, results }, null, 2));
  console.log(`Wrote scripts/atlas-evals/results.json`);
}

main().catch(e => { console.error(e); process.exit(1); });
