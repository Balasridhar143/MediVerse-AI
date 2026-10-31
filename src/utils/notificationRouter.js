/**
 * Resolves the direct clinical destination URL for a clicked notification.
 * Accurately routes to the exact record/section across Patient, Doctor, and Hospital Admin portals.
 * Handles:
 * - Prescriptions -> /patient/prescriptions?id=... (or /doctor/prescriptions?id=...)
 * - Appointments (Requested, Confirmed, Rejected, Cancelled) -> /patient/appointments?id=... (or /doctor/dashboard?id=...)
 * - Telemedicine / Video Consultations -> /patient/consultation?appointmentId=... (or /doctor/consultations?appointmentId=...)
 * - Clinical Diagnostic / Medical Reports -> /patient/reports?id=... (or /doctor/clinical-context?id=...)
 * - Direct Patient / Clinician Messages -> /patient/consultation?appointmentId=... (or /doctor/consultations?appointmentId=...)
 * - Medicine Adherence & Dose Reminders -> /patient/medicines?id=...
 * - Clinical Follow-up Schedules -> /patient/follow-ups (or /doctor/follow-ups)
 * - Security & Password Alerts -> /patient/security (or /doctor/security)
 * - Emergency Triage -> /patient/emergency (or /hospital/emergency-cases)
 */
