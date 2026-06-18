const { MongoClient } = require('mongodb');
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

async function inspect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("No MONGODB_URI found in env");
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    
    console.log("=== USERS (ryan_p) ===");
    const users = await db.collection('users').find({ username: 'ryan_p' }).toArray();
    console.log(users);
    
    console.log("=== STUDENTS (ryan_p) ===");
    const students = await db.collection('students').find({ 
      $or: [{ userId: 'ryan_p' }, { studentId: 'ryan_p' }, { name: /ryan/i }] 
    }).toArray();
    console.log(students);
    
    console.log("=== ALL STUDENTS (limit 5) ===");
    const allStuds = await db.collection('students').find({}).limit(5).toArray();
    console.log(allStuds);
    
    console.log("=== ALL CLASSES (limit 5) ===");
    const classes = await db.collection('classes').find({}).limit(5).toArray();
    console.log(classes);
    
    console.log("=== ALL SCHOOLS (limit 5) ===");
    const schools = await db.collection('schools').find({}).limit(5).toArray();
    console.log(schools);
    
  } finally {
    await client.close();
  }
}

inspect().catch(console.error);
