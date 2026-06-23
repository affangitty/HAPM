import { map, Observable } from 'rxjs';
import { PagedResult } from './api.models';
import { normalizePagedResult } from './pagination.helper';

/** RxJS operator — normalizes paged API responses. */
export function mapPagedResult<T>() {
  return (source: Observable<PagedResult<T>>) =>
    source.pipe(map((result) => normalizePagedResult(result)));
}

/** Triggers a browser download for blob responses (CSV, PDF, etc.). */
export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Extracts filename from Content-Disposition header when present. */
export function fileNameFromContentDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)/i.exec(header);
  return match?.[1]?.replace(/"/g, '') ?? fallback;
}
