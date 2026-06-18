const { getStudentAnalytics } = require('./src/lib/dashboardService');
const fs = require('fs');
const path = require('path');

// Load env.local manually
try {
  const envContent = fs.readFileSync(path.resolve('.env.local'), 'utf-8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      process.env[match[1]] = (match[2] || '').trim().replace(/(^['"]|['"]$)/g, '');
    }
  });
} catch (e) {
  console.error("Could not load env", e.message);
}

// Mock database config because of Next.js imports
process.env.MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  console.log("Fetching student analytics for 'ryan_p'...");
  try {
    const data = await getStudentAnalytics('ryan_p', 'Grade 5');
    console.log("Analytics result:");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error fetching student analytics:", err);
  }
}

run();
