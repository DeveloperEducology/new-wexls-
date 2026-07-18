const { listAllDynamicTemplates } = require('./src/lib/practice/questionBank/dynamicTemplatesRepository.js');

async function main() {
  const templates = await listAllDynamicTemplates();
  console.log(`Total templates retrieved: ${templates.length}`);
  
  const lkgUkgTemplates = templates.filter(t => {
    const grade = String(t.grade || t.templateInfo?.grade || '').toLowerCase();
    return grade === 'lkg' || grade === 'ukg' || t.id.includes('lkg') || t.id.includes('ukg');
  });

  console.log(`LKG/UKG Templates found: ${lkgUkgTemplates.length}\n`);

  lkgUkgTemplates.forEach(t => {
    console.log(`- ID: ${t.id}`);
    console.log(`  Title: ${t.title || t.templateInfo?.title}`);
    console.log(`  Grade: ${t.grade || t.templateInfo?.grade}`);
    console.log(`  Topic: ${t.topic || t.templateInfo?.topic}`);
    console.log(`  Type: ${t.type || t.optionsType || 'mcq'}`);
    if (t.visuals && t.visuals.length > 0) {
      console.log(`  Visuals: ${JSON.stringify(t.visuals.map(v => ({ component: v.component, props: v.props })), null, 2)}`);
    } else {
      console.log(`  Visuals: None`);
    }
    console.log('---');
  });
}

main();
