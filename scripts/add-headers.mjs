import fs from "fs";
import yaml from "js-yaml";

const file = process.argv[2];
if (!file) {
  console.error("Usage: node scripts/add-headers.mjs <path-to-openapi.yaml>");
  process.exit(1);
}

const doc = yaml.load(fs.readFileSync(file, "utf8"));

// 1. Add securitySchemes under components
if (!doc.components) doc.components = {};
doc.components.securitySchemes = {
  BearerAuth: {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  },
};

// 2. Global security: BearerAuth optional (the empty {} object means "no auth" is also acceptable)
doc.security = [{ BearerAuth: [] }, {}];

// 3. Define reusable header parameters
doc.components.parameters = {
  ...(doc.components.parameters || {}),
  XDoretClientType: {
    name: "x-doret-client-type",
    in: "header",
    required: false,
    schema: { type: "string", example: "app" },
    description: "Client type identifier",
  },
  XDoretMainSocialId: {
    name: "x-doret-main-social-id",
    in: "header",
    required: false,
    schema: {
      type: "string",
      format: "uuid",
      example: "019c7609-d734-76a0-9276-32183ac26e04",
    },
    description: "Main social ID",
  },
  XDoretBusinessSocialId: {
    name: "X-Doret-Business-Social-Id",
    in: "header",
    required: false,
    schema: { type: "string", format: "uuid" },
    description: "Business social ID",
  },
};

// 4. Add the 3 header param refs to every operation
const headerRefs = [
  { $ref: "#/components/parameters/XDoretClientType" },
  { $ref: "#/components/parameters/XDoretMainSocialId" },
  { $ref: "#/components/parameters/XDoretBusinessSocialId" },
];

const methods = ["get", "post", "put", "patch", "delete", "options", "head"];
let count = 0;

for (const pathItem of Object.values(doc.paths)) {
  for (const method of methods) {
    const op = pathItem[method];
    if (!op) continue;
    if (!op.parameters) op.parameters = [];
    for (const ref of headerRefs) {
      const already = op.parameters.some((p) => p.$ref === ref.$ref);
      if (!already) {
        op.parameters.push({ ...ref });
      }
    }
    count++;
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

console.log(`Done. Updated ${count} operations in ${file}.`);
