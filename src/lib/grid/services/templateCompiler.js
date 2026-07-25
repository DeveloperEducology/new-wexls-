/**
 * Template Export & JSON Compilation Service Module
 */

export function buildCompiledTemplateJson({
  title,
  subject,
  topic,
  grade,
  targetCollection,
  selectedExamId,
  jnvstSection,
  jnvstTopic,
  jnvstDifficulty,
  customTemplateId,
  columns,
  rows,
  blueprint,
  solution,
  optionsBinding,
  questionMode,
  customPartsText,
  imageHasAudio,
  imageIsTransparent
}) {
  const imageCol = columns.find(c => c.toLowerCase().includes('image') || c.toLowerCase().includes('clipart'));
  const audioCol = columns.find(c => c.toLowerCase().includes('audio') || c.toLowerCase().includes('sound'));
  const wordCol = columns.find(c => c.toLowerCase() === 'word' || c.toLowerCase() === 'text');

  let compiledParts = [];
  if (customPartsText && customPartsText.trim() !== '') {
    try {
      compiledParts = JSON.parse(customPartsText);
      if (!Array.isArray(compiledParts)) compiledParts = [];
    } catch (e) {
      console.warn('Custom parts JSON parse failed:', e);
    }
  }

  if (compiledParts.length === 0) {
    if (audioCol && !imageHasAudio) {
      compiledParts.push({
        type: 'audio',
        content: `[${audioCol}]`,
        label: wordCol ? `[${wordCol}]` : ''
      });
    }
    if (blueprint) {
      compiledParts.push({
        type: 'text',
        content: blueprint.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, '[$1]')
      });
    }
    if (imageCol) {
      const imgPart = {
        type: 'image',
        content: `[${imageCol}]`,
        label: wordCol ? `[${wordCol}]` : ''
      };
      if (imageIsTransparent) imgPart.transparent = true;
      if (imageHasAudio && audioCol) {
        imgPart.playLabelSound = true;
        imgPart.audioUrl = `[${audioCol}]`;
      }
      compiledParts.push(imgPart);
    }
  }

  const templateDoc = {
    templateId: customTemplateId || `grid_template_${Date.now()}`,
    title: title || 'Untitled Grid Template',
    subject: subject || 'English',
    topic: topic || 'General',
    grade: grade || 'UKG',
    targetCollection: targetCollection || 'questions_v2',
    questionMode: questionMode || 'mcq',
    columns,
    parts: compiledParts,
    optionsBinding,
    rows: rows.map(r => {
      const { _level, ...cleanRow } = r;
      return { level: _level || 'l1', data: cleanRow };
    }),
    createdAt: new Date().toISOString()
  };

  if (selectedExamId) {
    templateDoc.examId = selectedExamId;
    templateDoc.jnvstSection = jnvstSection;
    templateDoc.jnvstTopic = jnvstTopic;
    templateDoc.jnvstDifficulty = jnvstDifficulty;
  }

  return templateDoc;
}
