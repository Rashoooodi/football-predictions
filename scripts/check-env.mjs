const required = ["JWT_SECRET"];
const recommended = [
  "CRON_SECRET",
  "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
];

const missingRequired = required.filter((key) => !process.env[key]);
const missingRecommended = recommended.filter((key) => !process.env[key]);

if (missingRequired.length) {
  console.error("Missing required env:", missingRequired.join(", "));
  process.exit(1);
}

if (missingRecommended.length) {
  console.warn("Missing recommended env:", missingRecommended.join(", "));
}

console.log("Environment looks OK.");
