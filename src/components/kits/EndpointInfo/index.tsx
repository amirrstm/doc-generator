"use client";

import { Execute } from "./Execute";
import { EndpointUrl } from "./Url";

import type { ReactElement } from "react";

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
  title: string;
  curl: string;
  baseUrl: string;
  description: string;
  hasAuthentication?: boolean;
  parameters?: Parameters;
  requestBody?: { required: boolean; properties: Array<ResponseInfo> };
};

export default function EndpointInfo({
  type,
  url,
  title,
  description,
  hasAuthentication,
  parameters,
  requestBody,
  curl,
  baseUrl
}: Props): ReactElement {
  return (
    <EndpointUrl
      action={
        <Execute
          baseUrl={baseUrl}
          curl={curl}
          description={description}
          hasAuthentication={hasAuthentication}
          parameters={parameters}
          requestBody={requestBody}
          title={title}
          type={type}
          url={url}
        />
      }
      type={type}
      url={url}
    />
  );
}
