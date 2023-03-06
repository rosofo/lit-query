export { QueryClient } from "@tanstack/query-core";
export { provideQueryClient, consumeQuery } from "./context";
import { MutationObserverResult, QueryClient } from "@tanstack/query-core";

export type Mutation<
  TData = unknown,
  TError = unknown,
  TVariables = unknown,
  TContext extends { client: QueryClient } = { client: QueryClient }
> = MutationObserverResult<TData, TError, TVariables, TContext>;
