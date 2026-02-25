import fs from "fs-extra";
import yaml from "js-yaml";
import prettier from "prettier";
import slugify from "slugify";
import { fetch } from "undici";

import path from "node:path";

const OPENAPI_DIR = "./swagger";
const DOCS_DIR = "./docs";
const SUPPORTED_LOCALES = ["en", "fa"];

let globalBaseUrl = null;

/**
 * Extract response schema properties with nested structure support
 */
function extractResponseProperties(schema, spec, visited = new Set()) {
  if (!schema) return [];

  // Handle $ref references with circular reference detection
  if (schema.$ref) {
    if (visited.has(schema.$ref)) {
      return [{ description: "Circular reference detected", title: "Circular Reference", type: "object" }];
    }
    visited.add(schema.$ref);

    const refPath = schema.$ref.replace("#/", "").split("/");
    let refSchema = spec;
    for (const part of refPath) {
      refSchema = refSchema[part];
    }
    return extractResponseProperties(refSchema, spec, visited);
  }

  const properties = [];

  if (schema.type === "object" && schema.properties) {
    for (const [key, prop] of Object.entries(schema.properties)) {
      const property = {
        description: prop.description || "No description provided",
        title: key,
        type: prop.enum ? `enum<${prop.type}>` : prop.type || "unknown"
      };

      // Handle special formats
      if (prop.format) {
        property.type = `${property.type} (${prop.format})`;
      }

      // Handle enums
      if (prop.enum) {
        property.description += property.description
          ? ` Possible values: [${prop.enum.join(", ")}]`
          : `Possible values: [${prop.enum.join(", ")}]`;
      }

      // Handle arrays with nested structures
      if (prop.type === "array" && prop.items) {
        property.type = "array";

        if (prop.items.$ref) {
          // Extract DTO name from $ref
          const dtoName = prop.items.$ref.split("/").pop();

          // Get the referenced schema and extract its properties
          const refPath = prop.items.$ref.replace("#/", "").split("/");
          let refSchema = spec;
          for (const part of refPath) {
            refSchema = refSchema[part];
          }

          if (refSchema && !visited.has(prop.items.$ref)) {
            const childVisited = new Set(visited);
            childVisited.add(prop.items.$ref);
            const childProperties = extractResponseProperties(refSchema, spec, childVisited);

            if (childProperties.length > 0) {
              property.children = {
                items: childProperties,
                title: dtoName
              };
            }
          }
        } else if (prop.items.type === "object" && prop.items.properties) {
          // Handle inline object definitions in arrays
          const childProperties = extractResponseProperties(prop.items, spec, visited);

          if (childProperties.length > 0) {
            property.children = {
              items: childProperties,
              title: "Object"
            };
          }
        }
      } else if (prop.$ref) {
        // Handle object references
        property.type = "object";

        // Extract DTO name from $ref
        const dtoName = prop.$ref.split("/").pop();

        // Get the referenced schema and extract its properties
        const refPath = prop.$ref.replace("#/", "").split("/");
        let refSchema = spec;
        for (const part of refPath) {
          refSchema = refSchema[part];
        }

        if (refSchema && !visited.has(prop.$ref)) {
          const childVisited = new Set(visited);
          childVisited.add(prop.$ref);
          const childProperties = extractResponseProperties(refSchema, spec, childVisited);

          if (childProperties.length > 0) {
            property.children = {
              items: childProperties,
              title: dtoName
            };
          }
        }
      } else if (prop.type === "object" && prop.properties) {
        const childProperties = extractResponseProperties(prop, spec, visited);

        if (childProperties.length > 0) {
          property.children = {
            items: childProperties,
            title: "Object"
          };
        }
      }

      properties.push(property);
    }
  } else if (schema.type === "array" && schema.items) {
    // For array responses, extract properties of the items
    const itemProperties = extractResponseProperties(schema.items, spec, visited);
    return itemProperties.map((prop) => ({
      ...prop,
      title: `${prop.title} (array item)`
    }));
  }

  return properties;
}

/**
 * Check if an operation requires authentication
 */
function hasAuthentication(operation, spec) {
  // Check if the operation has security requirements
  if (operation.security) {
    return operation.security.length > 0;
  }

  // Check if the spec has global security requirements
  if (spec.security) {
    return spec.security.length > 0;
  }

  return false;
}

/**
 * Extract parameters from operation (path, query, header, etc.)
 */
