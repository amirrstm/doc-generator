/**
 * Normalizes a curl command string for copying to clipboard
 * @param curlCommand Raw curl command string
 * @returns Clean curl command ready for terminal execution
 */
export function normalizeCurlCommand(curlCommand: string): string {
  // Remove any existing line breaks and normalize spaces
  return curlCommand
    .replace(/\s*\\\s*/g, " ") // Remove backslashes and normalize spaces
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();
}

/**
 * Formats a curl command string into a more readable format for display
 * @param curlCommand Raw curl command string
 * @returns Formatted curl command with line breaks and proper spacing
 */
export function formatCurlCommand(curlCommand: string): string {
  // Remove any existing line breaks and extra spaces
  let formatted = curlCommand.trim();

  // Add line breaks after backslashes
  formatted = formatted.replace(/\s*\\\s*/g, " \\\n     ");

  // Add line breaks and proper spacing for common curl parameters
  formatted = formatted.replace(/(--url|--header|--data|-d|--form|-F|-H)\s+/g, "\n     $1 ");

  // Format JSON data to align with other lines
  formatted = formatted.replace(/--data\s+'(\{[^}]*\})'/, (match, jsonData) => {
    try {
      const parsedJson = JSON.parse(jsonData.replace(/\n/g, " "));
      const formattedJson = JSON.stringify(parsedJson, null, 2)
        .split("\n")
        .map((line, index) => (index === 0 ? line : `     ${line}`))
        .join("\n");
      return `--data '${formattedJson}'`;
    } catch {
      return match;
    }
  });

  // Clean up the start of the string
  formatted = formatted.replace(/^\n\s+/, "");

  return formatted;
}

/**
 * Generates a dynamic curl command based on current form values
 */
export function generateDynamicCurl({
  baseUrl,
  url,
  method,
  pathParams = {},
  queryParams = [],
  headers = {},
  body,
  authToken
}: {
  baseUrl: string;
  url: string;
  method: string;
  pathParams?: Record<string, string>;
  queryParams?: Array<{ key: string; value: string }>;
  headers?: Record<string, string>;
  body?: string;
  authToken?: string;
}): string {
  // Build the final URL with path parameters (same logic as buildRequestUrl)
  let finalUrl = url;

  // Replace path parameters
  Object.entries(pathParams).forEach(([param, value]) => {
    if (value) {
      finalUrl = finalUrl.replace(`{${param}}`, encodeURIComponent(value));
    }
  });

  // Add query parameters
  const validQueryParams = queryParams.filter((p) => p.key && p.value);
  if (validQueryParams.length > 0) {
    const queryString = validQueryParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
    finalUrl += `?${queryString}`;
  }

  // Build complete URL - check if URL already starts with http/https
  const fullUrl = finalUrl.startsWith("http") ? finalUrl : `${baseUrl}${finalUrl}`;

  // Start building curl command
  let curlCommand = `curl -X ${method.toUpperCase()}`;

  // Add URL
  curlCommand += ` '${fullUrl}'`;

  // Add headers
  const allHeaders = { ...headers };

  // Add auth header if token is provided
  if (authToken) {
    allHeaders.Authorization = `Bearer ${authToken}`;
  }

  // Add content-type for requests with body
  if (body && (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT" || method.toUpperCase() === "PATCH")) {
    allHeaders["Content-Type"] = "application/json";
  }

  // Add all headers to curl command
  Object.entries(allHeaders).forEach(([key, value]) => {
    curlCommand += `   -H '${key}: ${value}'`;
  });

  // Add body data
  if (body && (method.toUpperCase() === "POST" || method.toUpperCase() === "PUT" || method.toUpperCase() === "PATCH")) {
    try {
      // Try to format JSON nicely
      const parsedBody = JSON.parse(body);
      const formattedBody = JSON.stringify(parsedBody, null, 2)
        .split("\n")
        .map((line, index) => (index === 0 ? line : `     ${line}`))
        .join("\n");
      curlCommand += `   -d '${formattedBody}'`;
    } catch {
      // If not valid JSON, use as-is
      curlCommand += `   -d '${body}'`;
    }
  }

  return curlCommand;
}
