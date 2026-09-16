export interface MonthlyPeriod {
  /** Formato AAAA-MM */
  key: string;
  label: string;
  closed: boolean;
  closedAt?: string;
}
