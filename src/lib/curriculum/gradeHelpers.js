import { getCurriculumTree } from './index.js';

export function normalizeTopicId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function flattenTree(nodes = []) {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);
}

export function collectSkillNodes(node) {
  if (!node) return [];
  return [
    ...(node.type === 'skill' ? [node] : []),
    ...(node.children || []).flatMap((child) => collectSkillNodes(child)),
  ];
}

export function dbSkillTuple(skill, index) {
  return [
    skill.code || skill.metadata?.code || `S.${index + 1}`,
    skill.title || skill.name || skill.skillId || skill.id,
    skill.skillId || skill.id,
  ];
}

export function gradeOrdinal(grade) {
  const g = String(grade).toLowerCase().trim();
  if (g === 'remediation') return 'Remediation skills';
  if (g === 'prek' || g === 'pre-k') return 'Pre-K skills';
  if (g === 'lkg') return 'LKG skills';
  if (g === 'ukg') return 'UKG skills';
  if (/^\d+$/.test(grade)) {
    return `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`;
  }
  return `${grade} skills`;
}

export function groupTitleForNode(node) {
  if (node.type === 'chapter') {
    const rawTitle = node.title || 'Skills';
    return rawTitle.replace(/\s*\([a-z0-9-]+\)$/i, '');
  }

  const grade = node.grade ?? node.metadata?.grade;
  if (grade === 'remediation') return 'Remediation skills';
  if (grade) return gradeOrdinal(String(grade));

  return 'Skills';
}

export function buildGroupsFromDbTopic(topicNode) {
  const children = topicNode.children || [];
  const chapterGroups = children
    .filter((child) => child.type === 'chapter')
    .map((chapter) => ({
      id: chapter.id,
      title: groupTitleForNode(chapter),
      grade: chapter.grade || topicNode.grade || '',
      skills: collectSkillNodes(chapter).map(dbSkillTuple),
    }))
    .filter((group) => group.skills.length);

  const directSkills = children.filter((child) => child.type === 'skill');
  if (directSkills.length) {
    chapterGroups.unshift({
      id: `${topicNode.id}-direct-skills`,
      title: 'Skills',
      grade: topicNode.grade || '',
      skills: directSkills.map(dbSkillTuple),
    });
  }

  if (chapterGroups.length) return chapterGroups;

  const allSkills = collectSkillNodes(topicNode);
  return allSkills.length ? [{ title: 'Skills', grade: topicNode.grade || '', skills: allSkills.map(dbSkillTuple) }] : [];
}

const DB_TOPIC_COLORS = ['#ff951f', '#2fbfd0', '#7a56d6', '#4db46b', '#3f8bd6', '#d64d3d', '#9b4fe8', '#0ea5e9', '#ea580c', '#059669'];

export function includesFromTopic(topicNode, groups) {
  const metadataIncludes = topicNode.metadata?.includes;
  if (Array.isArray(metadataIncludes) && metadataIncludes.length) return metadataIncludes;

  const tags = Array.isArray(topicNode.tags) ? topicNode.tags : [];
  if (tags.length) return tags.slice(0, 5);

  return groups.flatMap((group) => group.skills.map(([, name]) => name)).slice(0, 5);
}

export function dbTopicFromNode(node, index) {
  const groups = buildGroupsFromDbTopic(node);
  const id = normalizeTopicId(node.id);

  let rawSubject = node.subjectId || node.metadata?.subject || 'math';
  let subject = rawSubject.toLowerCase().trim();
  if (subject.includes('math')) {
    subject = 'math';
  } else if (subject.includes('english')) {
    subject = 'english';
  } else if (subject.includes('science')) {
    subject = 'science';
  } else if (subject.includes('social') || subject.includes('gk')) {
    subject = 'social';
  }

  return {
    id,
    title: node.title || node.name || id,
    color: node.metadata?.color || DB_TOPIC_COLORS[index % DB_TOPIC_COLORS.length],
    subject,
    topic: node.topicId || id,
    includes: includesFromTopic(node, groups),
    groups,
    source: 'db',
  };
}

export function topicsFromCurriculum(data) {
  return flattenTree(data?.tree || [])
    .filter((node) => node.type === 'topic')
    .map(dbTopicFromNode);
}

export function mergeTopics(staticTopics, dbTopics) {
  if (!dbTopics.length) return staticTopics;

  const merged = new Map(staticTopics.map((topic) => [topic.id, { ...topic, groups: topic.groups?.map(g => ({ ...g, skills: [...g.skills] })) || [] }]));
  
  dbTopics.forEach((dbTopic) => {
    const existing = merged.get(dbTopic.id);
    if (!existing) {
      merged.set(dbTopic.id, dbTopic);
      return;
    }

    const mergedGroupsMap = new Map();
    // 1. Load existing static groups
    (existing.groups || []).forEach(g => {
      mergedGroupsMap.set(g.title.toLowerCase().trim(), {
        title: g.title,
        skills: [...g.skills]
      });
    });

    // 2. Merge database groups
    (dbTopic.groups || []).forEach(dbGroup => {
      const key = dbGroup.title.toLowerCase().trim();
      const existingGrp = mergedGroupsMap.get(key);
      if (existingGrp) {
        // Append unique skills only
        const seenSkillIds = new Set(existingGrp.skills.map(([, , id]) => id));
        dbGroup.skills.forEach(skillTuple => {
          if (!seenSkillIds.has(skillTuple[2])) {
            existingGrp.skills.push(skillTuple);
          }
        });
      } else {
        mergedGroupsMap.set(key, {
          title: dbGroup.title,
          skills: [...dbGroup.skills]
        });
      }
    });

    merged.set(dbTopic.id, {
      ...existing,
      color: dbTopic.color || existing.color || '#ff951f',
      includes: [...new Set([...(existing.includes || []), ...(dbTopic.includes || [])])],
      groups: Array.from(mergedGroupsMap.values()),
    });
  });

  return Array.from(merged.values());
}

