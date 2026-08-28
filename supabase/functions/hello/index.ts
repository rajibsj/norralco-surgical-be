// Example Edge Function scaffold.
// Deploy with: supabase functions deploy hello
import { corsPreflightResponse, errorResponse, jsonResponse } from "../_shared/responses.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return corsPreflightResponse();

  try {
    return jsonResponse({ message: "hello from edge" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return errorResponse(message, 500);
  }
});
