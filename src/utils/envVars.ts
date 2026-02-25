const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

/**
 * Replaces `{{key}}` references in a string with values from the provided map.
 * Unresolved variables are left as-is.
 */
export function resolveVariables(input: string, varsMap: Record<string, string>): string {
  if (!input) return input;
  return input.replace(VARIABLE_PATTERN, (match, name) => {
    return name in varsMap ? varsMap[name] : match;
  });
}

/**
 * Returns true if the input contains any `{{...}}` variable references.
 */
export function hasVariableReferences(input: string): boolean {
  return VARIABLE_PATTERN.test(input);
}

/**
 * Extracts all variable names referenced in the input string.
 */
export function extractVariableNames(input: string): string[] {
  const names: string[] = [];
  for (const match of input.matchAll(VARIABLE_PATTERN)) {
    if (!names.includes(match[1])) {
      names.push(match[1]);
    }
  }
  return names;
}
