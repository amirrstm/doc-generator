import fs from "fs-extra";
import yaml from "js-yaml";
import path from "node:path";

const OUTPUT_PATH = "./swagger/platform/openapi-en.yaml";

// ── Service Configuration ──────────────────────────────────────────────────────

const SERVICES = [
  {
    name: "keycloak-client",
    url: "http://localhost:8002/docs/openapi.json",
    format: "json",
    prefix: "/auth",
    schemaPrefix: "Auth_",
    filter: filterKeycloakClient,
    tagger: tagKeycloakClient,
  },
  {
    name: "config-store",
    url: "http://localhost:8007/schema/",
    format: "yaml",
    prefix: "/config",
    schemaPrefix: "Config_",
    filter: filterConfigStore,
    tagger: tagConfigStore,
  },
  {
    name: "rag",
    url: "http://localhost:8005/openapi.json",
    format: "json",
    prefix: "/rag",
    schemaPrefix: "RAG_",
    filter: filterRAG,
    tagger: tagRAG,
  },
  {
    name: "social-gateway",
    url: "http://localhost:8003/openapi.json",
    format: "json",
    prefix: "/social",
    schemaPrefix: "Social_",
    filter: filterSocialGateway,
    tagger: tagSocialGateway,
  },
  {
    name: "interaction-history",
    url: "http://localhost:8004/openapi.json",
    format: "json",
    prefix: "/interaction",
    schemaPrefix: "Interaction_",
    filter: filterInteractionHistory,
    tagger: tagInteractionHistory,
  },
];

// ── Fetch Logic ────────────────────────────────────────────────────────────────

async function fetchSpec(service) {
  try {
    const res = await fetch(service.url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();

    if (service.format === "yaml") {
      return yaml.load(text);
    }
    return JSON.parse(text);
  } catch (err) {
    console.warn(`⚠️  Skipping ${service.name} (${service.url}): ${err.message}`);
    return null;
  }
}

// ── Endpoint Filters ───────────────────────────────────────────────────────────

function filterKeycloakClient(pathKey, method) {
  // Onboarding only: onboard + impersonate
  if (pathKey === "/api/v1/staff/realms/onboard" && method === "post") return true;
  if (pathKey === "/api/v1/staff/realms/{slug}/impersonate" && method === "post") return true;
  return false;
}

function filterConfigStore(pathKey, _method) {
  // Tenants only: create + get by realm, delete by id
  if (pathKey === "/api/v1/org/tenants/" || pathKey === "/api/v1/org/tenants") return true;
  if (/^\/api\/v1\/org\/tenants\/\{[^}]+\}\/?$/.test(pathKey)) return true;
  return false;
}

function filterRAG(pathKey, _method) {
  // Ingest file, ingest records, search, task status
  if (pathKey.startsWith("/api/v1/ingest/")) return true;
  if (pathKey === "/api/v1/search") return true;
  if (pathKey.startsWith("/api/v1/tasks/")) return true;
  return false;
}

function filterSocialGateway(pathKey, _method) {
  if (pathKey === "/api/v1/platform/instagram/oauth/connect") return true;
  if (pathKey.startsWith("/api/v1/platform/instagram/accounts")) return true;
  if (pathKey === "/api/v1/platform/instagram/user-info") return true;
  if (pathKey === "/api/v1/platform/instagram/posts") return true;
  // Exclude webhooks, agentic/callback, oauth/callback, root, health
  return false;
}

function filterInteractionHistory(pathKey, _method) {
  if (pathKey.startsWith("/api/v1/org/")) return true;
  return false;
}

// ── Taggers ────────────────────────────────────────────────────────────────────

function tagKeycloakClient(_pathKey) {
  return ["Onboarding"];
}

function tagConfigStore(_pathKey) {
  return ["Config Store"];
}

function tagRAG(_pathKey) {
  return ["RAG"];
}

function tagSocialGateway(_pathKey) {
  return ["Social - Instagram"];
}

function tagInteractionHistory(_pathKey) {
  return ["Interaction History"];
}

// ── Config-store deduplication (trailing-slash variants) ───────────────────────

function deduplicateTrailingSlash(paths) {
  const seen = new Set();
  const result = {};

  for (const [pathKey, methods] of Object.entries(paths)) {
    const normalized = pathKey.endsWith("/") ? pathKey : pathKey + "/";
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    // Prefer the trailing-slash variant if it exists
    const preferred = paths[normalized] ? normalized : pathKey;
    result[preferred] = paths[preferred] || methods;
  }

  return result;
}

// ── OpenAPI 3.1 → 3.0.3 Downgrade ─────────────────────────────────────────────