export function resolveNotificationDestination(notif, role) {
  if (!notif) return null;

  const userRole = role === 'hospital_admin' || role === 'hospital' ? 'hospital' : (role || 'patient');
  const type = (notif.type || '').toUpperCase();
  const title = (notif.title || '').toLowerCase();
  const msg = (notif.message || '').toLowerCase();
  const fullText = `${title} ${msg}`;
  const rawLink = (notif.link_url || '').trim();

  // 1. Resolve entity ID (from explicit entity_id field or regex from message/title)
  let entityId = notif.entity_id || null;
  if (!entityId) {
    const rxMatch = fullText.match(/(?:#|\b)(rx[_-]?[a-zA-Z0-9_-]+)/i);
    if (rxMatch) {
      entityId = rxMatch[1];
    } else {
      const aptMatch = fullText.match(/(?:#|\b)(apt[_-]?[a-zA-Z0-9_-]+)/i);
      if (aptMatch) {
        entityId = aptMatch[1];
      } else {
        const repMatch = fullText.match(/(?:#|\b)(rep[_-]?[a-zA-Z0-9_-]+)/i);
        if (repMatch) {
          entityId = repMatch[1];
        }
      }
    }
  }

  // 2. If explicit link_url is provided, sanitize role prefixes & append entity ID if missing
  if (rawLink) {
    let resolvedLink = rawLink;

    // Normalize generic routes
    if (resolvedLink === '/appointments' || resolvedLink === '/patient/appointments') {
      if (userRole === 'doctor') resolvedLink = '/doctor/dashboard';
      else if (userRole === 'hospital') resolvedLink = '/hospital/appointments';
      else resolvedLink = '/patient/appointments';
    }

    // Role-safe redirect if link starts with mismatched role prefix
    if (userRole === 'doctor' && resolvedLink.startsWith('/patient/')) {
      if (resolvedLink.includes('/appointments')) resolvedLink = '/doctor/dashboard';
      else if (resolvedLink.includes('/consultation')) resolvedLink = '/doctor/consultations';
      else if (resolvedLink.includes('/prescriptions')) resolvedLink = '/doctor/prescriptions';
      else if (resolvedLink.includes('/medicines')) resolvedLink = '/doctor/medicine-safety';
      else if (resolvedLink.includes('/security')) resolvedLink = '/doctor/security';
      else resolvedLink = '/doctor/dashboard';
    } else if (userRole === 'patient' && resolvedLink.startsWith('/doctor/')) {
      if (resolvedLink.includes('/dashboard') || resolvedLink.includes('/appointments')) resolvedLink = '/patient/appointments';
      else if (resolvedLink.includes('/consultations')) resolvedLink = '/patient/consultation';
      else if (resolvedLink.includes('/prescriptions')) resolvedLink = '/patient/prescriptions';
      else if (resolvedLink.includes('/security')) resolvedLink = '/patient/security';
      else resolvedLink = '/patient/dashboard';
    } else if (userRole === 'hospital' && (resolvedLink.startsWith('/patient/') || resolvedLink.startsWith('/doctor/'))) {
      if (resolvedLink.includes('/appointments')) resolvedLink = '/hospital/appointments';
      else if (resolvedLink.includes('/emergency')) resolvedLink = '/hospital/emergency-cases';
      else resolvedLink = '/hospital/dashboard';
    }

    // Append entity ID query parameter if not already present
    if (entityId && !resolvedLink.includes('id=') && !resolvedLink.includes('appointmentId=') && !resolvedLink.includes('rxId=')) {
      const sep = resolvedLink.includes('?') ? '&' : '?';
      if (resolvedLink.includes('/consultation')) {
        resolvedLink = `${resolvedLink}${sep}appointmentId=${encodeURIComponent(entityId)}`;
      } else {
        resolvedLink = `${resolvedLink}${sep}id=${encodeURIComponent(entityId)}`;
      }
    }

    return resolvedLink;
  }

  // 3. Intelligent type & context detection
  // A. Prescription
  if (
    type === 'PRESCRIPTION_ISSUED' ||
    type === 'PRESCRIPTION_UPDATED' ||
    title.includes('prescription') ||
    msg.includes('prescription') ||
    msg.includes('prescribed')
  ) {
    if (userRole === 'doctor') {
      return entityId ? `/doctor/prescriptions?id=${encodeURIComponent(entityId)}` : '/doctor/prescriptions';
    }
    return entityId ? `/patient/prescriptions?id=${encodeURIComponent(entityId)}` : '/patient/prescriptions';
  }

  // B. Video Consultation / Tele-Room
  if (
    type === 'VIDEO_CALL' ||
    type === 'CONSULTATION_STARTED' ||
    title.includes('tele-room') ||
    title.includes('video consultation') ||
    msg.includes('video consultation') ||
    msg.includes('tele-room') ||
    msg.includes('consultation room') ||
    msg.includes('webrtc')
  ) {
    if (userRole === 'doctor') {
      return entityId ? `/doctor/consultations?appointmentId=${encodeURIComponent(entityId)}` : '/doctor/consultations';
    }
    return entityId ? `/patient/consultation?appointmentId=${encodeURIComponent(entityId)}` : '/patient/consultation';
  }

  // C. Appointments (Request, Confirmation, Cancellation, Reschedule)
  if (
    type.startsWith('APPOINTMENT_') ||
    title.includes('appointment') ||
    msg.includes('appointment') ||
    msg.includes('consultation request') ||
    msg.includes('consultation confirmed') ||
    msg.includes('consultation cancelled') ||
    msg.includes('consultation declined')
  ) {
    if (userRole === 'doctor') {
      return entityId ? `/doctor/dashboard?id=${encodeURIComponent(entityId)}` : '/doctor/dashboard';
    }
    if (userRole === 'hospital') {
      return entityId ? `/hospital/appointments?id=${encodeURIComponent(entityId)}` : '/hospital/appointments';
    }
    return entityId ? `/patient/appointments?id=${encodeURIComponent(entityId)}` : '/patient/appointments';
  }

  // D. Medical Reports & Diagnostics
  if (
    type === 'REPORT_READY' ||
    type === 'LAB_RESULT' ||
    title.includes('report') ||
    title.includes('diagnostic') ||
    title.includes('lab result') ||
    msg.includes('medical report') ||
    msg.includes('diagnostic report') ||
    msg.includes('lab report')
  ) {
    if (userRole === 'doctor') {
      return entityId ? `/doctor/clinical-context?id=${encodeURIComponent(entityId)}` : '/doctor/clinical-context';
    }
    return entityId ? `/patient/reports?id=${encodeURIComponent(entityId)}` : '/patient/reports';
  }

  // E. Direct / Consultation Messages
  if (
    type === 'NEW_MESSAGE' ||
    type === 'CONSULTATION_MESSAGE' ||
    title.includes('message') ||
    msg.includes('chat message') ||
    msg.includes('sent a message')
  ) {
    if (userRole === 'doctor') {
      return entityId ? `/doctor/consultations?appointmentId=${encodeURIComponent(entityId)}` : '/doctor/consultations';
    }
    return entityId ? `/patient/consultation?appointmentId=${encodeURIComponent(entityId)}` : '/patient/consultation';
  }

  // F. Daily Medications & Adherence Reminders
  if (
    type === 'MEDICINE_REMINDER' ||
    title.includes('medication') ||
    title.includes('dose') ||
    msg.includes('medication') ||
    msg.includes('dose reminder') ||
    msg.includes('time to take')
  ) {
    return entityId ? `/patient/medicines?id=${encodeURIComponent(entityId)}` : '/patient/medicines';
  }

  // G. Clinical Follow-ups
  if (type === 'FOLLOW_UP' || title.includes('follow-up') || msg.includes('follow-up')) {
    return userRole === 'doctor' ? '/doctor/follow-ups' : '/patient/follow-ups';
  }

  // H. Security & Credential Updates
  if (
    type === 'SECURITY_ALERT' ||
    title.includes('security') ||
    title.includes('password') ||
    msg.includes('password') ||
    msg.includes('security') ||
    msg.includes('login')
  ) {
    return userRole === 'doctor' ? '/doctor/security' : userRole === 'hospital' ? '/hospital/security' : '/patient/security';
  }

  // I. Emergency Cases
  if (type === 'EMERGENCY' || title.includes('emergency') || msg.includes('emergency')) {
    return userRole === 'hospital' ? '/hospital/emergency-cases' : '/patient/emergency';
  }

  // J. Fallback to portal dashboard
  return userRole === 'doctor' ? '/doctor/dashboard' : userRole === 'hospital' ? '/hospital/dashboard' : '/patient/dashboard';
}
