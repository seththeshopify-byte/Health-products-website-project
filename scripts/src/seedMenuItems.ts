import { db, menuItemsTable } from "@workspace/db";

// Bar menu — real prices in Nigerian Naira (₦), shown to customers.
const barItems: { name: string; price: number }[] = [
  { name: "Heineken", price: 1000 },
  { name: "Budweiser", price: 1000 },
  { name: "33 Export", price: 800 },
  { name: "Goldberg", price: 800 },
  { name: "Star Radler", price: 800 },
  { name: "Big Stout", price: 1000 },
  { name: "Smirnoff Ice Bottle", price: 1000 },
  { name: "Medium Stout", price: 800 },
  { name: "Double Black", price: 1000 },
  { name: "Coke", price: 500 },
  { name: "Malta Guinness", price: 600 },
  { name: "Fayrouz", price: 500 },
  { name: "Vita Milk", price: 1200 },
  { name: "Chi Exotic", price: 2000 },
  { name: "Hollandia", price: 2000 },
  { name: "Climax Can", price: 800 },
  { name: "Fearless", price: 800 },
  { name: "Blue Bullet", price: 1000 },
  { name: "Black Bullet", price: 1500 },
  { name: "Four Cousins", price: 10000 },
  { name: "Carlo Rossi", price: 8000 },
  { name: "Action Bitters", price: 1000 },
  { name: "Origin Bitters", price: 1000 },
  { name: "Small Campari", price: 5000 },
  { name: "Big Campari", price: 20000 },
  { name: "Martell (VSOP)", price: 70000 },
  { name: "Martell (VS)", price: 45000 },
  { name: "Small Gordon's Gin", price: 1500 },
  { name: "Best Whisky", price: 1500 },
  { name: "Odogwu Bitters", price: 1000 },
  { name: "Power Horse", price: 1000 },
  { name: "Monster", price: 1500 },
  { name: "Small Hennessy", price: 25000 },
  { name: "Hennessy VS", price: 45000 },
  { name: "Hennessy VSOP", price: 70000 },
  { name: "André Rosé", price: 12000 },
  { name: "Black Label", price: 22000 },
  { name: "Agor Red Wine", price: 8000 },
  { name: "Water", price: 300 },
];

// Food + Kitchen items — no listed price. Customers request pricing from
// staff, so guestPrice/memberPrice are left null and hidden on the public
// pages until a price is set in the admin dashboard.
const foodCategories: Record<string, string[]> = {
  Rice: ["Fried Rice", "White Rice", "Jollof Rice", "Spaghetti", "Noodles", "Basmati Rice"],
  Protein: [
    "Turkey", "Chicken", "Snail", "Kpomo", "Titus Fish", "Catfish", "Tilapia",
    "Goat Meat", "Assorted Meat", "Croaker Fish", "Egg", "Beef",
  ],
  Swallow: ["Poundo Yam", "Semovita", "Eba", "Starch", "Wheat", "Amala"],
  Soup: [
    "Vegetable Soup", "Ogbono", "Goatmeat Banga Soup", "Fresh Fish Banga Soup",
    "Dry Fish Banga Soup", "Okro Soup", "Egusi Soup", "Banga Soup",
  ],
  Chips: ["French Fries (Chips)", "Yam", "Plantain"],
  Sauce: ["Salad", "Vegetable Sauce", "Tomatoes Sauce", "Egg Sauce"],
  "Special Order": [
    "Porridge Beans", "Plantain with Fresh Fish Pepper Soup (Okodo)",
    "Yam with Fresh Fish Pepper Soup (Okodo)", "Turkey Sauce", "Goat Meat Sauce",
    "Chicken Sauce", "Special Fried Rice", "Special Okro Soup", "Special Benington Sauce",
  ],
  "Full English Breakfast": [
    "Bread and Tea (Milo and Tin Milk)", "Omelette", "Oat Meal", "Custard",
    "Cornflakes", "Egg", "Bread", "Peak Liquid Tin Milk", "Sausage",
  ],
};

async function seed() {
  console.log("Seeding Bar menu items (priced, category: Bar)...");
  for (const item of barItems) {
    await db.insert(menuItemsTable).values({
      name: item.name,
      description: "",
      type: "drink",
      category: "Bar",
      guestPrice: String(item.price),
      memberPrice: String(item.price),
      commissionPct: "10",
    });
  }
  console.log(`  Inserted ${barItems.length} drink items.`);

  console.log("Seeding Food & Kitchen menu items (no price — request from staff)...");
  let foodCount = 0;
  for (const [category, items] of Object.entries(foodCategories)) {
    for (const name of items) {
      await db.insert(menuItemsTable).values({
        name,
        description: "",
        type: "food",
        category,
        guestPrice: null,
        memberPrice: null,
        commissionPct: "10",
      });
      foodCount++;
    }
  }
  console.log(`  Inserted ${foodCount} food items.`);

  console.log("Done seeding menu items.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
