export type HttpResponse<T = unknown> = {
  data: T;
  message: string;
  success: boolean;
};

export type HttpItemsResponse<T = unknown> = {
  message: string;
  success: boolean;
  data: { items: T[]; pagination: { total: number; page: number; pageSize: number } };
};
