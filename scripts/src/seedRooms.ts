import { db, roomsTable } from "@workspace/db";

type RoomSeed = { name: string; guestPrice: number };

const royalStandardRooms = ["103", "104", "105", "106", "203", "204", "205", "206", "302"];
const royalSingleRoomsBase = ["101", "102", "107", "108", "201", "202", "207", "208"];

const rooms: RoomSeed[] = [
  ...royalStandardRooms.map((num) => ({ name: `Royal Standard - Room ${num}`, guestPrice: 15000 })),
  ...royalSingleRoomsBase.map((num) => ({ name: `Royal Single - Room ${num}`, guestPrice: 20000 })),
  { name: "Royal Single - Room 303", guestPrice: 25000 },
  { name: "Royal Suite - Room 304", guestPrice: 30000 },
  { name: "Royal Suite - Room 301", guestPrice: 50000 },
];

async function seed() {
  console.log("Seeding Rooms (Royal Standard / Royal Single / Royal Suite)...");
  for (const room of rooms) {
    await db.insert(roomsTable).values({
      name: room.name,
      description: "",
      imageUrl: null,
      imageUrls: [],
      videoUrls: [],
      guestPrice: String(room.guestPrice),
      memberPrice: String(room.guestPrice),
      commissionPct: "10",
    });
  }
  console.log(`  Inserted ${rooms.length} rooms.`);
  console.log("Done seeding rooms.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
