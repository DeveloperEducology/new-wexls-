export default function normalizeUniversalDndQuestion(question) {
  const layoutMode = question.layoutMode || 'category_sort';
  
  // Normalize items
  const rawItems = question.items || question.parts?.find(p => p.type === 'categorization' || p.type === 'categorizationv2')?.items || [];
  const items = rawItems.map((item, idx) => {
    if (typeof item === 'string') {
      return { id: `item_${idx}`, content: item };
    }
    return {
      id: item.id || `item_${idx}`,
      content: item.content || '',
      imageUrl: item.imageUrl || null,
      imageWidth: item.imageWidth || null,
      ...item
    };
  });

  // Normalize targets
  let targets = [];
  if (question.targets) {
    targets = question.targets.map((t, idx) => ({
      id: t.id || `target_${idx}`,
      label: t.label || '',
      kind: t.kind || 'default',
      accepts: t.accepts || ['*'],
      x: typeof t.x === 'number' ? t.x : 0,
      y: typeof t.y === 'number' ? t.y : 0,
      width: typeof t.width === 'number' ? t.width : 120,
      height: typeof t.height === 'number' ? t.height : 60,
      unit: t.unit || 'px',
      ...t
    }));
  } else {
    // If no targets, fallback to categories
    const rawCategories = question.categories || question.parts?.find(p => p.type === 'categorization' || p.type === 'categorizationv2')?.categories || [];
    targets = rawCategories.map((cat, idx) => {
      if (typeof cat === 'string') {
        return {
          id: cat,
          label: cat,
          kind: 'category',
          accepts: ['*'],
          x: 0,
          y: 0,
          width: 200,
          height: 150,
          unit: 'px'
        };
      }
      return {
        id: cat.id || `cat_${idx}`,
        label: cat.label || cat.name || '',
        kind: 'category',
        accepts: cat.accepts || ['*'],
        x: typeof cat.x === 'number' ? cat.x : 0,
        y: typeof cat.y === 'number' ? cat.y : 0,
        width: typeof cat.width === 'number' ? cat.width : 200,
        height: typeof cat.height === 'number' ? cat.height : 150,
        unit: cat.unit || 'px',
        ...cat
      };
    });
  }
  const hasExplicitOrderingTargets = layoutMode === 'ordering'
    && Array.isArray(question.targets)
    && question.targets.length >= items.length
    && question.targets.every(target => target.kind === 'order_slot' || target.order !== undefined);

  if (layoutMode === 'ordering' && !hasExplicitOrderingTargets) {
    targets = items.map((item, idx) => ({
      id: `slot_${idx + 1}`,
      label: String(idx + 1),
      kind: 'order_slot',
      accepts: [item.id],
      order: idx + 1,
      width: 96,
      height: 58,
      unit: 'px'
    }));
  }

  // Normalize behavior
  const behavior = {
    dragToDrop: true,
    clickToDrop: true,
    snapToTarget: true,
    validateOn: 'submit',
    reorderWithinTargets: layoutMode === 'ordering',
    multilinePlaceholder: false,
    ...question.behavior
  };

  // Normalize sourceTray
  const sourceTray = {
    position: 'bottom',
    scroll: 'horizontal',
    placeholderMode: 'fixed', // 'fixed' leaves an empty card slot, 'collapse' collapses slots
    ...question.sourceTray
  };

  // Normalize answer
  const answer = question.answer || {};

  return {
    ...question,
    layoutMode,
    items,
    targets,
    behavior,
    sourceTray,
    answer
  };
}
