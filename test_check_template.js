const { findDynamicTemplateById } = require('./src/lib/practice/questionBank/dynamicTemplatesRepository.js');

async function main() {
  const template = await findDynamicTemplateById('template-addition-apple-counting');
  console.log('Full template:', JSON.stringify(template, null, 2));
}

main();
