import {
  consume,
  ContextConsumer,
  ContextProvider,
  createContext,
  provide,
} from "@lit-labs/context";
import {
  MutationObserver,
  MutationObserverOptions,
  MutationObserverResult,
  MutationOptions,
  QueryClient,
  QueryFunction,
  QueryKey,
  QueryObserver,
  QueryObserverOptions,
  QueryObserverResult,
} from "@tanstack/query-core";
import { ReactiveControllerHost, ReactiveElement } from "lit";
import { state } from "lit/decorators.js";
import { ClientMounter, ObserverController } from "./controllers";

export const queryClientContext = createContext<QueryClient>("query-client");
export const provideQueryClient = <K extends PropertyKey>(
  protoOrDescriptor: ReactiveElement & Record<K, QueryClient>,
  name?: K
) => {
  const _connectedCallback = protoOrDescriptor.connectedCallback;

  protoOrDescriptor.connectedCallback = function () {
    _connectedCallback.apply(this);
    if (name) {
      const client = this[name];
      new ClientMounter(this, client);
      new ContextProvider(this, queryClientContext, client);
    } else throw new Error("provideQueryClient must decorate a property.");
  };
};

export const consumeQueryClient = <K extends PropertyKey>(
  protoOrDescriptor: ReactiveElement & Partial<Record<K, QueryClient>>,
  name?: K
) => {
  consume({ context: queryClientContext, subscribe: true })(
    protoOrDescriptor,
    name
  );
};

export const consumeQuery =
  <
    TQueryFnData = unknown,
    TError = unknown,
    TData = TQueryFnData,
    TQueryData = TQueryFnData,
    TQueryKey extends QueryKey = QueryKey
  >(
    key: TQueryKey,
    fn: QueryFunction<TQueryFnData, TQueryKey>,
    config?: QueryObserverOptions<
      TQueryFnData,
      TError,
      TData,
      TQueryData,
      TQueryKey
    >
  ) =>
  <K extends PropertyKey>(
    protoOrDescriptor: ReactiveElement &
      Partial<Record<K, QueryObserverResult<TData, TError>>>,
    name?: K
  ) => {
    state()(protoOrDescriptor, name);
    if (!name) throw new Error("no property");
    const _connectedCallback = protoOrDescriptor.connectedCallback;
    protoOrDescriptor.connectedCallback = function () {
      _connectedCallback.apply(this);
      new ContextConsumer(this, queryClientContext, (client) => {
        const observer = new QueryObserver(client, {
          queryFn: fn,
          queryKey: key,
          ...config,
        });
        const controller = new ObserverController(this, name, observer);
      });
    };
  };

export const consumeMutation =
  <
    TData = unknown,
    TError = unknown,
    TVariables = unknown,
    TContext extends { client: QueryClient } = { client: QueryClient }
  >(
    config: MutationObserverOptions<TData, TError, TVariables, TContext>
  ) =>
  <K extends PropertyKey>(
    protoOrDescriptor: ReactiveElement &
      Partial<
        Record<K, MutationObserverResult<TData, TError, TVariables, TContext>>
      >,
    name?: K
  ) => {
    state()(protoOrDescriptor, name);
    if (!name) {
      throw Error("No property");
    }
    const _connectedCallback = protoOrDescriptor.connectedCallback;
    protoOrDescriptor.connectedCallback = function () {
      _connectedCallback.apply(this);
      new ContextConsumer(this, queryClientContext, (client) => {
        const _onMutate = config.onMutate ?? ((variables) => undefined);
        config.onMutate = (variables) => {
          const result = _onMutate(variables);
          let out;
          if (result && "then" in result) {
            out = result.then((ctx) => ({ ...(ctx ?? {}), client }));
          } else {
            out = { ...(result ?? {}), client } as any;
          }
          return out;
        };
        const observer = new MutationObserver(client, config);
        new ObserverController(this, name, observer);
      });
    };
  };
