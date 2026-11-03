/**
 * Appointment Slot Validation Engine for MediVerse AI
 * Enforces strict temporal and clinical rules for video consultations.
 * Validates:
 * - Status (PENDING, CONFIRMED, CANCELLED, REJECTED, COMPLETED)
 * - Allotted appointment slot window (BEFORE_SLOT, DURING_SLOT, AFTER_SLOT)
 * - Precise time parsing for both single times and ranges in IST (+05:30)
 */

export function parseTimeSlotString(timeSlotStr) {
  if (!timeSlotStr || typeof timeSlotStr !== 'string') {
    return { startHour: 10, startMinute: 0, endHour: 10, endMinute: 30, isRange: false };
  }

  const parts = timeSlotStr.split(/[-–—]/).map((p) => p.trim());

  function parseSingleTime(str) {
    const match = str.match(/(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?/i);
    if (!match) return { hour: 10, minute: 0 };

    let hour = parseInt(match[1], 10);
    const minute = match[2] ? parseInt(match[2], 10) : 0;
    const modifier = match[3] ? match[3].toUpperCase() : null;

    if (modifier === 'PM' && hour < 12) hour += 12;
    if (modifier === 'AM' && hour === 12) hour = 0;

    return { hour, minute };
  }

  const start = parseSingleTime(parts[0]);

  let end;
  let isRange = false;
  if (parts.length > 1 && parts[1]) {
    end = parseSingleTime(parts[1]);
    isRange = true;
  } else {
    // Standard allotted consultation slot duration: 60 minutes (1 hour)
    let endMin = start.minute;
    let endHr = (start.hour + 1) % 24;
    end = { hour: endHr, minute: endMin };
  }

  return {
    startHour: start.hour,
    startMinute: start.minute,
    endHour: end.hour,
    endMinute: end.minute,
    isRange,
  };
}

export function parseDateString(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
  }

  // Match YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10),
    };
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = dateStr.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    return {
      year: parseInt(dmyMatch[3], 10),
      month: parseInt(dmyMatch[2], 10),
      day: parseInt(dmyMatch[1], 10),
    };
  }

  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return {
      year: parsed.getFullYear(),
      month: parsed.getMonth() + 1,
      day: parsed.getDate(),
    };
  }

  const today = new Date();
  return { year: today.getFullYear(), month: today.getMonth() + 1, day: today.getDate() };
}

/**
 * Validates whether the given appointment allows joining video consultation at `currentTime`.
 * @param {Object} appointment
 * @param {Date} [currentTime=new Date()]
 * @param {number} [bufferMinutes=0]
 */
export function validateAppointmentSlot(appointment, currentTime = new Date(), bufferMinutes = 0) {
  if (!appointment) {
    return {
      canJoin: false,
      state: 'NOT_FOUND',
      message: 'Appointment record not found.',
      isSlotOpen: false,
    };
  }

  const status = (appointment.status || '').toUpperCase();

  // 1. Check Appointment Status
  if (status === 'CANCELLED') {
    return {
      canJoin: false,
      state: 'STATUS_INVALID',
      status,
      message: 'This consultation appointment was cancelled. Video consultations cannot be started.',
      isSlotOpen: false,
    };
  }

  if (status === 'REJECTED') {
    const reason = appointment.rejection_reason ? `: ${appointment.rejection_reason}` : '';
    return {
      canJoin: false,
      state: 'STATUS_INVALID',
      status,
      message: `This consultation request was declined by the clinician${reason}. Video consultations cannot be started.`,
      isSlotOpen: false,
    };
  }

  if (status === 'COMPLETED') {
    return {
      canJoin: false,
      state: 'STATUS_INVALID',
      status,
      message: 'This consultation has already concluded and is marked as completed.',
      isSlotOpen: false,
    };
  }

  if (status === 'PENDING') {
    return {
      canJoin: false,
      state: 'PENDING_APPROVAL',
      status,
      message: 'This consultation request is pending doctor confirmation. The video room will become accessible during your scheduled slot once approved by your physician.',
      isSlotOpen: false,
    };
  }

  // 2. Parse Date and Slot Window in IST (+05:30)
  const dateObj = parseDateString(appointment.appointment_date || appointment.date);
  const slotObj = parseTimeSlotString(appointment.time_slot || appointment.time);

  const pad = (n) => String(n).padStart(2, '0');
  const datePrefix = `${dateObj.year}-${pad(dateObj.month)}-${pad(dateObj.day)}`;

  const startIso = `${datePrefix}T${pad(slotObj.startHour)}:${pad(slotObj.startMinute)}:00+05:30`;
  const endIso = `${datePrefix}T${pad(slotObj.endHour)}:${pad(slotObj.endMinute)}:00+05:30`;

  const slotStart = new Date(startIso);
  let slotEnd = new Date(endIso);

  // If slot spans midnight
  if (slotEnd.getTime() <= slotStart.getTime()) {
    slotEnd = new Date(slotEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  const now = currentTime instanceof Date ? currentTime : new Date(currentTime);
  const nowMs = now.getTime();
  const startMs = slotStart.getTime() - bufferMinutes * 60 * 1000;
  const endMs = slotEnd.getTime();

  const formattedDate = `${pad(dateObj.day)}/${pad(dateObj.month)}/${dateObj.year}`;
  const formattedTime = appointment.time_slot || appointment.time || '10:00 AM';

  // 3. Before Slot
  if (nowMs < startMs) {
    const msUntil = startMs - nowMs;
    const minutesUntilStart = Math.ceil(msUntil / (60 * 1000));
    const hoursUntilStart = Math.floor(minutesUntilStart / 60);
    const remMins = minutesUntilStart % 60;

    let countdownStr = '';
    if (hoursUntilStart > 0) {
      countdownStr = `${hoursUntilStart} hr ${remMins} min`;
    } else {
      countdownStr = `${minutesUntilStart} min`;
    }

    return {
      canJoin: false,
      state: 'BEFORE_SLOT',
      status,
      message: `Your consultation is scheduled for ${formattedDate} at ${formattedTime}. Your video room will open when your allotted appointment slot begins (in ${countdownStr}).`,
      slotStart,
      slotEnd,
      formattedDate,
      formattedTime,
      minutesUntilStart,
      countdownStr,
      isSlotOpen: false,
    };
  }

  // 4. During Slot
  if (nowMs >= startMs && nowMs <= endMs) {
    const msRemaining = endMs - nowMs;
    const minutesRemaining = Math.max(1, Math.ceil(msRemaining / (60 * 1000)));

    return {
      canJoin: true,
      state: 'DURING_SLOT',
      status,
      message: `Consultation window is active. ${minutesRemaining} minute${minutesRemaining === 1 ? '' : 's'} remaining in this allotted slot.`,
      slotStart,
      slotEnd,
      formattedDate,
      formattedTime,
      minutesRemaining,
      isSlotOpen: true,
    };
  }

  // 5. After Slot
  const minutesPast = Math.floor((nowMs - endMs) / (60 * 1000));
  return {
    canJoin: false,
    state: 'AFTER_SLOT',
    status,
    message: `This appointment slot has expired. The allotted consultation window for ${formattedDate} ended at ${pad(slotObj.endHour)}:${pad(slotObj.endMinute)}. To speak with the physician, please schedule a new appointment or clinical follow-up.`,
    slotStart,
    slotEnd,
    formattedDate,
    formattedTime,
    minutesPast,
    isSlotOpen: false,
  };
}

