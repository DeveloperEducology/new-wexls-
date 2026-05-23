export const lkgTemplateRegistry = {
  'lkg.shapes': { title: 'LKG Shapes' },
  'lkg.counting': { title: 'LKG Counting' },
  'lkg.comparing': { title: 'LKG Comparing' },
  'lkg.positions': { title: 'LKG Positions' },
  'lkg.classify': { title: 'LKG Classify' },
  'lkg.patterns': { title: 'LKG Patterns' },
  'lkg.size': { title: 'LKG Size' },
  'lkg.money': { title: 'LKG Money' }
};

export const lkgMicroSkillRegistry = {
  // Category A: Shapes (A.1 - A.6)
  'lkg-shapes-name-shape': { templateId: 'lkg.shapes', code: 'A.1', title: 'Name the shape', grade: 'LKG', params: { subType: 'name' } },
  'lkg-shapes-circles': { templateId: 'lkg.shapes', code: 'A.2', title: 'Circles', grade: 'LKG', params: { subType: 'circles', targetShape: 'circle' } },
  'lkg-shapes-squares': { templateId: 'lkg.shapes', code: 'A.3', title: 'Squares', grade: 'LKG', params: { subType: 'squares', targetShape: 'square' } },
  'lkg-shapes-triangles': { templateId: 'lkg.shapes', code: 'A.4', title: 'Triangles', grade: 'LKG', params: { subType: 'triangles', targetShape: 'triangle' } },
  'lkg-shapes-rectangles': { templateId: 'lkg.shapes', code: 'A.5', title: 'Rectangles', grade: 'LKG', params: { subType: 'rectangles', targetShape: 'rectangle' } },
  'lkg-shapes-mixed': { templateId: 'lkg.shapes', code: 'A.6', title: 'Circles, squares and triangles', grade: 'LKG', params: { subType: 'mixed' } },

  // Category B: Count to 3 (B.1 - B.7)
  'lkg-count3-learn': { templateId: 'lkg.counting', code: 'B.1', title: 'Learn to count - up to 3', grade: 'LKG', params: { subType: 'learn', limit: 3 } },
  'lkg-count3-objects': { templateId: 'lkg.counting', code: 'B.2', title: 'Count objects - up to 3', grade: 'LKG', params: { subType: 'objects', limit: 3 } },
  'lkg-count3-dots': { templateId: 'lkg.counting', code: 'B.3', title: 'Count dots - up to 3', grade: 'LKG', params: { subType: 'dots', limit: 3 } },
  'lkg-count3-shapes': { templateId: 'lkg.counting', code: 'B.4', title: 'Count shapes - up to 3', grade: 'LKG', params: { subType: 'shapes', limit: 3 } },
  'lkg-count3-ten-frames': { templateId: 'lkg.counting', code: 'B.5', title: 'Count on ten frames - up to 3', grade: 'LKG', params: { subType: 'ten_frames', limit: 3 } },
  'lkg-count3-show-ten-frames': { templateId: 'lkg.counting', code: 'B.6', title: 'Show numbers on ten frames - up to 3', grade: 'LKG', params: { subType: 'show_ten_frames', limit: 3 } },
  'lkg-count3-represent': { templateId: 'lkg.counting', code: 'B.7', title: 'Represent numbers - up to 3', grade: 'LKG', params: { subType: 'represent', limit: 3 } },

  // Category C: Count to 5 (C.1 - C.7)
  'lkg-count5-learn': { templateId: 'lkg.counting', code: 'C.1', title: 'Learn to count - up to 5', grade: 'LKG', params: { subType: 'learn', limit: 5 } },
  'lkg-count5-objects': { templateId: 'lkg.counting', code: 'C.2', title: 'Count objects - up to 5', grade: 'LKG', params: { subType: 'objects', limit: 5 } },
  'lkg-count5-dots': { templateId: 'lkg.counting', code: 'C.3', title: 'Count dots - up to 5', grade: 'LKG', params: { subType: 'dots', limit: 5 } },
  'lkg-count5-shapes': { templateId: 'lkg.counting', code: 'C.4', title: 'Count shapes - up to 5', grade: 'LKG', params: { subType: 'shapes', limit: 5 } },
  'lkg-count5-ten-frames': { templateId: 'lkg.counting', code: 'C.5', title: 'Count on ten frames - up to 5', grade: 'LKG', params: { subType: 'ten_frames', limit: 5 } },
  'lkg-count5-show-ten-frames': { templateId: 'lkg.counting', code: 'C.6', title: 'Show numbers on ten frames - up to 5', grade: 'LKG', params: { subType: 'show_ten_frames', limit: 5 } },
  'lkg-count5-represent': { templateId: 'lkg.counting', code: 'C.7', title: 'Represent numbers - up to 5', grade: 'LKG', params: { subType: 'represent', limit: 5 } },

  // Category D: Count to 10 (D.1 - D.7)
  'lkg-count10-learn': { templateId: 'lkg.counting', code: 'D.1', title: 'Learn to count - up to 10', grade: 'LKG', params: { subType: 'learn', limit: 10 } },
  'lkg-count10-objects': { templateId: 'lkg.counting', code: 'D.2', title: 'Count objects - up to 10', grade: 'LKG', params: { subType: 'objects', limit: 10 } },
  'lkg-count10-dots': { templateId: 'lkg.counting', code: 'D.3', title: 'Count dots - up to 10', grade: 'LKG', params: { subType: 'dots', limit: 10 } },
  'lkg-count10-shapes': { templateId: 'lkg.counting', code: 'D.4', title: 'Count shapes - up to 10', grade: 'LKG', params: { subType: 'shapes', limit: 10 } },
  'lkg-count10-ten-frames': { templateId: 'lkg.counting', code: 'D.5', title: 'Count on ten frames - up to 10', grade: 'LKG', params: { subType: 'ten_frames', limit: 10 } },
  'lkg-count10-show-ten-frames': { templateId: 'lkg.counting', code: 'D.6', title: 'Show numbers on ten frames - up to 10', grade: 'LKG', params: { subType: 'show_ten_frames', limit: 10 } },
  'lkg-count10-represent': { templateId: 'lkg.counting', code: 'D.7', title: 'Represent numbers - up to 10', grade: 'LKG', params: { subType: 'represent', limit: 10 } },

  // Category E: Comparing (E.1 - E.5)
  'lkg-compare-enough': { templateId: 'lkg.comparing', code: 'E.1', title: 'Are there enough?', grade: 'LKG', params: { subType: 'enough' } },
  'lkg-compare-more': { templateId: 'lkg.comparing', code: 'E.2', title: 'More', grade: 'LKG', params: { subType: 'more' } },
  'lkg-compare-fewer': { templateId: 'lkg.comparing', code: 'E.3', title: 'Fewer', grade: 'LKG', params: { subType: 'fewer' } },
  'lkg-compare-counting': { templateId: 'lkg.comparing', code: 'E.4', title: 'Fewer and more - compare by counting', grade: 'LKG', params: { subType: 'counting' } },
  'lkg-compare-mixed': { templateId: 'lkg.comparing', code: 'E.5', title: 'Compare in a mixed group', grade: 'LKG', params: { subType: 'mixed' } },

  // Category F: Positions (F.0 demo + F.1 - F.7)
  'lkg-position-interactive-demo': { templateId: 'lkg.positions', code: 'F.0', title: 'Interactive SVG Demo (left/right with real animals)', grade: 'LKG', params: { subType: 'interactive_demo' } },
  'lkg-position-inside-outside': { templateId: 'lkg.positions', code: 'F.1', title: 'Inside and outside', grade: 'LKG', params: { subType: 'inside_outside' } },
  'lkg-position-above-below': { templateId: 'lkg.positions', code: 'F.2', title: 'Above and below', grade: 'LKG', params: { subType: 'above_below' } },
  'lkg-position-beside-next': { templateId: 'lkg.positions', code: 'F.3', title: 'Beside and next to', grade: 'LKG', params: { subType: 'beside_next' } },
  'lkg-position-left-right': { templateId: 'lkg.positions', code: 'F.4', title: 'Left and right', grade: 'LKG', params: { subType: 'left_right' } },
  'lkg-position-left-middle-right': { templateId: 'lkg.positions', code: 'F.5', title: 'Left, middle and right', grade: 'LKG', params: { subType: 'left_middle_right' } },
  'lkg-position-top-bottom': { templateId: 'lkg.positions', code: 'F.6', title: 'Top and bottom', grade: 'LKG', params: { subType: 'top_bottom' } },
  'lkg-position-top-middle-bottom': { templateId: 'lkg.positions', code: 'F.7', title: 'Top, middle and bottom', grade: 'LKG', params: { subType: 'top_middle_bottom' } },

  // Category G: Classify (G.1 - G.6)
  'lkg-classify-same': { templateId: 'lkg.classify', code: 'G.1', title: 'Same', grade: 'LKG', params: { subType: 'same' } },
  'lkg-classify-different': { templateId: 'lkg.classify', code: 'G.2', title: 'Different', grade: 'LKG', params: { subType: 'different' } },
  'lkg-classify-same-different': { templateId: 'lkg.classify', code: 'G.3', title: 'Same and different', grade: 'LKG', params: { subType: 'same_different' } },
  'lkg-classify-shapes-color': { templateId: 'lkg.classify', code: 'G.4', title: 'Classify shapes by colour', grade: 'LKG', params: { subType: 'shapes_color' } },
  'lkg-classify-sort-color': { templateId: 'lkg.classify', code: 'G.5', title: 'Classify and sort by colour', grade: 'LKG', params: { subType: 'sort_color' } },
  'lkg-classify-sort-shape': { templateId: 'lkg.classify', code: 'G.6', title: 'Classify and sort by shape', grade: 'LKG', params: { subType: 'sort_shape' } },

  // Category H: Patterns (H.1 - H.4)
  'lkg-patterns-color': { templateId: 'lkg.patterns', code: 'H.1', title: 'Colour patterns', grade: 'LKG', params: { subType: 'color' } },
  'lkg-patterns-size': { templateId: 'lkg.patterns', code: 'H.2', title: 'Size patterns', grade: 'LKG', params: { subType: 'size' } },
  'lkg-patterns-shape': { templateId: 'lkg.patterns', code: 'H.3', title: 'Shape patterns', grade: 'LKG', params: { subType: 'shape' } },
  'lkg-patterns-next': { templateId: 'lkg.patterns', code: 'H.4', title: 'What comes next?', grade: 'LKG', params: { subType: 'next' } },

  // Category I: Size (I.1 - I.4)
  'lkg-size-long-short': { templateId: 'lkg.size', code: 'I.1', title: 'Long and short', grade: 'LKG', params: { subType: 'long_short' } },
  'lkg-size-tall-short': { templateId: 'lkg.size', code: 'I.2', title: 'Tall and short', grade: 'LKG', params: { subType: 'tall_short' } },
  'lkg-size-wide-narrow': { templateId: 'lkg.size', code: 'I.3', title: 'Wide and narrow', grade: 'LKG', params: { subType: 'wide_narrow' } },
  'lkg-size-light-heavy': { templateId: 'lkg.size', code: 'I.4', title: 'Light and heavy', grade: 'LKG', params: { subType: 'light_heavy' } },

  // Category J: Money (J.1 - J.2)
  'lkg-money-coin-values': { templateId: 'lkg.money', code: 'J.1', title: 'Coin values', grade: 'LKG', params: { subType: 'coin_values' } },
  'lkg-money-count-coins': { templateId: 'lkg.money', code: 'J.2', title: 'Count 1-rupee coins', grade: 'LKG', params: { subType: 'count_coins' } },

  // Legacy compatibility mapping
  'lkg_counting_5': { templateId: 'lkg.counting', code: 'C.1', title: 'Learn to count - up to 5', grade: 'LKG', params: { subType: 'learn', limit: 5 } },
  'lkg_comparison_5': { templateId: 'lkg.counting', code: 'D.1', title: 'Learn to count - up to 10', grade: 'LKG', params: { subType: 'learn', limit: 10 } }
};

export function getTemplatesForSkill(skillId) {
  const skill = lkgMicroSkillRegistry[skillId];
  return skill ? [skill.templateId] : [];
}

export function getSkillByTemplate(templateId) {
  const entry = Object.entries(lkgMicroSkillRegistry).find(
    ([_, s]) => s.templateId === templateId
  );
  return entry ? entry[0] : null;
}