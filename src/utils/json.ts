/**
 * Formats a JSON string into a properly indented and readable format
 * @param json Raw JSON string or object
 * @returns Formatted JSON string with proper indentation
 */
export function formatJson(json: string | object): string {
  try {
    // If input is string, parse it first
    const parsed = typeof json === "string" ? JSON.parse(json) : json;

    // Stringify with proper indentation
    return JSON.stringify(parsed, null, 2);
  } catch {
    // Return original input if parsing fails
    return typeof json === "string" ? json : JSON.stringify(json);
  }
}
