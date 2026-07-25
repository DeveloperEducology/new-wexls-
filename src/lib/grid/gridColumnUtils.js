/**
 * Shared Column Resolution Utility Module for Spreadsheet Editor & Grid Generators
 */

export function findAudioColumn(columns = []) {
  if (!Array.isArray(columns)) return undefined;
  return columns.find(c => {
    const lc = String(c || '').toLowerCase();
    return lc.endsWith('_audio') || lc === 'audio' || lc.includes('sound');
  });
}

export function findImageColumn(columns = []) {
  if (!Array.isArray(columns)) return undefined;
  return columns.find(c => {
    const lc = String(c || '').toLowerCase();
    return lc.includes('image') || lc.includes('clipart') || lc.includes('picture') || lc.endsWith('_img');
  });
}

export function findTextColumn(columns = []) {
  if (!Array.isArray(columns)) return undefined;
  const Candidates = [
    'target_phoneme', 'phoneme', 'target_word', 'correct_item', 
    'word', 'character_name', 'target_sound', 'text', 'prompt', 'label'
  ];
  const exact = columns.find(c => Candidates.includes(String(c || '').toLowerCase()));
  if (exact) return exact;
  return columns.find(c => {
    const lc = String(c || '').toLowerCase();
    return !lc.endsWith('_audio') && !lc.includes('image') && !lc.includes('clipart') && !lc.includes('distractor') && lc !== 'id' && lc !== 'level';
  }) || columns[0];
}

export function findPatternColumn(columns = []) {
  if (!Array.isArray(columns)) return undefined;
  return columns.find(c => String(c || '').toLowerCase().includes('pattern'));
}

export function findWordColumn(columns = []) {
  if (!Array.isArray(columns)) return undefined;
  return columns.find(c => {
    const lc = String(c || '').toLowerCase();
    return lc === 'word' || lc === 'text' || lc === 'target_word';
  });
}
