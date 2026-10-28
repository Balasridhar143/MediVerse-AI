/**
 * src/data/followUps.js
 * Longitudinal Follow-ups Registry for PulseCare.
 * All records share patientId: "P001".
 */

export const mockFollowUpsList = [
  {
    id: 'fu_01',
    followUpId: 'FU-2026-01',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    doctorName: 'Dr. Arun Kumar',
    doctorId: 'D001',
    department: 'Cardiology',
    hospital: 'City Hospital Multispeciality',
    scheduledDate: '05 Oct 2026',
    scheduledDateIso: '2026-10-05',
    reason: 'Evaluate blood pressure control and therapeutic response after 6 weeks on Telmisartan 40mg.',
    status: 'Scheduled',
    reminderSent: true,
    requiredTests: ['Home Blood Pressure Log', 'Electrolytes check if needed'],
  },
  {
    id: 'fu_02',
    followUpId: 'FU-2026-02',
    patientId: 'P001',
    patientName: 'Rahul Sharma',
    doctorName: 'Dr. Sunita Deshmukh',
    doctorId: 'D003',
    department: 'General Medicine',
    hospital: 'Metro General Healthcare',
    scheduledDate: '15 Nov 2026',
    scheduledDateIso: '2026-11-15',
    reason: 'Quarterly Pre-diabetes follow-up & repeat HbA1c evaluation.',
    status: 'Upcoming',
    reminderSent: false,
    requiredTests: ['Fasting Blood Glucose', 'HbA1c test'],
  },
];
