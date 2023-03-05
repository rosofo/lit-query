import { MutationObserverResult } from "@tanstack/query-core";
import { Subscribable } from "@tanstack/query-core/build/lib/subscribable";
import { ReactiveController, ReactiveControllerHost } from "lit";

export class ObserverController<R extends object, Label extends PropertyKey>
  implements ReactiveController
{
  private host;
  private propertyName: Label;
  observer;

  constructor(
    host: ReactiveControllerHost & Partial<Record<Label, R>>,
    propertyName: Label,
    observer: Subscribable<(result: R) => void> & { getCurrentResult: () => R }
  ) {
    console.log("constructing ObserverController", observer);
    this.observer = observer;
    this.propertyName = propertyName;
    this.host = host;
    this.host.addController(this);
    this.host[propertyName] = this.observer.getCurrentResult() as any;
  }

  private unsubscribe() {}

  hostConnected(): void {
    this.unsubscribe = this.observer.subscribe((result) => {
      console.log("received update", result);
      this.host[this.propertyName] = result as any;
    });
  }

  hostDisconnected(): void {
    this.unsubscribe();
  }
}
