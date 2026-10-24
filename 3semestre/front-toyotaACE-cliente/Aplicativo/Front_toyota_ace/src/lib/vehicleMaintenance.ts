import { addYears, isValid, parseISO } from "date-fns";

export function isReviewAppointmentType(type: string | undefined): boolean {
  return (type || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase()
    .includes("revis");
}

export function getNextReviewDate(
  appointments: {
    data: string;
    tipoServico?: string;
    tipoServicio?: string;
  }[],
): Date | null {
  const reviewDates = appointments
    .filter((appointment) =>
      isReviewAppointmentType(appointment.tipoServico ?? appointment.tipoServicio),
    )
    .map((appointment) => parseISO(appointment.data))
    .filter(isValid);

  if (reviewDates.length === 0) return null;
  const latestReview = reviewDates.reduce(
    (latest, current) => current > latest ? current : latest,
  );
  return addYears(latestReview, 1);
}
