declare global {
  type Maybe<T> = T | undefined;
  type Dictionary = Record<string, unknown>;
  type APIResponseType = Maybe<Dictionary> | Array<unknown>;
}

export {};
