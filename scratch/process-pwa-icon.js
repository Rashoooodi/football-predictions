const sharp = require("sharp");
const path = require("path");

const inputPath = "/Users/rashidjanahi/.gemini/antigravity-cli/brain/9bc80d4c-fc55-4e1c-b71b-ceff8bac04aa/pwa_icon_1782755381976.jpg";
const publicDir = "/Users/rashidjanahi/projects/football-predictions/public";

async function processIcons() {
  console.log("Processing icons...");
  
  // Create 512x512 png
  await sharp(inputPath)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, "icon-512.png"));
  console.log("Generated public/icon-512.png");

  // Create 192x192 png
  await sharp(inputPath)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, "icon-192.png"));
  console.log("Generated public/icon-192.png");

  // Create apple-touch-icon.png (180x180 is typical for iOS)
  await sharp(inputPath)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, "apple-touch-icon.png"));
  console.log("Generated public/apple-touch-icon.png");
}

processIcons().catch((err) => {
  console.error("Error processing PWA icons:", err);
});
