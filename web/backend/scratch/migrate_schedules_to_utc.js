const { PrismaClient } = require('@prisma/client');
const { fromZonedTime } = require('date-fns-tz');
const prisma = new PrismaClient();

async function migrate() {
  console.log("🚀 Starting Timezone Migration for DoctorSchedules...");
  
  const schedules = await prisma.doctorSchedule.findMany({
    include: { doctor: true }
  });

  console.log(`Found ${schedules.length} schedules to process.`);

  for (const schedule of schedules) {
    const doctorTz = schedule.doctor.timezone || 'Asia/Karachi';
    const { startTime, endTime, dayOfWeek } = schedule;

    // Use a fixed Monday for conversion
    const dummyDate = "2024-01-01";
    const utcStartDate = fromZonedTime(`${dummyDate} ${startTime}:00`, doctorTz);
    const utcEndDate = fromZonedTime(`${dummyDate} ${endTime}:00`, doctorTz);

    const dayShift = utcStartDate.getUTCDay() - 1;
    const newDayOfWeek = (parseInt(dayOfWeek) + dayShift + 7) % 7;
    
    const pad = (n) => String(n).padStart(2, "0");
    const utcStart = `${pad(utcStartDate.getUTCHours())}:${pad(utcStartDate.getUTCMinutes())}`;
    const utcEnd = `${pad(utcEndDate.getUTCHours())}:${pad(utcEndDate.getUTCMinutes())}`;

    console.log(`  Updating ID ${schedule.id}: (${doctorTz}) ${startTime} (Day ${dayOfWeek}) -> ${utcStart} (Day ${newDayOfWeek} UTC)`);

    await prisma.doctorSchedule.update({
      where: { id: schedule.id },
      data: {
        startTime: utcStart,
        endTime: utcEnd,
        dayOfWeek: newDayOfWeek
      }
    });
  }

  console.log("✅ Migration complete!");
}

migrate()
  .catch(e => {
    console.error("❌ Migration failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
