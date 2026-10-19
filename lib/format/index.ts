// The one place pages format dates, numbers, performances and names.
export { resolveLocale, cleanDuv } from "./locale";
export {
  parseDuvDate,
  formatDate,
  formatDateRange,
  formatMonthYear,
  formatYear,
  formatDayMonth,
  formatMonthShort,
  formatWeekday,
  formatStartTime,
  formatDateVariant,
  formatBirthDate,
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
  formatPerformanceText,
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
export { externalUrl, linkHost, splitLinks, type TextSegment } from "./links";
export { DateText, type DateTextProps } from "./DateText";
export {
  parseClimb,
  formatClimb,
  formatCourseLength,
  formatLengthAndClimb,
  COURSE_SEPARATOR,
} from "./course";