function extractParameters(operation, _spec) {
  const parameters = {
    cookie: [],
    header: [],
    path: [],
    query: []
  };

  if (operation.parameters) {
    for (const param of operation.parameters) {
      const paramInfo = {
        description: param.description || "No description provided",
        required: param.required || false,
        title: param.name,
        type: "unknown"
      };

      // Extract type information from schema
      if (param.schema) {
        paramInfo.type = param.schema.type || "unknown";

        // Handle special formats
        if (param.schema.format) {
          paramInfo.type = `${paramInfo.type} (${param.schema.format})`;
        }

        // Handle enums
        if (param.schema.enum) {
          paramInfo.description += paramInfo.description
            ? ` Possible values: [${param.schema.enum.join(", ")}]`
            : `Possible values: [${param.schema.enum.join(", ")}]`;
        }

        // Handle arrays
        if (param.schema.type === "array" && param.schema.items) {
          if (param.schema.items.type) {
            paramInfo.type = `array of ${param.schema.items.type}`;
          }
        }
      }

      // Add to appropriate category
      const location = param.in || "query";
      if (parameters[location]) {
        parameters[location].push(paramInfo);
      }
    }
  }

  return parameters;
}

/**
 * Get required fields from schema (handles $ref resolution)
 */
function getRequiredFieldsFromSchema(schema, spec, visited = new Set()) {
  if (!schema) return [];

  // Handle $ref references with circular reference detection
  if (schema.$ref) {
    if (visited.has(schema.$ref)) {
      return [];
    }
    visited.add(schema.$ref);

    const refPath = schema.$ref.replace("#/", "").split("/");
    let refSchema = spec;
    for (const part of refPath) {
      refSchema = refSchema[part];
    }
    return getRequiredFieldsFromSchema(refSchema, spec, visited);
  }

  // Return required fields if they exist
  return schema.required || [];
}

/**
 * Extract request body properties from operation with nested structure support
 */
function extractRequestBodyProperties(operation, spec) {
  if (!operation.requestBody || !operation.requestBody.content) {
    return {
      properties: [],
      required: false
    };
  }

  const content = operation.requestBody.content;

  // Determine content type (prefer application/json, fallback to multipart/form-data)
  let schema = null;
  let contentType = "application/json";

  if (content["application/json"] && content["application/json"].schema) {
    schema = content["application/json"].schema;
    contentType = "application/json";
  } else if (content["multipart/form-data"] && content["multipart/form-data"].schema) {
    schema = content["multipart/form-data"].schema;
    contentType = "multipart/form-data";
  }

  if (schema) {
    const properties = extractResponseProperties(schema, spec);

    // Get required fields from schema
    const requiredFields = getRequiredFieldsFromSchema(schema, spec);

    // Add required property to each field recursively
    const addRequiredToProperties = (props, requiredFieldsList) => {
      return props.map((prop) => {
        const propWithRequired = {
          ...prop,
          required: requiredFieldsList.includes(prop.title)
        };

        // If the property has children, process them recursively
        if (prop.children && prop.children.items) {
          let childRequiredFields = [];

          if (prop.type === "array" || prop.type === "object") {
            childRequiredFields = [];
          }

          propWithRequired.children = {
            ...prop.children,
            items: addRequiredToProperties(prop.children.items, childRequiredFields)
          };
        }

        return propWithRequired;
      });
    };

    const propertiesWithRequired = addRequiredToProperties(properties, requiredFields);

    return {
      contentType,
      properties: propertiesWithRequired,
      required: operation.requestBody.required || false
    };
  }

  return {
    contentType: "application/json",
    properties: [],
    required: false
  };
}

/**
 * Extract response examples from operation
 */
function extractResponseExamples(operation, spec) {
  const responses = {};

  if (operation.responses) {
    for (const [statusCode, response] of Object.entries(operation.responses)) {
      if (response.content && response.content["application/json"]) {
        const schema = response.content["application/json"].schema;
        const properties = extractResponseProperties(schema, spec);

        responses[statusCode] = properties;
      }
    }
  }

  return responses;
}

/**
 * Load OpenAPI specification from YAML file
 */
function loadOpenAPISpec(yamlPath) {
  return yaml.load(fs.readFileSync(yamlPath, "utf8"));
}

/**
 * Download YAML content from URL
 */
