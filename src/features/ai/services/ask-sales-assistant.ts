import "server-only";

import { GoogleGenAI, Type, type Content, type FunctionDeclaration, type Part, type Schema } from "@google/genai";
import { getWibDateString } from "@/lib/business-time";
import { assistantRequestSchema, assistantResponseSchema } from "../schemas/assistant-schema";
import { buildSalesAssistantInstructions } from "../prompts/system-prompt";
import { executeReportingTool, reportingTools } from "../tools/reporting-tools";

const MAX_TOOL_ROUNDS = 3;
const MAX_TOOL_CALLS = 6;
const MAX_OUTPUT_TOKENS = 500;

export class SalesAssistantUnavailableError extends Error {
  constructor() {
    super("Maaf, Sales Assistant sedang tidak dapat digunakan. Silakan coba lagi.");
    this.name = "SalesAssistantUnavailableError";
  }
}

let client: GoogleGenAI | undefined;

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new SalesAssistantUnavailableError();
  client ??= new GoogleGenAI({ apiKey, httpOptions: { timeout: 20_000 } });
  return client;
}

function getModel() {
  const model = process.env.AI_MODEL?.trim() || "gemini-2.5-flash-lite";
  if (!/^[a-zA-Z0-9._-]{1,100}$/.test(model)) throw new SalesAssistantUnavailableError();
  return model;
}

function toGeminiSchema(schema: Record<string, unknown>): Schema {
  const nullableType = Array.isArray(schema.type) ? schema.type.find((type) => type !== "null") : schema.type;
  const typeMap: Record<string, Type> = {
    object: Type.OBJECT, string: Type.STRING, integer: Type.INTEGER, number: Type.NUMBER, boolean: Type.BOOLEAN, array: Type.ARRAY
  };
  const properties = schema.properties as Record<string, Record<string, unknown>> | undefined;
  const items = schema.items as Record<string, unknown> | undefined;
  return {
    ...(nullableType && typeMap[String(nullableType)] ? { type: typeMap[String(nullableType)] } : {}),
    ...(schema.description ? { description: String(schema.description) } : {}),
    ...(schema.enum ? { enum: schema.enum as string[] } : {}),
    ...(schema.minimum !== undefined ? { minimum: Number(schema.minimum) } : {}),
    ...(schema.maximum !== undefined ? { maximum: Number(schema.maximum) } : {}),
    ...(schema.minLength !== undefined ? { minLength: String(schema.minLength) } : {}),
    ...(schema.maxLength !== undefined ? { maxLength: String(schema.maxLength) } : {}),
    ...(Array.isArray(schema.required) ? { required: schema.required as string[] } : {}),
    ...(properties ? { properties: Object.fromEntries(Object.entries(properties).map(([key, value]) => [key, toGeminiSchema(value)])) } : {}),
    ...(items ? { items: toGeminiSchema(items) } : {}),
    ...(Array.isArray(schema.type) && schema.type.includes("null") ? { nullable: true } : {})
  };
}

export function getGeminiReportingTools(): FunctionDeclaration[] {
  return reportingTools.map(({ name, description, parameters }) => ({
    name,
    description,
    parameters: toGeminiSchema(parameters as unknown as Record<string, unknown>)
  }));
}

type ToolExecutor = (call: { name: string; arguments: string; call_id: string }) => Promise<unknown>;

export async function runSalesAssistantWithProvider(request: unknown, gemini: Pick<GoogleGenAI, "models">, model: string, executeTool: ToolExecutor = executeReportingTool) {
  const parsedRequest = assistantRequestSchema.safeParse(request);
  if (!parsedRequest.success || !/^[a-zA-Z0-9._-]{1,100}$/.test(model)) throw new SalesAssistantUnavailableError();

  try {
    const instructions = buildSalesAssistantInstructions(getWibDateString(new Date()));
    const contents: Content[] = [
      ...parsedRequest.data.history.map(({ role, content }) => ({ role: role === "assistant" ? "model" : "user", parts: [{ text: content }] })),
      { role: "user", parts: [{ text: parsedRequest.data.question }] }
    ];
    const tools = [{ functionDeclarations: getGeminiReportingTools() }];
    let executedCalls = 0;

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const response = await gemini.models.generateContent({
        model,
        contents,
        config: { systemInstruction: instructions, tools, maxOutputTokens: MAX_OUTPUT_TOKENS }
      });
      const calls = response.functionCalls ?? [];
      if (calls.length === 0) {
        const output = assistantResponseSchema.safeParse({ answer: response.text });
        if (!output.success) throw new SalesAssistantUnavailableError();
        return output.data;
      }
      if (round === MAX_TOOL_ROUNDS) throw new SalesAssistantUnavailableError();
      executedCalls += calls.length;
      if (executedCalls > MAX_TOOL_CALLS || calls.some((call) => !call.name || !call.args || typeof call.args !== "object")) throw new SalesAssistantUnavailableError();

      const modelContent = response.candidates?.[0]?.content;
      if (!modelContent) throw new SalesAssistantUnavailableError();
      contents.push(modelContent);
      const responses: Part[] = await Promise.all(calls.map(async (call) => {
        if (!call.name) throw new SalesAssistantUnavailableError();
        const result = await executeTool({
          name: call.name,
          arguments: JSON.stringify(call.args),
          call_id: call.id ?? `call_${round}_${executedCalls}`
        });
        const safeResult = JSON.parse(JSON.stringify(result)) as Record<string, unknown>;
        return {
        functionResponse: {
          name: call.name,
          ...(call.id ? { id: call.id } : {}),
          response: safeResult
        }
      };
      }));
      contents.push({ role: "user", parts: responses });
    }
    throw new SalesAssistantUnavailableError();
  } catch (error) {
    if (error instanceof SalesAssistantUnavailableError) throw error;
    throw new SalesAssistantUnavailableError();
  }
}

export async function askSalesAssistant(input: unknown) {
  const parsed = assistantRequestSchema.safeParse(input);
  if (!parsed.success) {
    const error = new Error("Pertanyaan tidak valid.");
    error.name = "SalesAssistantInputError";
    throw error;
  }
  try {
    return await runSalesAssistantWithProvider(parsed.data, getClient(), getModel());
  } catch (error) {
    if (error instanceof SalesAssistantUnavailableError) throw error;
    throw new SalesAssistantUnavailableError();
  }
}
