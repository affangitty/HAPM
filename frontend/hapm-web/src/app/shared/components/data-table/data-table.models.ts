export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => string | number | null | undefined;
  className?: string;
}