async function downloadYAMLFromURL(url) {
  try {
    console.log(`🌐 Downloading YAML from: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const content = await response.text();
    return yaml.load(content);
  } catch (error) {
    console.error(`❌ Failed to download YAML from URL: ${error.message}`);
    throw error;
  }
}

/**
 * Prepare project directory by removing existing docs and creating fresh structure
 */
async function prepareProjectDirectory(projectName, locale = null) {
  const projectDir = path.join(DOCS_DIR, projectName);

  // Remove existing project directory if it exists and no specific locale is provided
  if (!locale && fs.existsSync(projectDir)) {
    console.log(`🗑️  Removing existing docs for project: ${projectName}`);
    await fs.remove(projectDir);
  }

  // Create language-specific directories
  if (locale) {
    const localeDir = path.join(projectDir, locale);
    const genDir = path.join(localeDir, "endpoints");
    await fs.ensureDir(genDir);
    return { genDir, localeDir, projectDir };
  } else {
    // For backward compatibility
    const genDir = path.join(projectDir, "endpoints");
    await fs.ensureDir(genDir);
    return { genDir, projectDir };
  }
}

/**
 * Copy existing intro.mdx file from project source to destination
 */
async function copyIntroFile(localeDir, projectName, locale) {
  const sourceIntroPath = path.join(OPENAPI_DIR, projectName, `intro-${locale}.mdx`);
  const destIntroPath = path.join(localeDir, "intro.mdx");

  // Check if source intro file exists
  if (!fs.existsSync(sourceIntroPath)) {
    console.warn(`⚠️  No intro-${locale}.mdx found for project: ${projectName} at ${sourceIntroPath}`);
    // Create a basic intro file as fallback
    const fallbackContent = `<Title>${projectName}</Title>
<Description>
  API documentation for ${projectName} service.
</Description>`;
    await fs.writeFile(destIntroPath, fallbackContent);
    return;
  }

  // Copy the existing intro file
  await fs.copy(sourceIntroPath, destIntroPath);
  console.log(`📄 Copied intro-${locale}.mdx for project: ${projectName}`);
}

/**
 * Generate cURL command with proper headers, body, and parameters
 */
function generateCurlCommand(method, pathKey, operation, spec) {
  const curlParts = [`curl --request ${method.toUpperCase()}`];

  // Add URL with path parameters as examples
  let pathWithExamples = pathKey;
  if (pathKey.includes("{")) {
    // Replace path parameters with example values - always replace for cURL examples
    pathWithExamples = pathKey.replace(/\{([^}]+)\}/g, (match, paramName) => {
      // Always provide example values for cURL commands
      if (paramName.toLowerCase().includes("id")) {
        return "123";
      }
      if (paramName.toLowerCase().includes("uuid")) {
        return "xxxxxxxx-xxxx";
      }
      return "example-value";
    });
  }

  const baseUrl = globalBaseUrl || "{baseUrl}";
  const fullUrl = `${baseUrl}${pathWithExamples}`;
  curlParts.push(`--url "${fullUrl}"`);

  // Add headers
  const headers = [];
  const isMultipart = isMultipartFormData(operation);

  // Add content-type for requests with body (skip for multipart — curl sets it automatically with -F)
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody && !isMultipart) {
    headers.push('--header "Content-Type: application/json"');
  }

  // Add header parameters
  if (operation.parameters) {
    operation.parameters.forEach((param) => {
      if (param.in === "header") {
        let exampleValue = "value";
        if (param.schema && param.schema.example) {
          exampleValue = param.schema.example;
        }
        headers.push(`--header "${param.name}: ${exampleValue}"`);
      }
    });
  }

  curlParts.push(...headers);

  // Add request body for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody) {
    if (isMultipart) {
      // Use -F flags for multipart/form-data
      const requestBodyExample = generateRequestBodyExample(operation, spec);
      if (requestBodyExample) {
        for (const [key, value] of Object.entries(requestBodyExample)) {
          if (typeof value === "string" && value.startsWith("@")) {
            curlParts.push(`-F "${key}=${value}"`);
          } else {
            curlParts.push(`-F "${key}=${value}"`);
          }
        }
      }
    } else {
      const requestBodyExample = generateRequestBodyExample(operation, spec);
      if (requestBodyExample) {
        const jsonBody = JSON.stringify(requestBodyExample, null, 2);
        curlParts.push(`--data '${jsonBody}'`);
      }
    }
  }

  return curlParts.join(" \\\n  ");
}

/**
 * Generate JavaScript fetch code
 */
function generateJavaScriptCode(method, pathKey, operation, spec) {
  const baseUrl = globalBaseUrl || "{baseUrl}";
  let url = `${baseUrl}${pathKey}`;

  // Replace path parameters with template literals (but preserve custom baseUrl)
  if (!globalBaseUrl) {
    url = url.replace(/\{([^}]+)\}/g, (match, paramName) => {
      if (paramName === "baseUrl") {
        return "{baseUrl}";
      }
      return `\${${paramName}}`;
    });
  } else {
    // Only replace path parameters, not baseUrl
    url = url.replace(/\{([^}]+)\}/g, (match, paramName) => {
      return `\${${paramName}}`;
    });
  }

  // Add query parameters if any
  const queryParams = [];
  if (operation.parameters) {
    operation.parameters.forEach((param) => {
      if (param.in === "query") {
        let exampleValue = "value";
        if (param.schema) {
          if (param.schema.type === "integer") {
            exampleValue = "123";
          } else if (param.schema.type === "boolean") {
            exampleValue = "true";
          } else if (param.schema.example) {
            exampleValue = param.schema.example;
          } else if (param.schema.enum) {
            exampleValue = param.schema.enum[0];
          }
        }
        queryParams.push(`${param.name}=${exampleValue}`);
      }
    });
  }

  if (queryParams.length > 0) {
    url += `?${queryParams.join("&")}`;
  }

  const isMultipart = isMultipartFormData(operation);
  const codeLines = [];

  if (isMultipart) {
    // Generate FormData-based code for multipart/form-data
    const requestBodyExample = generateRequestBodyExample(operation, spec);
    codeLines.push("const formData = new FormData();");
    if (requestBodyExample) {
      for (const [key, value] of Object.entries(requestBodyExample)) {
        if (typeof value === "string" && value.startsWith("@")) {
          codeLines.push(`formData.append("${key}", fileInput.files[0]);`);
        } else {
          codeLines.push(`formData.append("${key}", ${JSON.stringify(value)});`);
        }
      }
    }
    codeLines.push("");

    // Add header params (but not Content-Type — browser sets it for FormData)
    const headerLines = [];
    if (operation.parameters) {
      operation.parameters.forEach((param) => {
        if (param.in === "header") {
          let exampleValue = "<token>";
          if (param.name.toLowerCase().includes("authorization")) {
            exampleValue = "Bearer <token>";
          } else if (param.schema && param.schema.example) {
            exampleValue = param.schema.example;
          }
          headerLines.push(`  "${param.name}": "${exampleValue}"`);
        }
      });
    }

    const fetchOptions = { method: method.toUpperCase() };
    if (headerLines.length > 0) {
      fetchOptions.headers = "__HEADERS__";
    }
    fetchOptions.body = "formData";

    let optionsStr = JSON.stringify(fetchOptions, null, 2)
      .replace('"formData"', "formData")
      .replace('"__HEADERS__"', `{\n${headerLines.join(",\n")}\n  }`);

    codeLines.push(`fetch("${url}", ${optionsStr})`);
    codeLines.push("  .then(response => response.json())");
    codeLines.push("  .then(data => console.log(data));");
  } else {
    const fetchOptions = {
      method: method.toUpperCase()
    };

    // Add headers
    const headers = {};
    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody) {
      headers["Content-Type"] = "application/json";
    }

    if (Object.keys(headers).length > 0) {
      fetchOptions.headers = headers;
    }

    // Add request body example if needed
    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody) {
      const requestBodyExample = generateRequestBodyExample(operation, spec);
      if (requestBodyExample) {
        codeLines.push(`const requestBody = ${JSON.stringify(requestBodyExample, null, 2)};`);
        codeLines.push("");
        fetchOptions.body = "JSON.stringify(requestBody)";
      }
    }

    const optionsStr = JSON.stringify(fetchOptions, null, 2).replace(
      '"JSON.stringify(requestBody)"',
      "JSON.stringify(requestBody)"
    );

    codeLines.push(`fetch("${url}", ${optionsStr})`);
    codeLines.push("  .then(response => response.json())");
    codeLines.push("  .then(data => console.log(data));");
  }

  return codeLines.join("\n");
}

/**
 * Generate Python requests code
 */
function generatePythonCode(method, pathKey, operation, spec) {
  const baseUrl = globalBaseUrl || "{baseUrl}";
  let url = `${baseUrl}${pathKey}`;

  // Replace path parameters with f-string format (but preserve custom baseUrl)
  if (!globalBaseUrl) {
    url = url.replace(/\{([^}]+)\}/g, (match, paramName) => {
      if (paramName === "baseUrl") {
        return "{baseUrl}";
      }
      return `{${paramName}}`;
    });
  } else {
    // Only replace path parameters, not baseUrl
    url = url.replace(/\{([^}]+)\}/g, (match, paramName) => {
      return `{${paramName}}`;
    });
  }

  const isMultipart = isMultipartFormData(operation);
  const codeLines = ["import requests"];
  codeLines.push("");
  codeLines.push(`url = "${url}"`);
  codeLines.push("");

  // Add request body for POST/PUT/PATCH
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody) {
    const requestBodyExample = generateRequestBodyExample(operation, spec);
    if (requestBodyExample && isMultipart) {
      // Generate files dict and data dict for multipart
      const fileFields = [];
      const dataFields = [];
      for (const [key, value] of Object.entries(requestBodyExample)) {
        if (typeof value === "string" && value.startsWith("@")) {
          const filename = value.slice(1);
          fileFields.push([key, filename]);
        } else {
          dataFields.push([key, value]);
        }
      }

      if (fileFields.length > 0) {
        codeLines.push("files = {");
        fileFields.forEach(([key, filename], index) => {
          const comma = index < fileFields.length - 1 ? "," : "";
          codeLines.push(`    "${key}": open("${filename}", "rb")${comma}`);
        });
        codeLines.push("}");
        codeLines.push("");
      }

      if (dataFields.length > 0) {
        codeLines.push("data = {");
        dataFields.forEach(([key, value], index) => {
          const comma = index < dataFields.length - 1 ? "," : "";
          codeLines.push(`    "${key}": ${JSON.stringify(value)}${comma}`);
        });
        codeLines.push("}");
        codeLines.push("");
      }
    } else if (requestBodyExample) {
      codeLines.push("payload = {");

      const entries = Object.entries(requestBodyExample);
      entries.forEach(([key, value], index) => {
        const isLast = index === entries.length - 1;
        const comma = isLast ? "" : ",";

        if (Array.isArray(value)) {
          if (value.length === 0) {
            codeLines.push(`    "${key}": []${comma}`);
          } else if (value.length === 1 && typeof value[0] !== "object") {
            codeLines.push(`    "${key}": [${JSON.stringify(value[0])}]${comma}`);
          } else {
            codeLines.push(`    "${key}": [`);
            value.forEach((item, itemIndex) => {
              const itemIsLast = itemIndex === value.length - 1;
              const itemComma = itemIsLast ? "" : ",";
              if (typeof item === "object") {
                codeLines.push(`        ${JSON.stringify(item)}${itemComma}`);
              } else {
                codeLines.push(`        ${JSON.stringify(item)}${itemComma}`);
              }
            });
            codeLines.push(`    ]${comma}`);
          }
        } else if (typeof value === "object" && value !== null) {
          codeLines.push(`    "${key}": ${JSON.stringify(value)}${comma}`);
        } else {
          codeLines.push(`    "${key}": ${JSON.stringify(value)}${comma}`);
        }
      });

      codeLines.push("}");
      codeLines.push("");
    }
  }

  // Add headers (skip Content-Type for multipart — requests sets it automatically)
  const headers = {};
  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody && !isMultipart) {
    headers["Content-Type"] = "application/json";
  }

  // Add header parameters
  if (operation.parameters) {
    operation.parameters.forEach((param) => {
      if (param.in === "header") {
        let exampleValue = "<token>";
        if (param.name.toLowerCase().includes("authorization")) {
          exampleValue = "Bearer <token>";
        } else if (param.schema && param.schema.example) {
          exampleValue = param.schema.example;
        }
        headers[param.name] = exampleValue;
      }
    });
  }

  if (Object.keys(headers).length > 0) {
    codeLines.push("headers = {");
    const headerEntries = Object.entries(headers);
    headerEntries.forEach(([key, value], index) => {
      const isLast = index === headerEntries.length - 1;
      const comma = isLast ? "" : ",";
      codeLines.push(`    "${key}": "${value}"${comma}`);
    });
    codeLines.push("}");
    codeLines.push("");
  }

  // Add query parameters if any
  const queryParams = {};
  if (operation.parameters) {
    operation.parameters.forEach((param) => {
      if (param.in === "query") {
        let exampleValue = "value";
        if (param.schema) {
          if (param.schema.type === "integer") {
            exampleValue = 123;
          } else if (param.schema.type === "boolean") {
            exampleValue = true;
          } else if (param.schema.example) {
            exampleValue = param.schema.example;
          } else if (param.schema.enum) {
            exampleValue = param.schema.enum[0];
          }
        }
        queryParams[param.name] = exampleValue;
      }
    });
  }

  // Build the request call
  const requestParts = [`url`];

  if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && operation.requestBody) {
    if (isMultipart) {
      requestParts.push("files=files");
      requestParts.push("data=data");
    } else {
      requestParts.push("json=payload");
    }
  }

  if (Object.keys(headers).length > 0) {
    requestParts.push("headers=headers");
  }

  if (Object.keys(queryParams).length > 0) {
    codeLines.push("params = {");
    const paramEntries = Object.entries(queryParams);
    paramEntries.forEach(([key, value], index) => {
      const isLast = index === paramEntries.length - 1;
      const comma = isLast ? "" : ",";
      codeLines.push(`    "${key}": ${JSON.stringify(value)}${comma}`);
    });
    codeLines.push("}");
    codeLines.push("");
    requestParts.push("params=params");
  }

  codeLines.push(`response = requests.${method.toLowerCase()}(${requestParts.join(", ")})`);
  codeLines.push("");
  codeLines.push("print(response.json())");

  return codeLines.join("\n");
}

/**
 * Generate example request body
 */
function generateRequestBodyExample(operation, spec) {
  if (!operation.requestBody || !operation.requestBody.content) {
    return null;
  }

  const content = operation.requestBody.content;
  if (content["application/json"] && content["application/json"].schema) {
    const schema = content["application/json"].schema;
    return generateSchemaExample(schema, spec);
  }

  if (content["multipart/form-data"] && content["multipart/form-data"].schema) {
    const schema = content["multipart/form-data"].schema;
    return generateSchemaExample(schema, spec);
  }

  return null;
}

/**
 * Check if an operation uses multipart/form-data content type
 */
function isMultipartFormData(operation) {
  if (!operation.requestBody || !operation.requestBody.content) return false;
  return !!operation.requestBody.content["multipart/form-data"] && !operation.requestBody.content["application/json"];
}

/**
 * Generate example data from schema (simplified version for code examples)
 */
function generateSchemaExample(schema, spec, visited = new Set()) {
  if (!schema) return null;

  // Handle $ref references with circular reference detection
  if (schema.$ref) {
    if (visited.has(schema.$ref)) {
      return "...";
    }
    visited.add(schema.$ref);

    const refPath = schema.$ref.replace("#/", "").split("/");
    let refSchema = spec;
    for (const part of refPath) {
      refSchema = refSchema[part];
    }
    return generateSchemaExample(refSchema, spec, visited);
  }

  switch (schema.type) {
    case "object": {
      const obj = {};
      if (schema.properties) {
        for (const [key, prop] of Object.entries(schema.properties)) {
          obj[key] = generateSchemaExample(prop, spec, visited);
        }
      }
      return obj;
    }

    case "array":
      if (schema.items) {
        const item = generateSchemaExample(schema.items, spec, visited);
        return [item];
      }
      return [];

    case "string":
      if (schema.format === "binary") return "@file.pdf";
      if (schema.example) return schema.example;
      if (schema.format === "uuid") return "xxxxxxxx-xxxxx";
      if (schema.format === "date-time") return new Date().toISOString();
      if (schema.enum) return schema.enum[0];
      return "string";

    case "integer":
      return schema.example || 123;

    case "number":
      return schema.example || 123.45;

    case "boolean":
      return schema.example !== undefined ? schema.example : true;

    default:
      return schema.example || null;
  }
}

/**
 * Generate MDX content for a single endpoint
 */
function generateEndpointMDXContent(method, pathKey, operation, spec, category = "", cleanTitle = null) {
  const title = cleanTitle || operation.summary || `${method.toUpperCase()} ${pathKey}`;

  // Generate code examples
  const curlCode = generateCurlCommand(method, pathKey, operation, spec);
  const jsCode = generateJavaScriptCode(method, pathKey, operation, spec);
  const pyCode = generatePythonCode(method, pathKey, operation, spec);

  // Extract response examples
  const responses = extractResponseExamples(operation, spec);

  // Extract request body properties
  const requestBody = extractRequestBodyProperties(operation, spec);

  // Extract parameters
  const parameters = extractParameters(operation, spec);

  // Check if authentication is required
  const requiresAuth = hasAuthentication(operation, spec);

  // Get baseUrl from global variable or spec fallback
  const baseUrl = globalBaseUrl || spec.servers?.[0]?.url || "https://api.example.com";

  return `<Endpoint
  title="${title.replace(/"/g, '\\"')}"
  method="${method.toUpperCase()}"
  category="${category.replace(/"/g, '\\"')}"
  baseUrl="${baseUrl}"
  path="${pathKey.replace(/\{/g, "\\{").replace(/\}/g, "\\}")}"
  summary="${(operation.summary || "").replace(/"/g, '\\"')}"
  description={\`${(operation.description || "").replace(/`/g, "\\`")}\`}
  hasAuthentication={${requiresAuth}}
  curl={\`${curlCode.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`}
  languages={{
    javascript: \`${jsCode.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`,
    python: \`${pyCode.replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`
  }}
  parameters={${JSON.stringify(parameters, null, 2)}}
  requestBody={${JSON.stringify(requestBody, null, 2)}}
  responses={${JSON.stringify(responses, null, 2)}}
