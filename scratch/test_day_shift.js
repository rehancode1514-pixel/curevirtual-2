const { fromZonedTime, toZonedTime } = require("date-fns-tz");

function testDayShift() {
  const dateStr = "2024-05-20"; // Monday
  const doctorTz = "Asia/Karachi"; // +5

  // 00:00:00 PKT on Monday is 19:00:00 UTC on Sunday
  const startOfDoctorDayUTC = fromZonedTime(`${dateStr} 00:00:00`, doctorTz);
  console.log(`UTC Time: ${startOfDoctorDayUTC.toISOString()}`); // ...T19:00:00.000Z

  // SERVER (likely UTC) getDay()
  console.log(`Server getDay(): ${startOfDoctorDayUTC.getDay()}`); // Likely 0 (Sunday)

  // Fix attempt 1: toZonedTime
  const zonedDate = toZonedTime(startOfDoctorDayUTC, doctorTz);
  console.log(`Zoned Date getDay(): ${zonedDate.getDay()}`); // Should be 1 (Monday)
}

testDayShift();
