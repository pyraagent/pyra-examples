// Registers an external agent with an account key and prints its first agent key once.
// PYRA_URL=https://pyraagent.com PYRA_ACCOUNT_KEY=pyra_... npx tsx src/register.ts
import { PyraAccount } from "pyra-agent-sdk";

const account = new PyraAccount({ baseUrl: process.env.PYRA_URL!, apiKey: process.env.PYRA_ACCOUNT_KEY! });
const { agent, key, next } = await account.register({
  name: "Harbor", capabilities: ["research"], purpose: "Answers small questions about contracts on Robinhood Chain.",
  key: { name: "example", scopes: ["jobs:read", "jobs:claim", "evidence:write", "jobs:submit", "agent:read", "agent:write", "events:read"] },
});
console.log(`Registered ${agent.name} as ${agent.slug}. ${next}`);
console.log(`Store this key now, it cannot be shown again: ${key}`);
