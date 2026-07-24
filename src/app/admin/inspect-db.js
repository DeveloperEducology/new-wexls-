const fs = require('fs');
const path = require('path');

// Manually load env files
function loadEnv(file) {
  const p = path.resolve(__dirname, '../../../', file);
  if (fs.existsSync(p)) {
    const content = fs.readFileSync(p, 'utf8');
    content.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = val;
        }
      }
    });
  }
}
loadEnv('.env.local');
loadEnv('.env');

const { getMongoDb } = require('../../lib/db/mongo');

async function main() {
  try {
    const db = await getMongoDb();
    if (!db) {
      console.log('Could not connect to database');
      return;
    }
    
    console.log('--- checking skills_v2 ---');
    const skill1 = await db.collection('skills_v2').findOne({ id: 'class3-english-cause-effect' });
    console.log('class3-english-cause-effect skill:', skill1);
    const skill2 = await db.collection('skills_v2').findOne({ id: 'class3-english-effect-cause' });
    console.log('class3-english-effect-cause skill:', skill2);

    console.log('--- checking dynamic_templates ---');
    const templates = await db.collection('dynamic_templates').find({ id: { $in: ['class3-english-cause-effect', 'class3-english-effect-cause'] } }).toArray();
    console.log('Templates found:', templates);

    console.log('--- checking vocabulary_pools ---');
    const pools = await db.collection('vocabulary_pools').find({ poolId: { $in: ['cause-effect-matching', 'effect-cause-matching'] } }).toArray();
    console.log('Vocabulary Pools found:', pools);

    console.log('--- checking all pools in db ---');
    const allPools = await db.collection('vocabulary_pools').find({}).limit(5).toArray();
    console.log('Sample pools:', allPools);

    console.log('--- checking all dynamic templates in db ---');
    const allTpls = await db.collection('dynamic_templates').find({}).limit(10).toArray();
    console.log('Sample templates:', allTpls.map(t => ({ id: t.id, title: t.title, poolId: t.poolId })));

  } catch (err) {
    console.error(err);
  }
}

main().then(() => process.exit(0));
