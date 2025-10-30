import axios, { AxiosHeaders } from "axios";
import { toast } from "sonner";

import { ACCESS_TOKEN_KEY } from "@/constants/storage";

import isClient from "../isClient";

import type { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

const axiosRequestMiddleware = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const headers = new AxiosHeaders(config.headers);
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (accessToken) {
    headers.set({ Authorization: `Bearer ${String(accessToken)}` });
  }

  return { ...config, headers };
};

function axiosErrorMiddleware(error: AxiosError): AxiosError {
  const isErrorResponseValid = !!error.response;
  const statusCode = error.response?.status;

  if (isErrorResponseValid) {
    const errResponse = error.response?.data as {
      data?: string;
      error?: { message: string; name: string; status: number };
    };
    const errorMessage = errResponse.error?.message || "خطایی رخ داده است";

    if (isClient()) toast.error(errorMessage);

    throw new Error(JSON.stringify({ message: errorMessage, statusCode }));
  } else {
    throw new Error(JSON.stringify({ message: "خطایی رخ داده است", statusCode: 500 }));
  }
}

const responseMiddleware = (response: AxiosResponse): AxiosResponse => response;

const axiosClient = axios.create({
  headers: { "Content-Type": "application/json" },
  timeout: 1000 * 60 * 5
});

axiosClient.interceptors.request.use(axiosRequestMiddleware);
axiosClient.interceptors.response.use(responseMiddleware, axiosErrorMiddleware);

export { axiosClient };
