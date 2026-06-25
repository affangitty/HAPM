import { DestroyRef, signal, WritableSignal } from '@angular/core';
import { Observable } from 'rxjs';
import { loadByRouteParam } from './route-param.util';

export interface DetailRouteState<T> {
  loading: WritableSignal<boolean>;
  notFound: WritableSignal<boolean>;
  data: WritableSignal<T | null>;
}

/** Standard detail-page loader: reactive param, cancellable requests, not-found signal. */
export function initDetailRouteLoader<T>(
  paramKey: string,
  loader: (id: number) => Observable<T>,
  destroyRef: DestroyRef,
  options?: { onLoaded?: (data: T) => void },
): DetailRouteState<T> {
  const loading = signal(true);
  const notFound = signal(false);
  const data = signal<T | null>(null);

  loadByRouteParam(
    paramKey,
    loader,
    {
      onStart: () => {
        loading.set(true);
        notFound.set(false);
        data.set(null);
      },
      onData: (value) => {
        data.set(value);
        loading.set(false);
        options?.onLoaded?.(value);
      },
      onError: () => {
        notFound.set(true);
        loading.set(false);
      },
    },
    { destroyRef },
  );

  return { loading, notFound, data };
}