export async function loadDbTopics() {
  try {
    const curriculum = await getCurriculumTree({ status: 'active', limit: 1000 });
    return topicsFromCurriculum(curriculum);
  } catch (error) {
    console.warn('Home curriculum fallback:', error?.message || error);
    return [];
  }
}

export function countSkills(topic) {
  return (topic.groups || []).reduce((total, group) => total + (group.skills?.length || 0), 0);
}

export function practiceHref(topic, skill) {
  return `/practice?subject=${topic.subject || 'math'}&topic=${topic.topic || topic.id}&skill=${skill}`;
}

export function getStandardizedGrade(title, topicId, gradeVal) {
  const rawGrade = String(gradeVal || '').trim();
  if (rawGrade) {
    const lower = rawGrade.toLowerCase();
    if (lower === 'lkg' || lower === 'lower kindergarten') return 'LKG';
    if (lower === 'ukg' || lower === 'upper kindergarten') return 'UKG';
    if (lower === 'prek' || lower === 'pre-k') return 'Pre-K';
    if (lower === 'remediation') return 'Remediation';
    if (/^grade\s*\d+$/i.test(lower)) {
      const num = lower.replace(/\D/g, '');
      return `Grade ${num}`;
    }
    if (/^\d+$/.test(lower)) {
      return `Grade ${lower}`;
    }
    
    // For custom grades like "LKG-New" or "lkg new", clean and format it nicely
    return rawGrade
      .split(/[\s-_]+/)
      .map(word => {
        const lw = word.toLowerCase();
        if (lw === 'lkg') return 'LKG';
        if (lw === 'ukg') return 'UKG';
        if (lw === 'new') return 'New';
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('-');
  }

  const t = title.toLowerCase();
  const id = (topicId || '').toLowerCase();
  
  if (id === 'lkg' || id.includes('lkg') || t.includes('lkg') || t.includes('lower kindergarten')) return 'LKG';
  if (id === 'ukg' || id.includes('ukg') || t.includes('ukg') || t.includes('upper kindergarten')) return 'UKG';
  
  if (t.includes('remediation')) return 'Remediation';
  if (t.includes('pre-k') || t.includes('prek') || id === 'prek') return 'Pre-K';
  if (t.includes('first') || t.includes('1st')) return 'Grade 1';
  if (t.includes('second') || t.includes('2nd')) return 'Grade 2';
  if (t.includes('third') || t.includes('3rd')) return 'Grade 3';
  if (t.includes('fourth') || t.includes('4th')) return 'Grade 4';
  if (t.includes('fifth') || t.includes('5th')) return 'Grade 5';
  if (t.includes('sixth') || t.includes('6th')) return 'Grade 6';
  if (t.includes('seventh') || t.includes('7th')) return 'Grade 7';
  if (t.includes('eighth') || t.includes('8th')) return 'Grade 8';
  return 'General Skills';
}

export function buildGradeCurriculum(topics, activeSubject) {
  const subjectTopics = topics.filter(t => (t.subject || 'math') === activeSubject);
  const gradeMap = new Map();

  subjectTopics.forEach(topic => {
    (topic.groups || []).forEach(group => {
      const standardizedGrade = getStandardizedGrade(group.title, topic.id, group.grade);
      
      if (!gradeMap.has(standardizedGrade)) {
        gradeMap.set(standardizedGrade, new Map()); // Use a Map to group by topic inside the grade
      }
      
      if (group.skills && group.skills.length > 0) {
        const topicsInGrade = gradeMap.get(standardizedGrade);
        
        if (!topicsInGrade.has(topic.id)) {
          topicsInGrade.set(topic.id, {
            id: topic.id,
            title: topic.title,
            color: topic.color,
            subject: topic.subject,
            topic: topic.topic,
            skills: []
          });
        }
        
        // Merge the skills into this topic block
        topicsInGrade.get(topic.id).skills.push(...group.skills);
      }
    });
  });

  // Convert the inner Maps back to Arrays and deduplicate skills
  const formattedGrades = Array.from(gradeMap.entries()).map(([grade, topicsMap]) => {
    const topicsList = Array.from(topicsMap.values()).map(topic => {
      const seen = new Set();
      const uniqueSkills = topic.skills.filter(s => {
        const skillId = s[2];
        if (seen.has(skillId)) return false;
        seen.add(skillId);
        return true;
      });
      return {
        ...topic,
        skills: uniqueSkills
      };
    });
    return [grade, topicsList];
  });

  // Sort grades logically
  const gradeOrder = ['Pre-K', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7', 'Grade 8', 'Remediation', 'General Skills'];
  
  const getSortIndex = (gradeName) => {
    const idx = gradeOrder.indexOf(gradeName);
    if (idx !== -1) return idx;
    
    // Check if it starts with one of the standard order keys (e.g., LKG)
    for (let i = 0; i < gradeOrder.length; i++) {
      const std = gradeOrder[i];
      if (gradeName.toLowerCase().startsWith(std.toLowerCase())) {
        return i + 0.5; // Sort right after the standard one
      }
    }
    return 999;
  };

  const sortedGrades = formattedGrades.sort((a, b) => {
    const aIndex = getSortIndex(a[0]);
    const bIndex = getSortIndex(b[0]);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return a[0].localeCompare(b[0]);
  });

  return sortedGrades;
}
