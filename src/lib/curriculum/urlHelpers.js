/**
 * Generates practice URLs for exam preparation drills.
 * e.g. /exam-prep/jnvst/practice/arithmetic?topic=NUMBER+AND+NUMERIC+SYSTEM&templateId=6a72ffb092ba514ede193dcf
 */
export function formatPracticeUrl({ examId = 'jnvst', section = 'arithmetic', topicId = null, skillId = null, userId = null }) {
  let url = `/exam-prep/${examId}/practice/${section || 'arithmetic'}`;
  const params = new URLSearchParams();

  if (topicId) {
    params.set('topic', topicId);
  }
  if (skillId) {
    params.set('templateId', skillId);
  }
  if (userId && userId !== 'guest_child') {
    params.set('userId', userId);
  }

  const queryStr = params.toString();
  if (queryStr) {
    url += `?${queryStr}`;
  }

  return url;
}
