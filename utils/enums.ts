// 時間
export enum TimeConf {
  ONE_MONTH = 30 * 24 * 60 * 60 * 1000,
  ONE_DAY = 24 * 60 * 60 * 1000,
  ONE_HOUR = 60 * 60 * 1000,
  ONE_MS = 1,
  UTC_OFFSET = 8,
  DAYS_PER_WEEK = 7,
  ONE = 1,
  MINUS_ONE = -1,
  MS_PER_SECOND = 1000,
  MONTH = 'month',
  MS = 'millisecond',
}

// Moment用enum
export enum MomentConf {
  formatYearMonthDay = 'YYYYMMDD',
  formatMonthWithoutPadding = 'M',
  formatYear = 'YYYY',
  formatCompleteTime = 'YYYYMMDD HH:mm:ss'
}

// 機構狀態
export const COMPANY_STATUS: any = {
  test: 'T', // 測試
  open: 'O', // 開啟
  close: 'C', // 關閉
};

// 星期數
export enum DayOfWeek {
  SUNDAY = 0,
  MONDAY = 1,
  TUESDAY = 2,
  WEDNESDAY = 3,
  THURSDAY = 4,
  FRIDAY = 5,
  SATURDAY = 6,
};