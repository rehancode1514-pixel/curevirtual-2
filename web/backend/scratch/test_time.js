const { fromZonedTime } = require("date-fns-tz");

const combined = "2024-04-18 21:00";
const tz = "Asia/Karachi";
const d = fromZonedTime(combined, tz);
console.log(d.toISOString());
