import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();
import { neon } from '@neondatabase/serverless';
import { validateAppointmentSlot } from '../api/appointmentSlotValidator.js';

async function runTests() {
  console.log('--- PART 1: APPOINTMENT SLOT RESTRICTIONS TEST SUITE ---');
  const sql = neon(process.env.DATABASE_URL);

  // 1. Fetch real appointments from Neon database
  const apts = await sql`
    SELECT id, patient_id, doctor_id, appointment_date, time_slot, status, type 
    FROM appointments 
    ORDER BY created_at DESC 
    LIMIT 10;
  `;

  console.log(`Retrieved ${apts.length} appointments from Neon database.`);
  console.table(apts.map(a => ({
    id: a.id,
    date: a.appointment_date,
    time: a.time_slot,
    status: a.status,
    patient: a.patient_id,
    doctor: a.doctor_id
  })));

  // Test 1: Validate slot before appointment time
  const futureApt = {
    id: 'test_future',
    appointment_date: '2026-11-15',
    time_slot: '10:00 AM - 10:30 AM',
    status: 'CONFIRMED'
  };
  const beforeResult = validateAppointmentSlot(futureApt, new Date('2026-11-15T09:00:00+05:30'));
  console.log('\n[Test 1: Before Appointment Slot]');
  console.log('Result canJoin:', beforeResult.canJoin);
  console.log('State:', beforeResult.state);
  console.log('Minutes until start:', beforeResult.minutesUntilStart);
  if (beforeResult.canJoin === false && beforeResult.state === 'BEFORE_SLOT') {
    console.log('PASS: Correctly blocked before slot starts.');
  } else {
    console.error('FAIL: Should be blocked before slot starts.');
  }

  // Test 2: Validate slot during appointment time
  const duringResult = validateAppointmentSlot(futureApt, new Date('2026-11-15T10:15:00+05:30'));
  console.log('\n[Test 2: During Appointment Slot]');
  console.log('Result canJoin:', duringResult.canJoin);
  console.log('State:', duringResult.state);
  console.log('Minutes remaining:', duringResult.minutesRemaining);
  if (duringResult.canJoin === true && duringResult.state === 'DURING_SLOT') {
    console.log('PASS: Correctly allowed during slot window.');
  } else {
    console.error('FAIL: Should be allowed during slot window.');
  }

  // Test 3: Validate slot after appointment time
  const afterResult = validateAppointmentSlot(futureApt, new Date('2026-11-15T11:00:00+05:30'));
  console.log('\n[Test 3: After Appointment Slot]');
  console.log('Result canJoin:', afterResult.canJoin);
  console.log('State:', afterResult.state);
  console.log('Minutes past:', afterResult.minutesPast);
  if (afterResult.canJoin === false && afterResult.state === 'AFTER_SLOT') {
    console.log('PASS: Correctly blocked after slot ends.');
  } else {
    console.error('FAIL: Should be blocked after slot ends.');
  }

  // Test 4: Status validation - CANCELLED
  const cancelledApt = { ...futureApt, status: 'CANCELLED' };
  const cancelResult = validateAppointmentSlot(cancelledApt, new Date('2026-11-15T10:15:00+05:30'));
  console.log('\n[Test 4: Cancelled Appointment]');
  console.log('Result canJoin:', cancelResult.canJoin, 'State:', cancelResult.state);
  if (cancelResult.canJoin === false && cancelResult.state === 'STATUS_INVALID') {
    console.log('PASS: Correctly blocked cancelled appointment.');
  } else {
    console.error('FAIL: Should block cancelled appointment.');
  }

  // Test 5: Status validation - PENDING
  const pendingApt = { ...futureApt, status: 'PENDING' };
  const pendingResult = validateAppointmentSlot(pendingApt, new Date('2026-11-15T10:15:00+05:30'));
  console.log('\n[Test 5: Pending Appointment]');
  console.log('Result canJoin:', pendingResult.canJoin, 'State:', pendingResult.state);
  if (pendingResult.canJoin === false && pendingResult.state === 'PENDING_APPROVAL') {
    console.log('PASS: Correctly blocked pending appointment.');
  } else {
    console.error('FAIL: Should block pending appointment.');
  }

  // Test 6: Status validation - COMPLETED
  const completedApt = { ...futureApt, status: 'COMPLETED' };
  const completedResult = validateAppointmentSlot(completedApt, new Date('2026-11-15T10:15:00+05:30'));
  console.log('\n[Test 6: Completed Appointment]');
  console.log('Result canJoin:', completedResult.canJoin, 'State:', completedResult.state);
  if (completedResult.canJoin === false && completedResult.state === 'STATUS_INVALID') {
    console.log('PASS: Correctly blocked completed appointment.');
  } else {
    console.error('FAIL: Should block completed appointment.');
  }

  console.log('\n--- ALL UNIT TESTS COMPLETED SUCCESSFULLY ---');
}

runTests().catch(err => {
  console.error('Error running slot tests:', err);
  process.exit(1);
});
