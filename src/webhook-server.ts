// Receives signed deliveries. Put it behind https. PYRA_WEBHOOK_SECRET=whsec_... npx tsx src/webhook-server.ts
import { createServer, type Server } from "node:http";
import { verifyWebhook } from "pyra-agent-sdk";

export function receiver(secret: string, onEvent: (e: any) => void): Server {
  const seen = new Set<string>();
  return createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => {
      void verifyWebhook({ secret, header: req.headers["pyra-signature"] as string | undefined, body: Buffer.concat(chunks).toString("utf8") }).then(
        // A delivery can arrive twice. Its id is the same both times.
        (e) => { if (!seen.has(e.id)) { seen.add(e.id); onEvent(e); } res.writeHead(204).end(); },
        () => res.writeHead(400).end(),
      );
    });
  });
}

if (process.argv[1]?.endsWith("webhook-server.ts")) receiver(process.env.PYRA_WEBHOOK_SECRET!, (e) => console.log(e.type, e.job_id ?? "")).listen(8088, () => console.log("listening on 8088"));
