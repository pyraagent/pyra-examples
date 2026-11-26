// Reads PYRA's contracts straight from Robinhood Chain mainnet with viem. No key, no PYRA server involved.
// npx tsx src/read-chain.ts            (RPC_URL defaults to the public Robinhood Chain RPC)
import { createPublicClient, defineChain, erc20Abi, formatUnits, http, parseAbi } from "viem";

const chain = defineChain({
  id: 4663, name: "Robinhood Chain", nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.mainnet.chain.robinhood.com"] } },
});
const client = createPublicClient({ chain, transport: http(process.env.RPC_URL) });

// The deployed addresses. They match deployments/4663.json in pyraagent/pyra-contracts.
const PYRA = {
  factory: "0x0D543fB3841454C9CDf97C1a5775B30B18Bb7050",
  escrow: "0x0757c1C8180dfaC066D6596421150A53D84545Bd",
  prizePool: "0xD04254412D2aa153be1D21F805c02EB111738C6a",
  dailyRewards: "0x2B154d4c9790D330A983f2E5d428B3a0A6DB4E20",
  swapAdapter: "0xB8f49D08fb1243b4d9dF87b237795892B362A111",
} as const;

const escrowAbi = parseAbi(["function asset() view returns (address)", "function factory() view returns (address)", "function MIN_REVIEW() view returns (uint32)", "function ARBITER_TIMEOUT() view returns (uint64)"]);
const factoryAbi = parseAbi(["function MAX_ACTIVE() view returns (uint256)", "function implementation() view returns (address)"]);

const [block, usdg, factory, minReview, arbiterTimeout, maxActive] = await Promise.all([
  client.getBlockNumber(),
  client.readContract({ address: PYRA.escrow, abi: escrowAbi, functionName: "asset" }),
  client.readContract({ address: PYRA.escrow, abi: escrowAbi, functionName: "factory" }),
  client.readContract({ address: PYRA.escrow, abi: escrowAbi, functionName: "MIN_REVIEW" }),
  client.readContract({ address: PYRA.escrow, abi: escrowAbi, functionName: "ARBITER_TIMEOUT" }),
  client.readContract({ address: PYRA.factory, abi: factoryAbi, functionName: "MAX_ACTIVE" }),
]);
const [symbol, decimals] = await Promise.all([
  client.readContract({ address: usdg, abi: erc20Abi, functionName: "symbol" }),
  client.readContract({ address: usdg, abi: erc20Abi, functionName: "decimals" }),
]);

console.log(`Robinhood Chain mainnet, block ${block}`);
console.log(`Escrow pays in ${symbol} at ${usdg}`);
console.log(`Escrow trusts the factory at ${factory}: ${factory.toLowerCase() === PYRA.factory.toLowerCase() ? "matches" : "DOES NOT MATCH"} the published address`);
console.log(`Review window at least ${Number(minReview) / 3600} hour, arbiter timeout ${Number(arbiterTimeout) / 86400} days, at most ${maxActive} active vaults per owner\n`);

for (const [name, address] of Object.entries(PYRA)) {
  const [code, balance] = await Promise.all([client.getCode({ address }), client.readContract({ address: usdg, abi: erc20Abi, functionName: "balanceOf", args: [address] })]);
  console.log(`${name.padEnd(13)} ${address}  ${code ? `${(code.length - 2) / 2} bytes of code` : "NO CODE"}, holds ${formatUnits(balance, decimals)} ${symbol}`);
}
