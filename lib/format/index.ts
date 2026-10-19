// The one place pages format dates, numbers, performances and names.
export { resolveLocale, cleanDuv } from "./locale";
export {
  parseDuvDate,
  formatDate,
  formatDateRange,
  formatMonthYear,
  formatYear,
  formatDayMonth,
  formatStartTime,
  formatDateVariant,
  type DuvDate,
  type FormattedDate,
  type DateVariant,
} from "./dates";
export {
  KM_PER_MILE,
  parseDecimal,
  formatDistance,
  parseDuration,
  formatDuration,
  formatLaps,
  formatCount,
  formatSpeed,
  formatPace,
  parsePerformance,
  formatPerformance,
  type DistanceUnit,
  type NumberOptions,
  type UnitOptions,
  type FormattedQuantity,
  type PerformanceKind,
  type ParsedPerformance,
  type FormattedPerformance,
} from "./numbers";
export {
  formatRunnerName,
  parseDuvName,
  runnerSortKey,
  compareRunnerNames,
  type RunnerName,
} from "./names";
export { DateText, type DateTextProps } from "./DateText";
