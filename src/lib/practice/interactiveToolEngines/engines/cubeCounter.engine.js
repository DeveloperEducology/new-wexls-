const DEFAULT_CONFIG = {
  mode: 'build',
  target: 8,
  min: 0,
  max: 20,
  actions: ['add_cube', 'remove_cube', 'undo', 'reset'],
  cubeColor: 'blue',
  showLiveCount: true,
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function normalizeGroup(group, index) {
  return {
    id: group.id || `group_${index + 1}`,
    label: group.label || `Group ${index + 1}`,
    count: Math.max(0, Number(group.count) || 0),
    color: group.color || (index === 0 ? 'blue' : 'green'),
    editable: group.editable !== false,
  };
}

export function normalizeCubeCounterConfig(config = {}) {
  const normalized = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  normalized.min = Number.isFinite(Number(normalized.min)) ? Number(normalized.min) : DEFAULT_CONFIG.min;
  normalized.max = Number.isFinite(Number(normalized.max)) ? Number(normalized.max) : DEFAULT_CONFIG.max;
  normalized.target = Number.isFinite(Number(normalized.target)) ? Number(normalized.target) : DEFAULT_CONFIG.target;
  normalized.actions = Array.isArray(normalized.actions) && normalized.actions.length
    ? normalized.actions
    : DEFAULT_CONFIG.actions;

  if (Array.isArray(normalized.startGroups) && normalized.startGroups.length) {
    normalized.startGroups = normalized.startGroups.map(normalizeGroup);
  }

  return normalized;
}

export const cubeCounterEngine = {
  toolId: 'cube_counter',

  normalizeConfig: normalizeCubeCounterConfig,

  createInitialState(config = {}) {
    const safeConfig = normalizeCubeCounterConfig(config);
    const groups = Array.isArray(safeConfig.startGroups)
      ? safeConfig.startGroups.map((group) => ({ ...group }))
      : [
          {
            id: 'main',
            label: safeConfig.groupLabel || 'Cubes',
            count: clamp(safeConfig.initialCount ?? 0, safeConfig.min, safeConfig.max),
            color: safeConfig.cubeColor || 'blue',
            editable: true,
          },
        ];

    return {
      groups,
      history: [],
      lastAction: null,
    };
  },

  applyAction(state, action, config = {}) {
    const safeConfig = normalizeCubeCounterConfig(config);
    const type = typeof action === 'string' ? action : action?.type;
    const groupId = action?.groupId || safeConfig.editableGroupId || state.groups.find((group) => group.editable)?.id || 'main';
    const previous = {
      groups: state.groups.map((group) => ({ ...group })),
      lastAction: state.lastAction,
    };

    if (type === 'reset') {
      return this.createInitialState(safeConfig);
    }

    if (type === 'undo') {
      const lastSnapshot = state.history[state.history.length - 1];
      if (!lastSnapshot) return state;
      return {
        ...state,
        groups: lastSnapshot.groups.map((group) => ({ ...group })),
        history: state.history.slice(0, -1),
        lastAction: 'undo',
      };
    }

    const delta = type === 'add_cube' ? 1 : type === 'remove_cube' ? -1 : 0;
    if (!delta) return state;

    const groups = state.groups.map((group) => {
      if (group.id !== groupId || group.editable === false) return group;
      return {
        ...group,
        count: clamp(group.count + delta, safeConfig.min, safeConfig.max),
      };
    });

    return {
      ...state,
      groups,
      history: [...state.history, previous].slice(-30),
      lastAction: type,
    };
  },

  getAnswer(state) {
    const value = state.groups.reduce((sum, group) => sum + group.count, 0);
    const groups = Object.fromEntries(state.groups.map((group) => [group.id, group.count]));
    return { value, groups };
  },

  validate(userAnswer, expectedAnswer, validation = {}) {
    const expected = expectedAnswer?.value;
    const actual = userAnswer?.value ?? userAnswer?.answer?.value;
    const strategy = validation.strategy || 'exact_value';

    if (strategy !== 'exact_value') {
      return { isCorrect: false, reason: `Unsupported strategy: ${strategy}` };
    }

    return {
      isCorrect: Number(actual) === Number(expected),
      actual,
      expected,
    };
  },
};
