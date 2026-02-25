import fs from "fs";
import yaml from "js-yaml";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/clean-headers.mjs <path-to-openapi.yaml>");
  process.exit(1);
}

const doc = yaml.load(fs.readFileSync(file, "utf8"));

const methods = ["get", "post", "put", "patch", "delete", "options", "head"];
let removed = 0;

for (const pathItem of Object.values(doc.paths)) {
  for (const method of methods) {
    const op = pathItem[method];
    if (!op || !op.parameters) continue;

    const before = op.parameters.length;
    // Keep only non-header params and $ref params (our 3 custom ones)
    op.parameters = op.parameters.filter((p) => {
      if (p.$ref) return true; // keep $ref entries
      return p.in !== "header"; // remove inline header params
    });
    removed += before - op.parameters.length;

    // Remove empty parameters array
    if (op.parameters.length === 0) {
      delete op.parameters;
    }
  }
}

fs.writeFileSync(
  file,
  yaml.dump(doc, {
    lineWidth: 100,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  })
);

console.log(`Done. Removed ${removed} inline header parameters from ${file}.`);