/>
`;
}

/**
 * Generate a clean slug from title, handling trailing periods and special characters
 */
function generateCleanSlug(title) {
  if (!title || typeof title !== "string") return "untitled";

  // Remove trailing periods, dots, and trim whitespace
  const cleanTitle = title.replace(/[.\s]+$/, "").trim();

  // If after cleaning the title is empty, return a fallback
  if (!cleanTitle) return "untitled";

  // Use slugify with strict options to ensure clean URLs
  const slug = slugify(cleanTitle, {
    lower: true,
    remove: /[*+~.()'"!:@]/g,
    strict: true
  });

  // Ensure we don't return empty slugs
  return slug || "untitled";
}

/**
 * Process all endpoints and generate MDX files
 */
async function generateEndpointFiles(genDir, spec) {
  const tagsMap = {}; // { tag: [items] }

  for (const [pathKey, methods] of Object.entries(spec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const originalTitle = operation.summary || `${method.toUpperCase()} ${pathKey}`;
      const cleanTitle = originalTitle.replace(/[.\s]+$/, "").trim() || originalTitle;
      const slug = generateCleanSlug(originalTitle);
      const mdxFileName = `${slug}.mdx`;
      const mdxPath = path.join(genDir, mdxFileName);

      // Get the primary tag/category for this endpoint
      const tags = operation.tags || ["General"];
      const primaryTag = tags[0]; // Use the first tag as the primary category

      // Generate and write MDX content with category
      const mdxContent = generateEndpointMDXContent(method, pathKey, operation, spec, primaryTag, cleanTitle);
      await fs.writeFile(mdxPath, await prettier.format(mdxContent, { parser: "markdown" }));

      // Add to tags for sidebar generation
      for (const tag of tags) {
        if (!tagsMap[tag]) tagsMap[tag] = [];
        tagsMap[tag].push({
          method: method.toUpperCase(),
          slug,
          title: cleanTitle
        });
      }
    }
  }

  return tagsMap;
}

/**
 * Generate sidebar.json file
 */
async function generateSidebarFile(localeDir, tagsMap) {
  const sidebar = [];

  for (const [tag, items] of Object.entries(tagsMap)) {
    sidebar.push({ items, section: tag });
  }

  await fs.writeJSON(path.join(localeDir, "sidebar.json"), sidebar, { spaces: 2 });
}

/**
 * Generate env.json file from servers array
 */
async function generateEnvFile(projectDir, spec) {
  const environments = [];

  if (spec.servers && Array.isArray(spec.servers)) {
    for (const server of spec.servers) {
      if (server.url) {
        environments.push({
          name: server.description || "Server",
          url: server.url
        });
      }
    }
  }

  // Fallback if no servers defined
  if (environments.length === 0) {
    environments.push({
      name: "Default Server",
      url: "https://api.example.com"
    });
  }

  await fs.writeJSON(path.join(projectDir, "env.json"), environments, { spaces: 2 });
}

/**
 * Generate documentation for a single project with multi-language support
 */
async function generateProjectDocs(projectName, yamlPathOrSpec = null) {
  console.log(`🔄 Generating docs for project: ${projectName}`);

  // First, clean up the entire project directory
  const { projectDir } = await prepareProjectDirectory(projectName);

  // Generate documentation for each supported locale
  for (const locale of SUPPORTED_LOCALES) {
    console.log(`📝 Processing ${locale} documentation for ${projectName}...`);

    // Determine the OpenAPI spec path or use provided spec
    let spec;
    if (yamlPathOrSpec && typeof yamlPathOrSpec === "object") {
      // Use provided spec (for URL-based generation)
      spec = yamlPathOrSpec;
    } else {
      // Load locale-specific YAML file
      const yamlPath = path.join(OPENAPI_DIR, projectName, `openapi-${locale}.yaml`);

      if (!fs.existsSync(yamlPath)) {
        console.warn(`⚠️  No openapi-${locale}.yaml found for project: ${projectName}, skipping ${locale}`);
        continue;
      }

      spec = loadOpenAPISpec(yamlPath);
    }

    // Prepare locale-specific directory
    const { localeDir, genDir } = await prepareProjectDirectory(projectName, locale);

    // Copy locale-specific intro file
    await copyIntroFile(localeDir, projectName, locale);

    // Generate endpoint MDX files and collect tags
    const tagsMap = await generateEndpointFiles(genDir, spec);

    // Generate locale-specific sidebar.json
    await generateSidebarFile(localeDir, tagsMap);

    console.log(`✅ ${locale} documentation generated for ${projectName}`);
  }

  // Generate shared env.json file (only once per project)
  // Use the first available spec to generate environment config
  let envSpec = null;
  for (const locale of SUPPORTED_LOCALES) {
    const yamlPath = path.join(OPENAPI_DIR, projectName, `openapi-${locale}.yaml`);
    if (fs.existsSync(yamlPath)) {
      envSpec = loadOpenAPISpec(yamlPath);
      break;
    }
  }

  if (envSpec || (yamlPathOrSpec && typeof yamlPathOrSpec === "object")) {
    await generateEnvFile(projectDir, envSpec || yamlPathOrSpec);
  }

  console.log(`✅ ${projectName} docs generated for all languages`);
}

/**
 * Parse command line arguments
 */
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};

  for (const arg of args) {
    if (arg.startsWith("--baseUrl=")) {
      const baseUrl = arg.split("=")[1];
      if (baseUrl) {
        // Add https:// if not present
        options.baseUrl = baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`;
      }
    } else if (arg.startsWith("--url=")) {
      const url = arg.split("=")[1];
      if (url) {
        options.url = url;
      }
    }
  }

  return options;
}

