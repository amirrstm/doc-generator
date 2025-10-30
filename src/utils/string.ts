const parseUrlWithParameters = (url: string) => {
  const parts: Array<{ text: string; isParameter: boolean }> = [];
  // Regex to match both escaped \{param\} and unescaped {param} patterns
  const regex = /\\?\{[^}]+\}/g;
  let lastIndex = 0;
  let match = regex.exec(url);

  while (match !== null) {
    // Add static part before the parameter
    if (match.index > lastIndex) {
      const staticPart = url.slice(lastIndex, match.index);
      if (staticPart) {
        parts.push({ isParameter: false, text: staticPart });
      }
    }

    // Add the parameter
    parts.push({ isParameter: true, text: match[0] });
    lastIndex = match.index + match[0].length;
    match = regex.exec(url);
  }

  // Add remaining static part after the last parameter
  if (lastIndex < url.length) {
    parts.push({ isParameter: false, text: url.slice(lastIndex) });
  }

  // If no parameters found, return the entire URL as static
  if (parts.length === 0) {
    parts.push({ isParameter: false, text: url });
  }

  return parts;
};

export { parseUrlWithParameters };
