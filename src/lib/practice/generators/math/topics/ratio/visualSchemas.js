export function buildObjectCountVisual(items, options = {}) {
  return {
    type: "object_count",
    version: 1,
    layout: options.layout || "grid", // e.g. "grid", "row"
    title: options.title || "Visual Object Groups",
    items: items.map(item => ({
      id: item.id || String(Math.random()),
      type: item.type || "symbol", // symbol, shape, path
      value: item.value || "🍎", // symbol representation or emoji
      color: item.color || "#000000",
      count: item.count || 1,
      label: item.label || ""
    })),
    labels: options.labels || [],
    metadata: options.metadata || {}
  };
}

export function buildRatioBarVisual(parts, options = {}) {
  return {
    type: "ratio_bar",
    version: 1,
    layout: options.layout || "horizontal", // horizontal, vertical
    title: options.title || "Ratio Bar Model",
    items: parts.map(part => ({
      id: part.id || String(Math.random()),
      label: part.label || "",
      value: part.value || 1, // weight of the bar block
      color: part.color || "#3b82f6",
      stroke: part.stroke || "#1d4ed8"
    })),
    labels: options.labels || [],
    metadata: options.metadata || {}
  };
}

export function buildRatioTableVisual(rows, options = {}) {
  return {
    type: "ratio_table",
    version: 1,
    layout: options.layout || "table",
    title: options.title || "Ratio Table Model",
    items: rows.map(row => ({
      id: row.id || String(Math.random()),
      values: Array.isArray(row.values) ? row.values : [],
      label: row.label || ""
    })),
    labels: options.labels || [], // table headers
    metadata: options.metadata || {}
  };
}

export function buildNumberLineVisual(values, options = {}) {
  return {
    type: "double_number_line",
    version: 1,
    layout: options.layout || "double",
    title: options.title || "Double Number Line Model",
    items: values.map(val => ({
      id: val.id || String(Math.random()),
      ticks: Array.isArray(val.ticks) ? val.ticks : [],
      label: val.label || ""
    })),
    labels: options.labels || [],
    metadata: options.metadata || {}
  };
}
