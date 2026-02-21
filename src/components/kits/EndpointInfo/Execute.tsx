import { IconCheck, IconCopy, IconLoader2, IconPlayerPlayFilled } from "@tabler/icons-react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { formatCurlCommand, generateDynamicCurl, normalizeCurlCommand } from "@/utils/curl";

import { CodeBlock } from "../CodeBlocks";
import { EndpointUrl } from "./Url";

type ParameterInfo = { title: string; type: string; description: string; required: boolean };
type Parameters = { path: ParameterInfo[]; query: ParameterInfo[]; header: ParameterInfo[]; cookie: ParameterInfo[] };

type ResponseInfo = {
  title: string;
  type: string;
  required: boolean;
  description: string;
  children?: { title: string; items: ResponseInfo[] };
};

type Props = {
  url: string;
  type: string;
  curl: string;
  title: string;
  baseUrl: string;
  description: string;
  parameters?: Parameters;
  hasAuthentication?: boolean;
  requestBody?: { required: boolean; contentType?: string; properties: Array<ResponseInfo> };
};

export function Execute({
  url,
  type,
  curl: _curl,
  title,
  baseUrl,
  parameters,
  description,
  requestBody,
  hasAuthentication
}: Props) {
  const rawJsonId = useId();
  const authTokenId = useId();
  const pathParamId = useId();
  const queryParamId = useId();

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [authToken, setAuthToken] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isRawJsonMode, setIsRawJsonMode] = useState(false);
  const [requestBodyJson, setRequestBodyJson] = useState("{}");
  const [pathParams, setPathParams] = useState<Record<string, string>>({});
  const [bodyFormData, setBodyFormData] = useState<Record<string, unknown>>({});
  const [headerParams, setHeaderParams] = useState<Record<string, string>>({});
  const [queryParams, setQueryParams] = useState<Array<{ key: string; value: string }>>([]);
  const [fileFields, setFileFields] = useState<Record<string, File | null>>({});
  const [response, setResponse] = useState<{
    error?: string;
    status?: number;
    statusText?: string;
    data?: Record<string, unknown>;
    headers?: Record<string, string>;
  } | null>(null);

  const isMultipart = requestBody?.contentType === "multipart/form-data";

  const resetFormValues = useCallback(() => {
    setAuthToken("");
    setIsRawJsonMode(false);
    setRequestBodyJson("{}");
    setPathParams({});
    setHeaderParams({});
    setBodyFormData({});
    setFileFields({});
    setQueryParams([]);
    setResponse(null);
    setCopied(false);
  }, []);

  // Reset form values when dialog opens
  useEffect(() => {
    if (open) {
      resetFormValues();
    }
  }, [open, resetFormValues]);

  // Extract path parameters from URL
  const pathParameterNames = useMemo(() => {
    const regex = /\\?\{([^}\\]+)\\?\}/g;
    const matches = [];
    for (const match of url.matchAll(regex)) {
      matches.push(match[1]);
    }
    return matches;
  }, [url]);

  // Build the final request URL
  const buildRequestUrl = useCallback(() => {
    let finalUrl = url;

    // Replace path parameters (handle both escaped \{param\} and unescaped {param})
    pathParameterNames.forEach((param) => {
      const value = pathParams[param] || "";
      finalUrl = finalUrl.replace(`\\{${param}\\}`, encodeURIComponent(value)).replace(`{${param}}`, encodeURIComponent(value));
    });

    // Add query parameters
    const validQueryParams = queryParams.filter((p) => p.key && p.value);
    if (validQueryParams.length > 0) {
      const queryString = validQueryParams.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join("&");
      finalUrl += `?${queryString}`;
    }

    return finalUrl;
  }, [url, pathParameterNames, pathParams, queryParams]);

  // Build request headers
  const buildHeaders = useCallback(() => {
    const headers: Record<string, string> = {};

    // Don't set Content-Type for multipart — browser sets it with boundary
    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    if (hasAuthentication && authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    // Add custom header parameters
    for (const [key, value] of Object.entries(headerParams)) {
      if (value) headers[key] = value;
    }

    return headers;
  }, [hasAuthentication, authToken, headerParams, isMultipart]);

  // Convert form data to JSON
  const formDataToJson = useCallback(() => {
    try {
      return JSON.stringify(bodyFormData, null, 2);
    } catch {
      return "{}";
    }
  }, [bodyFormData]);

  // Generate dynamic curl command that updates with form values
  const dynamicCurl = useMemo(() => {
    let body: string | undefined;
    if (type.toUpperCase() !== "GET" && type.toUpperCase() !== "DELETE") {
      body = isRawJsonMode ? requestBodyJson : formDataToJson();
    }

    return generateDynamicCurl({
      authToken: hasAuthentication ? authToken : undefined,
      baseUrl,
      body,
      headers: headerParams,
      method: type,
      pathParams,
      queryParams,
      url
    });
  }, [
    baseUrl,
    url,
    type,
    pathParams,
    queryParams,
    headerParams,
    requestBodyJson,
    isRawJsonMode,
    authToken,
    hasAuthentication,
    formDataToJson
  ]);

  // Execute the API request
  const executeRequest = async () => {
    setIsLoading(true);
    setResponse(null);

    try {
      const finalUrl = buildRequestUrl();
      const headers = buildHeaders();

      let body: string | FormData | undefined;
      if (type.toUpperCase() !== "GET" && type.toUpperCase() !== "DELETE") {
        if (isMultipart) {
          const formData = new FormData();
          // Add file fields
          for (const [key, file] of Object.entries(fileFields)) {
            if (file) formData.append(key, file);
          }
          // Add non-file form fields
          for (const [key, value] of Object.entries(bodyFormData)) {
            if (value !== undefined && value !== null && value !== "") {
              formData.append(key, String(value));
            }
          }
          body = formData;
        } else {
          const raw = isRawJsonMode ? requestBodyJson : formDataToJson();
          // Validate and re-serialize to strip invisible characters
          try {
            body = JSON.stringify(JSON.parse(raw));
          } catch {
            setResponse({ error: "Invalid JSON in request body. Please check your syntax." });
            setIsLoading(false);
            return;
          }
        }
      }

      const res = await fetch(finalUrl, { body, headers, method: type.toUpperCase() });

      const responseHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      let responseData: Record<string, unknown> | string;
      const contentType = res.headers.get("content-type");
      if (contentType?.includes("application/json")) {
        responseData = await res.json();
      } else {
        responseData = await res.text();
      }

      setResponse({
        data: responseData as Record<string, unknown>,
        headers: responseHeaders,
        status: res.status,
        statusText: res.statusText
      });
    } catch (error) {
      setResponse({
        error: error instanceof Error ? error.message : "An error occurred"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Add query parameter
  const addQueryParam = () => {
    setQueryParams([...queryParams, { key: "", value: "" }]);
  };

  // Remove query parameter
  const removeQueryParam = (index: number) => {
    setQueryParams(queryParams.filter((_, i) => i !== index));
  };

  // Update query parameter
  const updateQueryParam = (index: number, field: "key" | "value", value: string) => {
    const updated = [...queryParams];
    updated[index][field] = value;
    setQueryParams(updated);
  };

  // Copy response to clipboard
  const copyResponse = async () => {
    if (response?.data) {
      const text = typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2);
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Get form field value by dot-separated path
  const getFormField = (path: string): unknown => {
    const keys = path.split(".");
    let current: Record<string, unknown> = bodyFormData;
    for (const key of keys) {
      if (current == null || typeof current !== "object") return "";
      current = current[key] as Record<string, unknown>;
    }
    return current;
  };

  // Update form field value
  const updateFormField = (path: string, value: unknown) => {
    setBodyFormData((prev) => {
      const updated = { ...prev };
      const keys = path.split(".");
      let current = updated;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }

      current[keys[keys.length - 1]] = value;
      return updated;
    });
  };

  // Check if a field is a file upload (binary format)
  const isFileField = (field: ResponseInfo) => {
    return field.type.includes("binary");
  };

  // Render body form fields
  const renderBodyField = (field: ResponseInfo, path: string = "") => {
    const fieldPath = path ? `${path}.${field.title}` : field.title;
    const fieldId = `body-${fieldPath}`;

    if (field.children) {
      return (
        <div className="space-y-2 rounded-lg border p-3 pt-2" key={fieldPath}>
          <Label className="font-medium text-sm">
            {field.title}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-gray-500 text-xs">{field.description}</p>}
          <div className="space-y-2 pl-3">{field.children.items.map((child) => renderBodyField(child, fieldPath))}</div>
        </div>
      );
    }

    // File upload field
    if (isFileField(field)) {
      return (
        <div className="space-y-1 pt-2" key={fieldPath}>
          <Label className="text-sm" htmlFor={fieldId}>
            {field.title}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.description && <p className="text-gray-500 text-xs">{field.description}</p>}
          <Input
            accept="*/*"
            id={fieldId}
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setFileFields((prev) => ({ ...prev, [field.title]: file }));
            }}
            type="file"
          />
          {fileFields[field.title] && (
            <p className="text-gray-500 text-xs">
              Selected: {fileFields[field.title]?.name} ({(fileFields[field.title]?.size ?? 0 / 1024 / 1024).toFixed(2)} MB)
            </p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-1 pt-2" key={fieldPath}>
        <Label className="text-sm" htmlFor={fieldId}>
          {field.title}
          {field.required && <span className="text-red-500">*</span>}
        </Label>
        {field.description && <p className="text-gray-500 text-xs">{field.description}</p>}
        <Input
          id={fieldId}
          onChange={(e) => {
            const value =
              field.type === "number" || field.type === "integer" ? Number.parseFloat(e.target.value) || 0 : e.target.value;
            updateFormField(fieldPath, value);
          }}
          placeholder={`Enter ${field.title}`}
          type={field.type === "number" || field.type === "integer" ? "number" : "text"}
          value={String(getFormField(fieldPath) ?? "")}
        />
      </div>
    );
  };

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger asChild>
        <Button style={{ flexShrink: 0 }}>
          <IconPlayerPlayFilled />
          Try It
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-[90vh] flex-col gap-4" dir="ltr">
          <EndpointUrl
            action={
              <Button disabled={isLoading} onClick={executeRequest} style={{ flexShrink: 0 }}>
                {isLoading ? (
                  <>
                    <IconLoader2 className="animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <IconPlayerPlayFilled />
                    Execute
                  </>
                )}
              </Button>
            }
            type={type}
            url={url}
          />

          <div className="grid grid-cols-2 gap-8 py-4">
            <div className="flex flex-col gap-4">
              {/* Authentication Section */}
              {hasAuthentication && (
                <div className="space-y-2 rounded-md border p-4">
                  <h3 className="border-b pb-2 font-semibold">Authentication</h3>
                  <div className="space-y-1 pt-2">
                    <Label className="text-xs" htmlFor="auth-token">
                      Bearer Token
                    </Label>
                    <Input
                      id={authTokenId}
                      onChange={(e) => setAuthToken(e.target.value)}
                      placeholder="Enter your bearer token"
                      type="password"
                      value={authToken}
                    />
                  </div>
                </div>
              )}

              {/* Header Parameters Section */}
              {parameters?.header && parameters.header.length > 0 && (
                <div className="space-y-2 rounded-md border p-4">
                  <h3 className="border-b pb-2 font-semibold">Headers</h3>
                  <div className="space-y-2">
                    {parameters.header.map((param) => (
                      <div className="space-y-1 pt-2" key={param.title}>
                        <Label className="text-xs">
                          {param.title}
                          {param.required && <span className="text-red-500">*</span>}
                        </Label>
                        {param.description && param.description !== "No description provided" && (
                          <p className="text-gray-500 text-xs">{param.description}</p>
                        )}
                        <Input
                          onChange={(e) =>
                            setHeaderParams((prev) => ({
                              ...prev,
                              [param.title]: e.target.value
                            }))
                          }
                          placeholder={`Enter ${param.title}`}
                          value={headerParams[param.title] || ""}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Path Parameters Section */}
              {pathParameterNames.length > 0 && (
                <div className="space-y-2 rounded-md border p-4">
                  <h3 className="border-b pb-2 font-semibold">Path Parameters</h3>
                  <div className="space-y-2">
                    {pathParameterNames.map((param) => {
                      const paramInfo = parameters?.path.find((p) => p.title === param);
                      return (
                        <div className="space-y-1 pt-2" key={param}>
                          <Label className="text-xs" htmlFor={pathParamId}>
                            {param}
                            {paramInfo?.required && <span className="text-red-500">*</span>}
                          </Label>
                          {paramInfo?.description && <p className="text-gray-500 text-xs">{paramInfo.description}</p>}
                          <Input
                            id={pathParamId}
                            onChange={(e) =>
                              setPathParams((prev) => ({
                                ...prev,
                                [param]: e.target.value
                              }))
                            }
                            placeholder={`Enter ${param}`}
                            value={pathParams[param] || ""}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Query Parameters Section */}
              {(parameters?.query && parameters.query.length > 0) || queryParams.length > 0 ? (
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold">Query Parameters</h3>
                    <Button onClick={addQueryParam} size="xs" type="button" variant="outline">
                      Add Parameter
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {/* Predefined query parameters */}
                    {parameters?.query?.map((param) => (
                      <div className="flex gap-2" key={`${param.title}-${queryParamId}`}>
                        <div className="flex-1">
                          <Input disabled placeholder="Key" value={param.title} />
                        </div>
                        <div className="flex-1">
                          <Input
                            onChange={(e) => {
                              const existing = queryParams.find((p) => p.key === param.title);
                              if (existing) {
                                const index = queryParams.indexOf(existing);
                                updateQueryParam(index, "value", e.target.value);
                              } else {
                                setQueryParams([...queryParams, { key: param.title, value: e.target.value }]);
                              }
                            }}
                            placeholder={`Enter ${param.title}`}
                          />
                        </div>
                      </div>
                    ))}

                    {/* Dynamic query parameters */}
                    {queryParams.map((param, index) => {
                      const isPredefined = parameters?.query?.some((p) => p.title === param.key);
                      if (isPredefined) return null;

                      return (
                        <div className="flex gap-2" key={`${param.key}-${index}`}>
                          <div className="flex-1">
                            <Input
                              onChange={(e) => updateQueryParam(index, "key", e.target.value)}
                              placeholder="Key"
                              value={param.key}
                            />
                          </div>
                          <div className="flex-1">
                            <Input
                              onChange={(e) => updateQueryParam(index, "value", e.target.value)}
                              placeholder="Value"
                              value={param.value}
                            />
                          </div>
                          <Button onClick={() => removeQueryParam(index)} size="sm" type="button" variant="outline">
                            Remove
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* Request Body Section */}
              {requestBody && requestBody.properties.length > 0 && (
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold">
                      Request Body
                      {isMultipart && <span className="ml-2 font-normal text-gray-500 text-xs">(multipart/form-data)</span>}
                    </h3>
                    {!isMultipart && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            setIsRawJsonMode(false);
                            setRequestBodyJson(formDataToJson());
                          }}
                          size="xs"
                          type="button"
                          variant={isRawJsonMode ? "outline" : "default"}
                        >
                          Form
                        </Button>
                        <Button
                          onClick={() => {
                            setIsRawJsonMode(true);
                            setRequestBodyJson(formDataToJson());
                          }}
                          size="xs"
                          type="button"
                          variant={isRawJsonMode ? "default" : "outline"}
                        >
                          Raw JSON
                        </Button>
                      </div>
                    )}
                  </div>

                  {!isMultipart && isRawJsonMode ? (
                    <div className="space-y-1">
                      <Label className="text-sm" htmlFor="raw-json">
                        JSON Content
                      </Label>
                      <textarea
                        className={cn(
                          "flex min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2",
                          "text-sm shadow-sm transition-colors placeholder:text-muted-foreground",
                          "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                          "disabled:cursor-not-allowed disabled:opacity-50",
                          "font-mono"
                        )}
                        id={rawJsonId}
                        onChange={(e) => setRequestBodyJson(e.target.value)}
                        placeholder="Enter JSON content"
                        value={requestBodyJson}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">{requestBody.properties.map((field) => renderBodyField(field))}</div>
                  )}
                </div>
              )}
            </div>

            {/* Response Section */}
            <div className="flex flex-col gap-4">
              <div>
                <CodeBlock
                  tabs={[
                    {
                      code: formatCurlCommand(dynamicCurl),
                      copyCode: normalizeCurlCommand(dynamicCurl),
                      language: "bash",
                      name: "curl"
                    }
                  ]}
                />
              </div>

              {response && (
                <div className="space-y-2 rounded-md border p-4">
                  <div className="flex items-center justify-between border-b pb-2">
                    <h3 className="font-semibold">Response</h3>
                    <Button onClick={copyResponse} size="xs" type="button" variant="outline">
                      {copied ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy"}
                    </Button>
                  </div>

                  {response.error ? (
                    <div className="rounded-md bg-red-50 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
                      <p className="font-medium text-sm">Error</p>
                      <p className="text-sm">{response.error}</p>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-2 py-1 font-medium text-xs",
                            response.status && response.status >= 200 && response.status < 300
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : response.status && response.status >= 400
                                ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          )}
                        >
                          {response.status} {response.statusText}
                        </span>
                        <Label className="text-sm">Response Body</Label>
                      </div>

                      <div className="space-y-1">
                        <pre
                          className={cn(
                            "overflow-auto rounded-md bg-gray-50 p-3 dark:bg-gray-900",
                            "max-h-[300px] font-mono text-xs"
                          )}
                        >
                          {typeof response.data === "string" ? response.data : JSON.stringify(response.data, null, 2)}
                        </pre>
                      </div>

                      {response.headers && Object.keys(response.headers).length > 0 && (
                        <details className="space-y-1 pt-4">
                          <summary className="cursor-pointer font-medium text-sm">Response Headers</summary>
                          <pre
                            className={cn(
                              "overflow-auto rounded-md bg-gray-50 p-3 dark:bg-gray-900",
                              "max-h-[200px] font-mono text-xs"
                            )}
                          >
                            {JSON.stringify(response.headers, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
