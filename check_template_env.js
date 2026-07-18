const { findDynamicTemplateById } = require('./src/lib/practice/questionBank/dynamicTemplatesRepository.js');

async function main() {
  const template = await findDynamicTemplateById('template-addition-apple-counting');
  console.log('Full template visuals config:');
  console.log('visuals:', JSON.stringify(template?.visuals, null, 2));
  console.log('visualComponent:', template?.visualComponent);
  console.log('visualProps:', template?.visualProps);
}

main();
