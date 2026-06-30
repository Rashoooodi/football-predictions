const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const csvPath = '/Users/rashidjanahi/Downloads/contacts.csv';
const dbPath = path.join(__dirname, '../football.db');

if (!fs.existsSync(csvPath)) {
  console.error("Contacts CSV not found at: " + csvPath);
  process.exit(1);
}

const db = new Database(dbPath);

const content = fs.readFileSync(csvPath, 'utf8');
// Normalize line endings
const lines = content.replace(/\r/g, '').split('\n');

const headers = lines[0].split(',');
const firstNameIdx = headers.indexOf('First Name');
const lastNameIdx = headers.indexOf('Last Name');
const phoneIdx = headers.indexOf('Phone 1 - Value');

console.log(`Indices - First Name: ${firstNameIdx}, Last Name: ${lastNameIdx}, Phone: ${phoneIdx}`);

let count = 0;
// Skip header line
for (let i = 1; i < lines.length; i++) {
  const line = lines[i].trim();
  if (!line) continue;
  
  // Simple CSV parser supporting quotes
  const cols = [];
  let current = '';
  let inQuotes = false;
  for (let c = 0; c < line.length; c++) {
    const char = line[c];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      cols.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cols.push(current.trim());

  if (cols.length <= Math.max(firstNameIdx, phoneIdx)) continue;

  const firstName = cols[firstNameIdx] || '';
  const lastName = cols[lastNameIdx] || '';
  let rawPhone = cols[phoneIdx] || '';

  if (!firstName && !lastName) continue;

  // Clean name
  let name = `${firstName} ${lastName}`.trim();
  
  // Clean phone number
  if (rawPhone.includes(':::')) {
    rawPhone = rawPhone.split(':::')[0].trim();
  }
  
  // Keep only digits and + sign
  let phone = rawPhone.replace(/[^\d+]/g, '');
  if (!phone) continue;

  // If 8 digits and no country code, prepend +973 (Bahrain)
  if (phone.length === 8 && !phone.startsWith('+')) {
    phone = '+973' + phone;
  }

  // Prepend + if not present but starts with 973
  if (phone.startsWith('973') && !phone.startsWith('+')) {
    phone = '+' + phone;
  }

  // Insert into DB
  try {
    const existing = db.prepare("SELECT * FROM users WHERE phone = ?").get(phone);
    if (existing) {
      console.log(`Skipped existing user: ${name} (${phone})`);
    } else {
      db.prepare("INSERT INTO users (name, phone, is_admin) VALUES (?, ?, 0)").run(name, phone);
      console.log(`Added user: ${name} (${phone})`);
      count++;
    }
  } catch (err) {
    console.error(`Error inserting ${name} (${phone}):`, err.message);
  }
}

console.log(`Successfully imported ${count} users!`);
db.close();
