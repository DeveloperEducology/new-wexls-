export function buildMCQInteraction(options = {}) {
  return {
    type: "mcq",
    version: 1,
    responseShape: "index", // index of the selected option
    validationMode: "exact",
    feedbackMode: "instant",
    retryPolicy: options.retryPolicy || { maxAttempts: 1 }
  };
}

export function buildFillBlankInteraction(blanks = {}, options = {}) {
  return {
    type: "fillInTheBlank",
    version: 1,
    responseShape: "object", // keys mapping to input strings
    validationMode: "exact",
    feedbackMode: "instant",
    retryPolicy: options.retryPolicy || { maxAttempts: 1 },
    blanks: blanks // e.g. { val: { type: "numeric" } }
  };
}

export function buildMatchingInteraction(pairs = [], options = {}) {
  return {
    type: "matching",
    version: 1,
    responseShape: "object", // left-side string mapping to right-side string
    validationMode: "exact",
    feedbackMode: "instant",
    retryPolicy: options.retryPolicy || { maxAttempts: 1 },
    pairsCount: pairs.length
  };
}

export function buildSortingInteraction(items = [], groups = [], options = {}) {
  return {
    type: "sorting",
    version: 1,
    responseShape: "object", // item ID mapping to group ID
    validationMode: "exact",
    feedbackMode: "instant",
    retryPolicy: options.retryPolicy || { maxAttempts: 1 },
    itemsCount: items.length,
    groupsCount: groups.length
  };
}

export function buildDragDropInteraction(items = [], targets = [], options = {}) {
  return {
    type: "dragDrop",
    version: 1,
    responseShape: "object", // item mapping to target locations/counts
    validationMode: "exact",
    feedbackMode: "instant",
    retryPolicy: options.retryPolicy || { maxAttempts: 1 }
  };
}
