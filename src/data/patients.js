/**
 * src/data/patients.js
 * Longitudinal Patient Registry for PulseCare.
 * All records are fictional sample data for frontend prototype demonstration.
 */

export const mockPatientsList = [
  {
    patientId: 'P001',
    id: 'P001',
    name: 'Rahul Sharma',
    patientName: 'Rahul Sharma',
    age: 42,
    gender: 'Male',
    bloodGroup: 'B+',
    phone: '+91 98765 43210',
    email: 'rahul.sharma@example.com',
    registrationDate: '14 Jul 2025',
    assignedDoctorId: 'D001',
    assignedDoctor: 'Dr. Arun Kumar',
    doctorSpecialty: 'Cardiology & Internal Medicine',
    hospital: 'City Hospital Multispeciality',
    primaryCondition: 'Stage 1 Essential Hypertension & Pre-diabetes',
    status: 'Active Care',
    emergencyContact: {
      name: 'Priya Sharma (Spouse)',
      phone: '+91 98765 43211',
      relation: 'Spouse',
    },
    allergies: [
      {
        id: 'ALG-01',
        allergen: 'Penicillin / Beta-lactams',
        reaction: 'Cutaneous urticaria & generalized pruritus (documented 2021)',
        severity: 'Critical (Contraindicated)',
      },
    ],
  },
  {
    patientId: 'P002',
    id: 'P002',
    name: 'Meera Iyer',
    patientName: 'Meera Iyer',
    age: 58,
    gender: 'Female',
    bloodGroup: 'O+',
    phone: '+91 98111 55667',
    email: 'meera.iyer@example.com',
    registrationDate: '02 Sep 2025',
    assignedDoctorId: 'D001',
    assignedDoctor: 'Dr. Arun Kumar',
    doctorSpecialty: 'Cardiology',
    hospital: 'City Hospital Multispeciality',
    primaryCondition: 'Post-PCI Stenting / Coronary Artery Disease',
    status: 'Active Care',
    emergencyContact: {
      name: 'Ramesh Iyer (Son)',
      phone: '+91 98111 55668',
      relation: 'Son',
    },
    allergies: [
      {
        id: 'ALG-02',
        allergen: 'Sulfa Drugs',
        reaction: 'Mild skin rash',
        severity: 'Moderate',
      },
    ],
  },
  {
    patientId: 'P003',
    id: 'P003',
    name: 'Amit Patel',
    patientName: 'Amit Patel',
    age: 36,
    gender: 'Male',
    bloodGroup: 'A+',
    phone: '+91 98222 33445',
    email: 'amit.patel@example.com',
    registrationDate: '20 Jan 2026',
    assignedDoctorId: 'D001',
    assignedDoctor: 'Dr. Arun Kumar',
    doctorSpecialty: 'Cardiology & General Medicine',
    hospital: 'City Hospital Multispeciality',
    primaryCondition: 'Exertional Tachycardia Evaluation',
    status: 'Stable',
    emergencyContact: {
      name: 'Anjali Patel',
      phone: '+91 98222 33446',
      relation: 'Sister',
    },
    allergies: [],
  },
];