/**
 * Main function to process all OpenAPI specs
 */
async function main() {
  // Parse command line arguments
  const options = parseArguments();

  if (options.baseUrl) {
    globalBaseUrl = options.baseUrl;
    console.log(`🔗 Using custom baseUrl: ${globalBaseUrl}`);
  }

  // Check if URL argument is provided
  if (options.url) {
    try {
      // Extract project name from URL or use a default
      const urlObject = new URL(options.url);
      const fileName = path.basename(urlObject.pathname);
      const projectName = fileName.includes(".") ? path.basename(fileName, path.extname(fileName)) : "api-docs";

      console.log(`📥 Processing URL: ${options.url}`);

      // Download and parse the YAML from URL
      const spec = await downloadYAMLFromURL(options.url);

      // Generate documentation
      await generateProjectDocs(projectName, spec);
    } catch (error) {
      console.error(`❌ Error processing URL: ${error.message}`);
      process.exit(1);
    }
  } else {
    // Process local project directories
    if (!fs.existsSync(OPENAPI_DIR)) {
      console.log(`📁 OpenAPI directory not found: ${OPENAPI_DIR}`);
      return;
    }

    const projectDirs = fs.readdirSync(OPENAPI_DIR).filter((item) => {
      const itemPath = path.join(OPENAPI_DIR, item);
      return fs.statSync(itemPath).isDirectory();
    });

    if (projectDirs.length === 0) {
      console.log(`📁 No project directories found in ${OPENAPI_DIR}`);
      return;
    }

    for (const projectName of projectDirs) {
      // Check if any language-specific YAML files exist
      const hasAnyYaml = SUPPORTED_LOCALES.some((locale) => {
        const yamlPath = path.join(OPENAPI_DIR, projectName, `openapi-${locale}.yaml`);
        return fs.existsSync(yamlPath);
      });

      if (!hasAnyYaml) {
        console.warn(`⚠️  No language-specific openapi YAML files found for project: ${projectName}`);
        continue;
      }

      await generateProjectDocs(projectName);
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
