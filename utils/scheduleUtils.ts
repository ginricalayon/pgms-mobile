export const daysOfWeek = [
  { label: "Monday", value: "monday" },
  { label: "Tuesday", value: "tuesday" },
  { label: "Wednesday", value: "wednesday" },
  { label: "Thursday", value: "thursday" },
  { label: "Friday", value: "friday" },
  { label: "Saturday", value: "saturday" },
  { label: "Sunday", value: "sunday" },
];

export const daysOfWeekEdit = [
  { label: "Monday", value: "Monday" },
  { label: "Tuesday", value: "Tuesday" },
  { label: "Wednesday", value: "Wednesday" },
  { label: "Thursday", value: "Thursday" },
  { label: "Friday", value: "Friday" },
  { label: "Saturday", value: "Saturday" },
  { label: "Sunday", value: "Sunday" },
];

export const formatTime = (hour: number, minute: number): string => {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${period}`;
};

export const generateTimeSlots = (): string[] => {
  const slots = [];
  let hour = 8;
  let minute = 0;

  while (hour < 20 || (hour === 20 && minute === 0)) {
    const timeString = formatTime(hour, minute);
    slots.push(timeString);

    minute += 30;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }

  return slots;
};

export const calculateEndTime = (startTime: string): string => {
  const [time, period] = startTime.split(" ");
  const [hourStr, minuteStr] = time.split(":");
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);

  if (period === "PM" && hour !== 12) {
    hour += 12;
  } else if (period === "AM" && hour === 12) {
    hour = 0;
  }

  hour += 2;

  if (hour >= 24) {
    hour -= 24;
  }

  const endPeriod = hour >= 12 ? "PM" : "AM";
  let displayHour = hour;

  if (hour === 0) {
    displayHour = 12;
  } else if (hour > 12) {
    displayHour = hour - 12;
  }

  const displayMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${displayMinute} ${endPeriod}`;
};

export const normalizeTimeFormat = (timeString: string): string => {
  if (!timeString) return timeString;

  const timeRegex = /(\d{1,2}):(\d{2})\s*(AM|PM)/i;
  const match = timeString.match(timeRegex);

  if (!match) return timeString;

  const [, hourStr, minuteStr, period] = match;
  let hour = parseInt(hourStr);
  const minute = parseInt(minuteStr);
  const normalizedPeriod = period.toUpperCase();

  if (normalizedPeriod === "PM" && hour !== 12) {
    hour += 12;
  } else if (normalizedPeriod === "AM" && hour === 12) {
    hour = 0;
  }

  const finalPeriod = hour >= 12 ? "PM" : "AM";
  const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const displayMinute = minute.toString().padStart(2, "0");

  return `${displayHour}:${displayMinute} ${finalPeriod}`;
};
