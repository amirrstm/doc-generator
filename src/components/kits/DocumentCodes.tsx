import { CodeBlock } from "@/components/kits/CodeBlocks";
import { formatCurlCommand, normalizeCurlCommand } from "@/utils/curl";
import { convertResponsesToJSON } from "@/utils/responseConverter";

type ResponseInfo = {
  title: string;
  type: string;
  required: boolean;
  description: string;
  children?: { title: string; items: ResponseInfo[] };
};
type Responses = {
  [key: string]: Array<ResponseInfo>;
};

export function ContentDocumentCodes({
  curl,
  baseUrl,
  languages,
  responses
}: {
  curl: string;
  baseUrl: string;
  responses?: Responses;
  languages: { javascript: string; python: string };
}) {
  const responseJson = convertResponsesToJSON(responses);

  return (
    <>
      <CodeBlock
        tabs={[
          {
            code: formatCurlCommand(curl).replace("{baseUrl}", baseUrl),
            copyCode: normalizeCurlCommand(curl).replace("{baseUrl}", baseUrl),
            language: "bash",
            name: "curl"
          },
          ...(languages.python
            ? [
                {
                  code: languages.python,
                  language: "python",
                  name: "python"
                }
              ]
            : []),
          ...(languages.javascript
            ? [
                {
                  code: languages.javascript,
                  language: "javascript",
                  name: "javascript"
                }
              ]
            : [])
        ]}
      />

      {responseJson && Object.keys(responseJson).length > 0 && (
        <CodeBlock
          tabs={Object.keys(responseJson).map((statusCode) => ({
            code: JSON.stringify(responseJson[statusCode as unknown as keyof typeof responseJson], null, 2),
            language: "json",
            name: statusCode
          }))}
        />
      )}
    </>
  );
}
