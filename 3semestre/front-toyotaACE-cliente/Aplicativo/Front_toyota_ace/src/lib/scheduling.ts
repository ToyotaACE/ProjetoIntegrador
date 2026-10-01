export type ReservedAppointment = {
  date: string;
  time: string;
};

const BUSINESS_START_HOUR = 8;
const BUSINESS_END_HOUR = 17;

function localDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function normalizeAppointmentTime(time: string) {
  const [hours = "", minutes = ""] = time.split(":");
  return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function getInitialAppointmentDate(now = new Date()) {
  const latestSlot = `${String(BUSINESS_END_HOUR - 1).padStart(2, "0")}:00`;
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;
  const initialDate = new Date(now);

  if (currentTime >= latestSlot) {
    initialDate.setDate(initialDate.getDate() + 1);
  }

  return initialDate;
}

export function getAvailableAppointmentTimes(
  date: string,
  appointments: ReservedAppointment[],
  now = new Date(),
) {
  const reservedTimes = new Set(
    appointments
      .filter((appointment) => appointment.date === date)
      .map((appointment) => normalizeAppointmentTime(appointment.time)),
  );
  const isToday = date === localDateKey(now);
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(
    now.getMinutes(),
  ).padStart(2, "0")}`;

  return Array.from(
    { length: BUSINESS_END_HOUR - BUSINESS_START_HOUR },
    (_, index) => `${String(BUSINESS_START_HOUR + index).padStart(2, "0")}:00`,
  ).filter((time) => !reservedTimes.has(time) && (!isToday || time > currentTime));
}