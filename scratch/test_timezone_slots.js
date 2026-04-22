const { fromZonedTime, toZonedTime } = require("date-fns-tz");

const date = "2026-04-19";
const doctorTz = "Asia/Karachi"; // GMT+5
const startTime = "00:00";
const endTime = "02:00";

console.log(`Doctor Date: ${date}`);
console.log(`Doctor Timezone: ${doctorTz}`);
console.log(`Working Hours: ${startTime} - ${endTime}`);

const startSlotUTC = fromZonedTime(`${date} ${startTime}:00`, doctorTz);
const endSlotUTC = fromZonedTime(`${date} ${endTime}:00`, doctorTz);

console.log(`UTC Start: ${startSlotUTC.toISOString()}`);
console.log(`UTC End: ${endSlotUTC.toISOString()}`);

// Simulate patient in Karachi (same as doctor)
const patientTz = "Asia/Karachi";
const patientStart = toZonedTime(startSlotUTC, patientTz);
console.log(`Patient (Karachi) sees: ${patientStart.toLocaleString()}`);

// Simulate patient in New York (GMT-4)
const patientTzNY = "America/New_York";
const patientStartNY = toZonedTime(startSlotUTC, patientTzNY);
console.log(`Patient (New York) sees: ${patientStartNY.toLocaleString()}`);
