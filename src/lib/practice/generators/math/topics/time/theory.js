
/**
 * Time Theory and Data
 */

export const DAYS_OF_WEEK = [
    'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

export const MONTHS_OF_YEAR = [
    { name: 'January', days: 31 },
    { name: 'February', days: 28 },
    { name: 'March', days: 31 },
    { name: 'April', days: 30 },
    { name: 'May', days: 31 },
    { name: 'June', days: 30 },
    { name: 'July', days: 31 },
    { name: 'August', days: 31 },
    { name: 'September', days: 30 },
    { name: 'October', days: 31 },
    { name: 'November', days: 30 },
    { name: 'December', days: 31 }
];

export const SEASONS = [
    'Spring', 'Summer', 'Autumn', 'Winter'
];

export const TIME_UNITS = [
    { unit: 'minute', value: 60, relate: 'seconds' },
    { unit: 'hour', value: 60, relate: 'minutes' },
    { unit: 'day', value: 24, relate: 'hours' },
    { unit: 'week', value: 7, relate: 'days' },
    { unit: 'month', value: 4, relate: 'weeks', approximate: true },
    { unit: 'year', value: 12, relate: 'months' },
    { unit: 'year', value: 365, relate: 'days' }
];

export const getNextDay = (day) => {
    const index = DAYS_OF_WEEK.indexOf(day);
    return DAYS_OF_WEEK[(index + 1) % 7];
};

export const getPreviousDay = (day) => {
    const index = DAYS_OF_WEEK.indexOf(day);
    return DAYS_OF_WEEK[(index + 6) % 7];
};

export const getNextMonth = (month) => {
    const index = MONTHS_OF_YEAR.findIndex(m => m.name === month);
    return MONTHS_OF_YEAR[(index + 1) % 12].name;
};

export const getPreviousMonth = (month) => {
    const index = MONTHS_OF_YEAR.findIndex(m => m.name === month);
    return MONTHS_OF_YEAR[(index + 11) % 12].name;
};
