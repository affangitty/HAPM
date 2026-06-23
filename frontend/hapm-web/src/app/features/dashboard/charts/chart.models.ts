export interface ChartDataPoint {
  label: string;
  [seriesKey: string]: string | number;
}

export interface ChartSeries {
  key: string;
  label: string;
  color: string;
  fillOpacity?: number;
}

export interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export interface ChartPadding {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export const DEFAULT_CHART_PADDING: ChartPadding = { top: 12, right: 12, bottom: 28, left: 36 };
