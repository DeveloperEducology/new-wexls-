const urlTopic = 'lkg';
const logicType = 'addition-g1-a1-horizontal-to-9';
const skillGrade = '1';

const isPreK = (() => {
  if (urlTopic === 'lkg' || urlTopic === 'prek' || urlTopic === 'ukg') return true;
  if (logicType && (logicType.includes('lkg') || logicType.includes('prek') || logicType.includes('ukg'))) return true;
  if (skillGrade && (skillGrade === 'lkg' || skillGrade === 'prek' || skillGrade === 'ukg')) return true;
  return false;
})();
console.log('isPreK:', isPreK);
