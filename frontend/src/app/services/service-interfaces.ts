export interface TodayCalendar {
  id: number;
  begin: string;
  end: string | null;
  dayType: string;
  dayOver: boolean;
  duration: number;
  durationFormatted: string;
  employee: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface TodayCalendars {
  date: string;
  dayNumber: number;
  firstCheckInTime: string;
  lastCheckOutTime: string;
  totalDurationFormatted: string;
}

// Interfaces existantes
export interface TodayCalendar {
  id: number;
  begin: string;
  end: string | null;
  dayType: string;
  dayOver: boolean;
  duration: number;
  durationFormatted: string;
  employee: {
    id: number;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface TodayCalendars {
  date: string;
  dayNumber: number;
  firstCheckInTime: string;
  lastCheckOutTime: string;
  totalDurationFormatted: string;
}

export interface PendingDay {
  id: number;
  begin: string;
  end: string | null;
  dayType: string;
  duration: number;
  dayOver: boolean;
}

export interface MonthCalendar {
  date: string;
  dayNumber: number;
  firstCheckInTime: string;
  lastCheckOutTime: string;
  totalDurationFormatted: string;
}

export interface RegisterResponse {
  datetimeField: string;
  durationField: number;
}
