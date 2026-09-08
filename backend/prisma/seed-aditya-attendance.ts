import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding attendance for Aditya Joshi...");

  const aditya = await prisma.employee.findFirst({
    where: { name: "Aditya Joshi" },
  });

  if (!aditya) {
    console.error("Aditya Joshi not found in the database. Ensure basic seed has run.");
    return;
  }

  // Create attendance for August and September 2026
  const attendanceData = [];
  
  // Helper to get weekdays in a month
  const getWeekdays = (year: number, month: number) => {
    const days = [];
    const date = new Date(year, month, 1);
    while (date.getMonth() === month) {
      if (date.getDay() !== 0 && date.getDay() !== 6) { // Mon-Fri
        days.push(new Date(date));
      }
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const augDays = getWeekdays(2026, 7); // August (0-indexed 7)
  const sepDays = getWeekdays(2026, 8); // September (0-indexed 8)

  const allDays = [...augDays, ...sepDays];

  for (const day of allDays) {
    const checkIn = new Date(day);
    checkIn.setHours(9, 0, 0, 0); // 9:00 AM

    const checkOut = new Date(day);
    checkOut.setHours(17, 0, 0, 0); // 5:00 PM

    attendanceData.push({
      employeeId: aditya.id,
      checkIn,
      checkOut,
      workedHours: 8,
      status: "present" as const,
    });
  }

  // Delete existing to avoid duplicates if run multiple times
  await prisma.attendance.deleteMany({
    where: {
      employeeId: aditya.id,
      checkIn: { gte: new Date(2026, 7, 1) }
    }
  });

  await prisma.attendance.createMany({
    data: attendanceData,
  });

  console.log(`Successfully seeded ${attendanceData.length} attendance records for Aditya Joshi.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
