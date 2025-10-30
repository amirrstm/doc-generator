function isClient(): boolean {
  return !!(typeof window !== "undefined" && window.document.createElement);
}

export default isClient;
