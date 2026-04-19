const { fromZonedTime, format } = require('date-fns-tz');

const doctorTz = 'Asia/Karachi'; // UTC+5
const startTime = '00:05';
const dayOfWeek = 2; // Tuesday

const dummyDate = '2024-01-01'; // Monday
const utcStartDate = fromZonedTime(`${dummyDate} ${startTime}:00`, doctorTz);

console.log('--- TEST LOGIC ---');
console.log('Doctor Local:', startTime, 'PK (Day 2)');
console.log('UTC Date Object:', utcStartDate.toISOString());

const dayShift = utcStartDate.getUTCDay() - 1;
const newDayOfWeek = (dayOfWeek + dayShift + 7) % 7;

const pad = (n) => String(n).padStart(2, '0');
const utcStart = `${pad(utcStartDate.getUTCHours())}:${pad(utcStartDate.getUTCMinutes())}`;

console.log('UTC Formatted:', utcStart, '(Day', newDayOfWeek, ')');

// Expected: 19:05 (Previous day)
if (utcStart === '19:05' && newDayOfWeek === 1) {
    console.log('✅ SUCCESS');
} else {
    console.log('❌ FAILURE');
}
