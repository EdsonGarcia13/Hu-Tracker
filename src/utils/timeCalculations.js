// src/utils/timeCalculations.js

const WORK_HOURS_PER_DAY = 9;

/**
 * Normaliza una fecha quitando horas/minutos/segundos.
 */
function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Cuenta días hábiles (lunes a viernes) entre dos fechas, inclusive.
 */
function businessDaysBetween(start, end) {
  const s = startOfDay(start);
  const e = startOfDay(end);
  if (e < s) return 0;

  let count = 0;
  const current = new Date(s);

  while (current <= e) {
    const day = current.getDay(); // 0 = domingo, 6 = sábado
    if (day !== 0 && day !== 6) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/**
 * Calcula elapsed y delay de una HU considerando días hábiles y 9h/día.
 */
function calculateElapsedAndDelay(start, due, today, original, completed) {
  const startDate = startOfDay(start);
  const dueDate = startOfDay(due);
  const todayDate = startOfDay(today);

  // Días hábiles entre inicio y hoy
  const daysElapsed = businessDaysBetween(startDate, todayDate);
  const capacityHoursByNow = daysElapsed * WORK_HOURS_PER_DAY;

  // Días hábiles entre inicio y due date
  const daysUntilDue = businessDaysBetween(startDate, dueDate);
  const capacityHoursUntilDue = daysUntilDue * WORK_HOURS_PER_DAY;

  // Validar retraso (hoy después de due date y no completado)
  let delayHours = 0;
  if (completed < original && todayDate > dueDate) {
    const overdueDays = businessDaysBetween(dueDate, todayDate);
    delayHours = overdueDays * WORK_HOURS_PER_DAY;
  }

  const delayDays = +(delayHours / WORK_HOURS_PER_DAY).toFixed(1);

  return {
    elapsedDays: +(capacityHoursByNow / WORK_HOURS_PER_DAY).toFixed(1),
    elapsedEffectiveHours: Math.min(capacityHoursByNow, original),
    delayHours,
    delayDays,
    capacityHoursUntilDue,
    capacityDaysUntilDue: daysUntilDue,
  };
}



export { WORK_HOURS_PER_DAY, businessDaysBetween, calculateElapsedAndDelay };
