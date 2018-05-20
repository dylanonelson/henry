const months = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const days = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

function padLeft(num) {
  if (num < 10) {
    return `0${num}`;
  }

  return num.toString();
}

export function getMonthName(date) {
  return months[date.getMonth()];
}

export function getDayName(date) {
  return days[date.getDay() - 1];
}

export function getIsoDate(date) {
  const year = date.getFullYear();
  const month = padLeft(date.getMonth() + 1);
  const day = padLeft(date.getDate());
  return `${year}-${month}-${day}`;
}

export function getIsoTime(date) {
  const hours = padLeft(date.getHours());
  const minutes = padLeft(date.getMinutes());
  return `${hours}:${minutes}`;
}
