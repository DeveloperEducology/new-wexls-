
import { generateSmartTimeQuestion } from './index.js';

const registry = {
  // Class I
  'v1_days_of_week': {
    params: { difficulty: 'easy', forcedTask: 'days_of_week' }
  },
  'v2_seasons': {
    params: { difficulty: 'easy', forcedTask: 'seasons' }
  },
  'v3_calendar': {
    params: { difficulty: 'easy', forcedTask: 'calendar' }
  },
  'v4_months': {
    params: { difficulty: 'easy', forcedTask: 'months_of_year' }
  },
  'v5_am_pm': {
    params: { difficulty: 'easy', forcedTask: 'am_pm' }
  },
  'order_days': {
    params: { difficulty: 'medium', forcedTask: 'order_days' }
  },
  'order_seasons': {
    params: { difficulty: 'medium', forcedTask: 'order_seasons' }
  },
  // Class II
  'm1_days_of_week': {
    params: { difficulty: 'medium', forcedTask: 'days_of_week' }
  },
  'm2_seasons': {
    params: { difficulty: 'medium', forcedTask: 'seasons' }
  },
  'm3_calendar': {
    params: { difficulty: 'medium', forcedTask: 'calendar' }
  },
  'm4_months': {
    params: { difficulty: 'medium', forcedTask: 'months_of_year' }
  },
  'm5_days_in_month': {
    params: { difficulty: 'medium', forcedTask: 'days_in_month' }
  },
  'm6_relate_time_units': {
    params: { difficulty: 'medium', forcedTask: 'time_units' }
  },
  'm7_am_pm': {
    params: { difficulty: 'medium', forcedTask: 'am_pm' }
  },
  // Class III
  'o1_analogue_clock': {
    params: { difficulty: 'easy', forcedTask: 'analogue_clock' }
  },
  'o2_digital_clock': {
    params: { difficulty: 'easy', forcedTask: 'digital_clock' }
  },
  'o3_read_clock': {
    params: { difficulty: 'easy', forcedTask: 'read_clock' }
  },
  'o4_am_pm': {
    params: { difficulty: 'medium', forcedTask: 'am_pm' }
  },
  'o5_elapsed_time': {
    params: { difficulty: 'easy', forcedTask: 'elapsed_time' }
  },
  'o7_time_patterns': {
    params: { difficulty: 'easy', forcedTask: 'time_patterns' }
  },
  'o8_match_digital_clock': {
    params: { difficulty: 'easy', forcedTask: 'match_digital_clock' }
  },
  'o9_match_analog_clock_words': {
    params: { difficulty: 'easy', forcedTask: 'match_analog_clock_words' }
  },
  'match_digital_clock': {
    params: { difficulty: 'easy', forcedTask: 'match_digital_clock' }
  },
  'match_analog_clock_words': {
    params: { difficulty: 'easy', forcedTask: 'match_analog_clock_words' }
  }
};

export const timeGenerator = (config) => {
  const logicType = config.logic_type || 'v1_days_of_week';
  const entry = registry[logicType] || registry['v1_days_of_week'];
  
  return generateSmartTimeQuestion({
    ...config,
    difficulty: entry.params.difficulty || config.difficulty,
    engineParams: {
      ...entry.params,
      ...(config.engineParams || {})
    }
  });
};

export const timeRegistry = {
  'v1_days_of_week': timeGenerator,
  'v2_seasons': timeGenerator,
  'v3_calendar': timeGenerator,
  'v4_months': timeGenerator,
  'v5_am_pm': timeGenerator,
  'order_days': timeGenerator,
  'order_seasons': timeGenerator,
  'm1_days_of_week': timeGenerator,
  'm2_seasons': timeGenerator,
  'm3_calendar': timeGenerator,
  'm4_months': timeGenerator,
  'm5_days_in_month': timeGenerator,
  'm6_relate_time_units': timeGenerator,
  'm7_am_pm': timeGenerator,
  'o1_analogue_clock': timeGenerator,
  'o2_digital_clock': timeGenerator,
  'match_analog_clock_words': timeGenerator,
  'match_digital_clock': timeGenerator,
  'o3_read_clock': timeGenerator,
  'o4_am_pm': timeGenerator,
  'o5_elapsed_time': timeGenerator,
  'o7_time_patterns': timeGenerator,
  'o8_match_digital_clock': timeGenerator,
  'o9_match_analog_clock_words': timeGenerator
};
