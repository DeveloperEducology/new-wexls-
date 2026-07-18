const { listAllDynamicTemplates } = require('./src/lib/practice/questionBank/dynamicTemplatesRepository.js');

async function main() {
  const templates = await listAllDynamicTemplates();
  console.log('Total templates found:', templates.length);
  templates.forEach(t => {
    console.log(`- ${t.id}: ${t.title}`);
  });
}

main();
