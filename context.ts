import {
  consume,
  ContextConsumer,
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
import { ObserverController } from "./observer-controller";

export const queryClientContext = createContext<QueryClient>("query-client");
export const provideQueryClient = <K extends PropertyKey>(
  protoOrDescriptor: ReactiveElement & Record<K, QueryClient>,
  name?: K
) => {
  provide({ context: queryClientContext })(protoOrDescriptor, name);
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
      console.log("inside wrapper", this);
      _connectedCallback.apply(this);
      new ContextConsumer(this, queryClientContext, (client) => {
        console.log("received context", client);
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
  <TData = unknown, TError = unknown, TVariables = unknown, TContext = unknown>(
    config: MutationOptions<TData, TError, TVariables, TContext>
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
    console.log("wrapping connectedCallback on prototype", protoOrDescriptor);
    protoOrDescriptor.connectedCallback = function () {
      console.log("inside wrapper", this);
      _connectedCallback.apply(this);
      new ContextConsumer(this, queryClientContext, (client) => {
        console.log("received context", client);
        const observer = new MutationObserver(client, config);
        new ObserverController(this, name, observer);
      });
    };
  };