function downgradeNullable(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(downgradeNullable);
  if (typeof obj !== "object") return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "anyOf" && Array.isArray(value)) {
      // Pattern: anyOf: [{type: "string"}, {type: "null"}] → type: "string", nullable: true
      const nonNull = value.filter((v) => !(v.type === "null" || v.type === "None"));
      const hasNull = value.some((v) => v.type === "null" || v.type === "None");

      if (hasNull && nonNull.length === 1) {
        const inner = downgradeNullable(nonNull[0]);
        for (const [k, v] of Object.entries(inner)) {
          result[k] = v;
        }
        result.nullable = true;
        continue;
      }
    }

    result[key] = downgradeNullable(value);
  }

  return result;
}

// ── Schema Merging ─────────────────────────────────────────────────────────────

function prefixRefs(obj, prefix) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => prefixRefs(item, prefix));
  if (typeof obj !== "object") return obj;

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === "$ref" && typeof value === "string" && value.startsWith("#/components/schemas/")) {
      const schemaName = value.replace("#/components/schemas/", "");
      result[key] = `#/components/schemas/${prefix}${schemaName}`;
    } else {
      result[key] = prefixRefs(value, prefix);
    }
  }
  return result;
}

// ── Main Merge Logic ───────────────────────────────────────────────────────────

async function main() {
  console.log("🔄 Merging platform OpenAPI specs...\n");

  const mergedPaths = {};
  const mergedSchemas = {};

  for (const service of SERVICES) {
    console.log(`📡 Fetching ${service.name}...`);
    const spec = await fetchSpec(service);
    if (!spec) continue;

    let paths = spec.paths || {};

    // Deduplicate trailing-slash variants for config-store
    if (service.name === "config-store") {
      paths = deduplicateTrailingSlash(paths);
    }

    // Filter and process endpoints
    let includedCount = 0;
    for (const [pathKey, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods)) {
        if (method === "parameters") continue; // skip path-level parameters

        if (!service.filter(pathKey, method)) continue;

        const prefixedPath = `${service.prefix}${pathKey}`;
        if (!mergedPaths[prefixedPath]) mergedPaths[prefixedPath] = {};

        // Re-tag the operation
        const taggedOperation = {
          ...prefixRefs(operation, service.schemaPrefix),
          tags: service.tagger(pathKey),
        };

        mergedPaths[prefixedPath][method] = taggedOperation;
        includedCount++;
      }
    }

    // Merge component schemas with prefix
    const schemas = spec.components?.schemas || {};
    for (const [name, schema] of Object.entries(schemas)) {
      const prefixedName = `${service.schemaPrefix}${name}`;
      mergedSchemas[prefixedName] = prefixRefs(schema, service.schemaPrefix);
    }

    console.log(`   ✅ ${service.name}: ${includedCount} endpoints included\n`);
  }

  // Replace X-Auth-User headers with Authorization: Bearer for public docs
  for (const [, methods] of Object.entries(mergedPaths)) {
    for (const [methodKey, operation] of Object.entries(methods)) {
      if (methodKey === "parameters") continue;
      if (!operation.parameters) continue;

      operation.parameters = operation.parameters.map((param) => {
        if (param.in === "header" && param.name === "X-Auth-User") {
          return {
            name: "Authorization",
            in: "header",
            required: true,
            description: "Bearer token obtained from the Impersonate User endpoint.",
            schema: {
              type: "string",
              example: "Bearer eyJhbGciOiJSUzI1NiIs...",
            },
          };
        }
        return param;
      });
    }
  }

  // Downgrade the entire spec from 3.1 to 3.0.3
  const downgraded = downgradeNullable({
    paths: mergedPaths,
    components: { schemas: mergedSchemas },
  });

  // Assemble the final OpenAPI spec
  const mergedSpec = {
    openapi: "3.0.3",
    info: {
      title: "Felesh Platform API",
      version: "1.0.0",
      description:
        "Unified API documentation for the Felesh platform. Covers Authentication, Config Store, RAG, Social Gateway, and Interaction History services.",
    },
    servers: [
      { url: "https://api.paystar.stg.felesh.ai", description: "Staging" },
      { url: "https://api.paystar.felesh.ai", description: "Production" },
    ],
    ...downgraded,
  };

  // Write output
  await fs.ensureDir(path.dirname(OUTPUT_PATH));
  const yamlOutput = yaml.dump(mergedSpec, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false,
  });
  await fs.writeFile(OUTPUT_PATH, yamlOutput, "utf8");

  const totalEndpoints = Object.values(mergedPaths).reduce(
    (sum, methods) => sum + Object.keys(methods).length,
    0
  );
  console.log(`✅ Merged spec written to ${OUTPUT_PATH}`);
  console.log(`   ${totalEndpoints} endpoints, ${Object.keys(mergedSchemas).length} schemas`);
}

main().catch((err) => {
  console.error("❌ Merge failed:", err);
  process.exit(1);
});
