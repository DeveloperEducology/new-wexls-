const { listAllDynamicTemplates } = require('./src/lib/practice/questionBank/dynamicTemplatesRepository.js');

async function main() {
  const all = await listAllDynamicTemplates();
  console.log('Total templates:', all.length);
  for (const t of all) {
    if (t.id.includes('place') || t.id.includes('block') || t.id.includes('tens-ones') || (t.title && t.title.toLowerCase().includes('place value'))) {
      console.log(`- ID: ${t.id}, Title: ${t.title}`);
    }
  }
}

main();
