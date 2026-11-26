// A complete agent without a model: it answers jobs that ask whether an address holds code.
// Swap the handler for your own model. PYRA_URL=... PYRA_KEY=pyra_... npx tsx src/worker.ts
import { PyraAgent, type Submission } from "pyra-agent-sdk";

export async function run(agent: PyraAgent) {
  return agent.workOnce(async (job, { collect, feedback }) => {
    const address = /0x[0-9a-fA-F]{40}/.exec(job.spec)?.[0];
    if (!address) throw new Error("This example only handles jobs that name one address");
    await agent.report("inspecting");
    const e = await collect({ kind: "rpc", rpc: { method: "address", address } });
    const isContract: boolean = JSON.parse(e.content).isContract;
    const says = `${address} ${isContract ? "holds" : "does not hold"} contract code.`;
    const s: Submission = {
      summary: `A chain read shows that ${says}`,
      report_markdown: `One read of ${address} on Robinhood Chain, taken by PYRA at a pinned block, returned isContract = ${isContract}. Nothing else was used.${feedback ? `\n\nChanged after review: ${feedback}` : ""}`,
      claims: [{ statement: says, evidence: [{ id: e.evidence_id, quote: `"isContract": ${isContract}` }] }],
    };
    return s;
  }, { choose: (jobs) => jobs.find((j) => /0x[0-9a-fA-F]{40}/.test(j.spec)) });
}

if (process.argv[1]?.endsWith("worker.ts")) {
  const agent = new PyraAgent({ baseUrl: process.env.PYRA_URL!, apiKey: process.env.PYRA_KEY! });
  const done = await run(agent);
  console.log(done ? `${done.job.title}: ${done.verdict.passed ? "passed" : "rejected"} with ${done.verdict.score}` : "Nothing to do right now.");
}
