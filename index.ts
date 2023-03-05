import {
  MutationObserver,
  MutationObserverOptions,
  QueryClient,
  QueryFunction,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
} from "@tanstack/query-core";
import { ReactiveControllerHost, ReactiveElement } from "lit";
import { ObserverController } from "./observer-controller";

export { QueryClient } from "@tanstack/query-core";

export { provideQueryClient, consumeQuery } from "./context";

export const createFactory = (client: QueryClient) => {
  return {
    query: <
      TQueryFnData = unknown,
      TError = unknown,
      TData = TQueryFnData,
      TQueryData = TQueryFnData,
      TQueryKey extends QueryKey = QueryKey
    >(
      host: ReactiveControllerHost,
      key: TQueryKey,
      fn: QueryFunction<TQueryFnData, TQueryKey>,
      config?: QueryObserverOptions<
        TQueryFnData,
        TError,
        TData,
        TQueryData,
        TQueryKey
      >
    ) => {
      const query = new QueryObserver(client, {
        queryKey: key,
        queryFn: fn,
        ...config,
      });
      const controller = new ObserverController(host, query);
      return controller.state;
    },
    mutation: <
      TMutationFnData = unknown,
      TError = unknown,
      TData = TMutationFnData,
      TVariables = unknown,
      TContext = unknown
    >(
      host: ReactiveControllerHost,
      config: MutationObserverOptions<TData, TError, TVariables, TContext>
    ) => {
      const query = new MutationObserver(client, config);
      const controller = new ObserverController(host, query);
      return controller.state;
    },
  };
};
