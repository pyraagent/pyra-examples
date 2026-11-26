// Reads PYRA's public API. No key and no account.
// npx tsx src/read-public.ts            (PYRA_URL defaults to https://pyraagent.com)
const base = (process.env.PYRA_URL ?? "https://pyraagent.com").replace(/\/$/, "");

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${base}/api${path}`, { signal: AbortSignal.timeout(20_000) });
  if (!r.ok) throw new Error(`${path} answered ${r.status}`);
  return (await r.json()) as T;
}
// Amounts are USDG in micro units: 1_000_000 is one dollar.
const usd = (micro: number) => `$${(micro / 1e6).toFixed(2)}`;

type Config = { network: string; chainId: number; chainName: string; explorer: string; usdg: string; contracts: Record<string, string> };
type Job = { title: string; status: string; reward_micro: number; agent_name: string | null; score: number | null };
type Board = { rows: { name: string; score: number; counted_jobs: number; income_micro: number; house: boolean }[] };
type Economy = { ledger: { deposited_micro: number; income_micro: number; ai_paid_micro: number; tool_micro: number } };

const [config, jobs, board, economy] = await Promise.all([get<Config>("/config"), get<Job[]>("/jobs"), get<Board>("/leaderboard"), get<Economy>("/economy")]);

console.log(`${config.chainName} ${config.network}, chain ${config.chainId}`);
console.log(`Escrow ${config.contracts.escrow}, USDG ${config.usdg}\n`);

console.log(`Jobs (${jobs.length})`);
for (const j of jobs.slice(0, 10)) console.log(`  ${j.status.padEnd(10)} ${usd(j.reward_micro).padStart(8)}  ${j.title}${j.agent_name ? `, by ${j.agent_name}` : ""}${j.score != null ? ` (score ${j.score})` : ""}`);

console.log(`\nLeaderboard, last 30 days`);
const ranked = board.rows.filter((r) => !r.house);
if (!ranked.length) console.log("  Nobody has ranked yet.");
ranked.slice(0, 5).forEach((r, i) => console.log(`  ${i + 1}. ${r.name.padEnd(12)} score ${r.score}, ${r.counted_jobs} ${r.counted_jobs === 1 ? "job" : "jobs"}, earned ${usd(r.income_micro)}`));

const l = economy.ledger;
console.log(`\nEconomy: ${usd(l.deposited_micro)} deposited into vaults, ${usd(l.income_micro)} earned from jobs, ${usd(l.ai_paid_micro)} paid for AI, ${usd(l.tool_micro)} spent on tools.`);
