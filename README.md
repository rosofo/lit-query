# lit-query
LitElement bindings for [@tanstack/query-core](https://www.npmjs.com/package/@tanstack/query-core).

A tiny library which exposes the intuitive API of @tanstack/query, similarly to react-query et al.

## Usage

If you've ever used react-query the interface is familiar. `lit-query` exposes a few decorators to provide the query client to a component tree and to consume queries and mutations.

### Setup the query client

Create a query client and provide it to your component tree like so:

```ts
import { QueryClient } from "@tanstack/query-core";
import { provideQueryClient } from "lit-query";

@customElement("my-app")
export class MyApp extends LitElement {
  @provideQueryClient
  client = new QueryClient();

  render() {
    return html`...`;
  }
}
```

The `QueryClient` comes from the core library and manages its own query cache. Any component which wants to use queries/mutations needs to have access to it. This decorator uses context (similarly to React's context) to make the client available.

### Consume queries and mutations

You use queries and mutations with the `consumeQuery` and `consumeMutation` property decorators. You use them on a property which will represent the state of the query. Like so:

```ts
@customElement("todos-list")
export class TodosApp extends LitElement {
  @consumeQuery(["todos"], () => fetch(`/api/todos`).then((res) => res.json()))
  query?: QueryObserverResult<{ todos: Todo[] }>;
  
  @consumeMutation({ mutationFn: (todo: Minimal<Todo>) => toggleTodo(todo) })
  toggleMutation?: Mutation<Todo, unknown, Partial<Todo> & { id: string }>;

  render() {
    return html`...`;
  }
}
```

### Accessing the QueryClient in mutation callbacks

In React, hooks are used in a shared scope where it is easy to call `useQueryClient` and access the client in a subsequent `useMutation`. A common use-case for this is setting query data with the result of a mutation.

In Lit things work differently, so instead, the QueryClient is always provided by lit-query as part of the mutation context.

Here's an example:

```ts
@consumeMutation({
  mutationFn: (todo: Minimal<Todo>) => toggleTodo(todo),
  onSuccess: (result, _vars, context) => {
    context?.client.setQueryData(
      ["todos"],
      produce<{ todos: Todo[] }>(({ todos }) => {
        const item = todos.find((item) => item.id === result.id);
        if (item) Object.assign(item, result);
      })
    );
  },
})
toggleMutation?: Mutation<Todo, unknown, Partial<Todo> & { id: string }>;
```

## Under the hood

The decorators exposed by this library work by attaching [Reactive Controllers](https://lit.dev/docs/composition/controllers/) to components.
