export interface DataTableColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => string | number | null | undefined;
  className?: string;
  headerClassName?: string;
  /** Hide this field on mobile card layout. */
  hideOnMobile?: boolean;
  /** Mobile card layout: primary title line. */
  mobileRole?: 'title' | 'subtitle';
}
