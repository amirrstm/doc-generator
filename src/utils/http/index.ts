import QueryString from "query-string";

import { axiosClient } from "./axios";

import type { AxiosRequestConfig } from "axios";

export type FetchOptions<
  Params extends Maybe<Dictionary> = Dictionary,
  Body extends Maybe<Dictionary | Array<unknown> | FormData> = undefined
> = Omit<AxiosRequestConfig<Body>, "baseURL"> & { params?: Params };

class HttpClient {
  public get<Data extends APIResponseType = Dictionary, Params extends Maybe<Dictionary> = Dictionary>(
    options: FetchOptions<Params>
  ): Promise<Data> {
    const config = typeof options === "string" ? { url: options } : options;

    return this.request<Data, Params>({ method: "GET", ...config });
  }

  public post<
    Data extends APIResponseType = Dictionary,
    Params extends Maybe<Dictionary> = Dictionary,
    Body extends Dictionary | Array<unknown> | FormData = Dictionary
  >(options: Omit<FetchOptions<Params, Body>, "method"> = {}): Promise<Data> {
    return this.request<Data, Params, Body>({ method: "POST", ...options });
  }

  public patch<
    Data extends APIResponseType = Dictionary,
    Params extends Maybe<Dictionary> = Dictionary,
    Body extends Dictionary | Array<unknown> = Dictionary
  >(options: Omit<FetchOptions<Params, Body>, "method"> = {}): Promise<Data> {
    return this.request<Data, Params, Body>({ method: "PATCH", ...options });
  }

  public put<
    Data extends APIResponseType = Dictionary,
    Params extends Maybe<Dictionary> = Dictionary,
    Body extends Dictionary | Array<unknown> = Dictionary
  >(options: Omit<FetchOptions<Params, Body>, "method"> = {}): Promise<Data> {
    return this.request<Data, Params, Body>({ method: "PUT", ...options });
  }

  public delete<Data extends APIResponseType = Dictionary, Params extends Maybe<Dictionary> = Dictionary>(
    options: Omit<FetchOptions<Params>, "method"> = {}
  ): Promise<Data> {
    return this.request<Data, Params>({ method: "DELETE", ...options });
  }

  public async request<
    Data extends APIResponseType = Dictionary,
    Params extends Maybe<Dictionary> = Dictionary,
    Body extends Maybe<Dictionary | Array<unknown> | FormData> = undefined
  >(options: FetchOptions<Params, Body>): Promise<Data> {
    const { headers = {}, ...restOptions } = options;

    return axiosClient
      .request({ baseURL: "", headers, paramsSerializer: (p) => QueryString.stringify(p), ...restOptions })
      .then((res) => res.data as Data);
  }
}

const Http = new HttpClient();

export default Http;
