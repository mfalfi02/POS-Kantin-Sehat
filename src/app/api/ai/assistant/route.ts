import { getSession } from "@/lib/auth/session";
import { assistantRequestSchema } from "@/features/ai/schemas/assistant-schema";
import { askSalesAssistant } from "@/features/ai/services/ask-sales-assistant";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const jsonHeaders = { "Cache-Control": "no-store", "Content-Type": "application/json" };

async function readJsonBody(request: Request, maxBytes: number) {
  if (!request.body) throw new Error("invalid_body");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      await reader.cancel();
      throw new Error("body_too_large");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as unknown;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Silakan masuk terlebih dahulu." }, { status: 401, headers: jsonHeaders });

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 48_000) return Response.json({ error: "Permintaan terlalu besar." }, { status: 413, headers: jsonHeaders });

  let body: unknown;
  try {
    body = await readJsonBody(request, 48_000);
  } catch (error) {
    if (error instanceof Error && error.message === "body_too_large") return Response.json({ error: "Permintaan terlalu besar." }, { status: 413, headers: jsonHeaders });
    return Response.json({ error: "Format permintaan tidak valid." }, { status: 400, headers: jsonHeaders });
  }
  const parsed = assistantRequestSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Pertanyaan atau konteks percakapan tidak valid. Maksimal 12 pesan konteks." }, { status: 400, headers: jsonHeaders });

  try {
    const result = await askSalesAssistant(parsed.data);
    return Response.json(result, { status: 200, headers: jsonHeaders });
  } catch {
    return Response.json({ error: "Maaf, Sales Assistant sedang tidak dapat digunakan. Silakan coba lagi." }, { status: 503, headers: jsonHeaders });
  }
}
