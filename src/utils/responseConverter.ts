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

function convertResponseInfoToJSON(responseInfo: ResponseInfo): unknown {
  const getValueByType = (type: string) => {
    // Extract base type by taking the part before any parentheses
    const baseType = type.split("(")[0].trim().toLowerCase();

    switch (baseType) {
      case "string":
        return "<string>";
      case "number":
      case "integer":
        return "<number>";
      case "boolean":
        return "<boolean>";
      case "array":
        return [];
      case "object":
        return {};
      default:
        return "<unknown>";
    }
  };

  if (responseInfo.children && responseInfo.children.items.length > 0) {
    if (responseInfo.type.toLowerCase() === "array") {
      return [convertResponseInfoArrayToJSON(responseInfo.children.items)];
    } else {
      return convertResponseInfoArrayToJSON(responseInfo.children.items);
    }
  }

  return getValueByType(responseInfo.type);
}

function convertResponseInfoArrayToJSON(responseInfoArray: ResponseInfo[]): unknown {
  const result: Record<string, unknown> = {};

  for (const item of responseInfoArray) {
    result[item.title] = convertResponseInfoToJSON(item);
  }

  return result;
}

export function convertResponsesToJSON(responses?: Responses): Record<number, unknown> | null {
  const result: Record<number, unknown> = {};
  if (!responses) return null;

  Object.entries(responses).forEach(([statusCode, responseInfoArray]) => {
    const statusCodeNumber = Number.parseInt(statusCode, 10);
    result[statusCodeNumber] = convertResponseInfoArrayToJSON(responseInfoArray);
  });

  return result;
}
