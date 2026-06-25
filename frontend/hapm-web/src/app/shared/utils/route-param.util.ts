import { DestroyRef, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

/** Subscribe to a route param and reload when it changes; cancels prior requests via switchMap. */
export function loadByRouteParam<T>(
  paramKey: string,
  loader: (id: number) => Observable<T>,
  handlers: {
    onData: (data: T) => void;
    onError?: () => void;
    onStart?: () => void;
  },
  options?: { destroyRef?: DestroyRef; route?: ActivatedRoute },
): void {
  const route = options?.route ?? inject(ActivatedRoute);
  const destroyRef = options?.destroyRef ?? inject(DestroyRef);

  route.paramMap.pipe(
    switchMap((params) => {
      handlers.onStart?.();
      const id = Number(params.get(paramKey));
      return loader(id);
    }),
    takeUntilDestroyed(destroyRef),
  ).subscribe({
    next: (data) => handlers.onData(data),
    error: () => handlers.onError?.(),
  });
}
