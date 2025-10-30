"use client";

import TitleGenerator from "@/components/kits/TitleGenerator";
import { useProject } from "@/providers/Project";

import ContentAuthorization from "../components/kits/Authorization";
import { ContentDocumentCodes } from "../components/kits/DocumentCodes";
import EndpointInfo from "../components/kits/EndpointInfo";
import ContentObject from "../components/kits/Object";

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
type Responses = {
  [key: string]: Array<ResponseInfo>;
};

type Props = {
  path: string;
  curl: string;
  method: string;
  title: string;
  baseUrl: string;
  category: string;
  description: string;
  hasAuthentication: boolean;
  parameters?: Parameters;
  languages: { javascript: string; python: string };
  requestBody?: {
    required: boolean;
    properties: Array<ResponseInfo>;
  };
  responses?: Responses;
};

export default function EndpointContainer({
  path,
  curl,
  title,
  method,
  category,
  languages,
  responses,
  parameters,
  description,
  requestBody,
  hasAuthentication,
  baseUrl: staticBaseUrl
}: Props): ReactElement {
  const { selectedEnvironment } = useProject();
  const baseUrl = selectedEnvironment?.url || staticBaseUrl || "https://api.example.com";

  return (
    <div className="flex flex-col xl:flex-row xl:gap-12">
      <div className="flex max-w-[1440px] flex-col gap-8 xl:max-w-xl">
        <TitleGenerator description={description} subTitle={title} title={category} />

        <EndpointInfo
          baseUrl={baseUrl}
          curl={curl}
          description={description}
          hasAuthentication={hasAuthentication}
          parameters={parameters}
          requestBody={requestBody}
          title={title}
          type={method.toLowerCase()}
          url={`${baseUrl}${path}`}
        />

        <div className="flex flex-col space-y-6 md:block xl:hidden">
          <ContentDocumentCodes baseUrl={baseUrl} curl={curl} languages={languages} responses={responses} />
        </div>

        {hasAuthentication && <ContentAuthorization />}

        {parameters && parameters.path.length > 0 && <ContentObject data={parameters.path} title="Path Parameters" />}

        {parameters && parameters.query.length > 0 && <ContentObject data={parameters.query} title="Query Parameters" />}

        {requestBody && requestBody.properties.length > 0 && (
          <ContentObject data={requestBody.properties} subtitle="application/json" title="Body" />
        )}

        {responses &&
          Object.keys(responses).map((statusCode) => (
            <ContentObject
              data={responses[statusCode] || []}
              key={statusCode}
              subtitle={`${statusCode} - application/json`}
              title="Response"
            />
          ))}
      </div>

      <div className="sticky top-24 hidden h-[calc(100vh-7rem)] flex-1 overflow-auto xl:block">
        <div className="grid-rows relative grid w-full grid-rows-[repeat(auto-fit,minmax(0,min-content))] gap-6">
          <ContentDocumentCodes baseUrl={baseUrl} curl={curl} languages={languages} responses={responses} />
        </div>
      </div>
    </div>
  );
}
