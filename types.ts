
export interface TimeZoneInfo {
  id: string;
  name: string;
  customLabel?: string;
  zone: string;
  offset: string;
  isLocal?: boolean;
}

export interface ClockProps {
  timezone: string;
  size?: number;
  showDetails?: boolean;
  showSeconds?: boolean;
  label?: string;
  onRemove?: () => void;
  onEditLabel?: (newLabel: string) => void;
}
