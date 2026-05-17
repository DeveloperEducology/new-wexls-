
import { DAYS_OF_WEEK, MONTHS_OF_YEAR, SEASONS, TIME_UNITS, getNextDay, getPreviousDay, getNextMonth, getPreviousMonth } from '../theory.js';

/**
 * Seeded Random Utility
 */
class SeededRandom {
    constructor(seed) {
        this.seed = typeof seed === 'number' ? seed : parseInt(seed) || Date.now();
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }
    pick(arr) {
        return arr[this.int(0, arr.length - 1)];
    }
    shuffle(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
}

/**
 * Time Engine
 */
export const generateTimeQuestion = (config = {}) => {
    const seed = config.variables?.seed || Date.now().toString();
    const rng = new SeededRandom(seed);
    const difficulty = config.difficulty || 'easy';
    const engineParams = config.engineParams || {};
    const forcedTask = engineParams.forcedTask || null;

    const allTasks = {
        'days_of_week': (rng) => generateDaysOfWeekQuestion(rng, difficulty),
        'months_of_year': (rng) => generateMonthsOfYearQuestion(rng, difficulty),
        'seasons': (rng) => generateSeasonsQuestion(rng, difficulty),
        'am_pm': (rng) => generateAmPmQuestion(rng, difficulty),
        'calendar': (rng) => generateCalendarQuestion(rng, difficulty),
        'days_in_month': (rng) => generateDaysInMonthQuestion(rng, difficulty),
        'time_units': (rng) => generateTimeUnitsQuestion(rng, difficulty),
        'order_days': (rng) => generateOrderDaysQuestion(rng, difficulty),
        'order_seasons': (rng) => generateOrderSeasonsQuestion(rng, difficulty),
        'analogue_clock': (rng) => generateAnalogueClockQuestion(rng, difficulty),
        'digital_clock': (rng) => generateDigitalClockQuestion(rng, difficulty),
        'read_clock': (rng) => generateReadClockQuestion(rng, difficulty),
        'elapsed_time': (rng) => generateElapsedTimeQuestion(rng, difficulty),
        'time_patterns': (rng) => generateTimePatternsQuestion(rng, difficulty),
        'match_digital_clock': (rng) => generateMatchDigitalClockQuestion(rng, difficulty),
        'match_analog_clock_words': (rng) => generateMatchAnalogClockWordsQuestion(rng, difficulty),
    };

    if (forcedTask && allTasks[forcedTask]) {
        return allTasks[forcedTask](rng);
    }

    // Default distribution based on difficulty
    const tasks = difficulty === 'easy' 
        ? ['days_of_week', 'months_of_year', 'seasons', 'am_pm']
        : ['days_of_week', 'months_of_year', 'seasons', 'am_pm', 'calendar', 'days_in_month', 'time_units'];
    
    const task = rng.pick(tasks);
    return allTasks[task](rng);
};

const generateDaysOfWeekQuestion = (rng, difficulty) => {
    const type = rng.pick(['after', 'before', 'between']);
    const day = rng.pick(DAYS_OF_WEEK);
    
    if (type === 'after') {
        const answer = getNextDay(day);
        return {
            type: 'mcq',
            level: difficulty,
            questionText: `Which day comes after **${day}**?`,
            options: rng.shuffle([answer, ...rng.shuffle(DAYS_OF_WEEK.filter(d => d !== answer)).slice(0, 5)]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(answer) },
            explanation: {
                sections: [
                    { content: `The days of the week are: ${DAYS_OF_WEEK.join(', ')}.` },
                    { content: `The day that follows **${day}** is **${answer}**.` }
                ]
            },
            metadata: { day, type, answer, task: 'days_of_week' }
        };
    } else if (type === 'before') {
        const answer = getPreviousDay(day);
        return {
            type: 'mcq',
            level: difficulty,
            questionText: `Which day comes before **${day}**?`,
            options: rng.shuffle([answer, ...rng.shuffle(DAYS_OF_WEEK.filter(d => d !== answer)).slice(0, 5)]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(answer) },
            explanation: {
                sections: [
                    { content: `Looking at the weekly cycle, the day right before **${day}** is **${answer}**.` }
                ]
            },
            metadata: { day, type, answer, task: 'days_of_week' }
        };
    } else {
        const prev = getPreviousDay(day);
        const next = getNextDay(day);
        return {
            type: 'mcq',
            level: difficulty,
            questionText: `Which day comes between **${prev}** and **${next}**?`,
            options: rng.shuffle([day, ...rng.shuffle(DAYS_OF_WEEK.filter(d => d !== day)).slice(0, 5)]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(day) },
            explanation: {
                sections: [
                    { content: `The sequence is ${prev}, **${day}**, ${next}.` }
                ]
            },
            metadata: { day, type, answer: day, task: 'days_of_week' }
        };
    }
};

const generateMonthsOfYearQuestion = (rng, difficulty) => {
    const type = rng.pick(['after', 'before']);
    const month = rng.pick(MONTHS_OF_YEAR).name;
    
    if (type === 'after') {
        const answer = getNextMonth(month);
        return {
            type: 'mcq',
            level: difficulty,
            questionText: `Which month comes after **${month}**?`,
            options: rng.shuffle([answer, ...rng.shuffle(MONTHS_OF_YEAR.map(m => m.name).filter(m => m !== answer)).slice(0, 3)]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(answer) },
            explanation: {
                sections: [
                    { content: `The month that follows **${month}** is **${answer}**.` }
                ]
            },
            metadata: { month, type, answer, task: 'months_of_year' }
        };
    } else {
        const answer = getPreviousMonth(month);
        return {
            type: 'mcq',
            level: difficulty,
            questionText: `Which month comes before **${month}**?`,
            options: rng.shuffle([answer, ...rng.shuffle(MONTHS_OF_YEAR.map(m => m.name).filter(m => m !== answer)).slice(0, 3)]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(answer) },
            explanation: {
                sections: [
                    { content: `The month before **${month}** is **${answer}**.` }
                ]
            },
            metadata: { month, type, answer, task: 'months_of_year' }
        };
    }
};

const generateSeasonsQuestion = (rng, difficulty) => {
    const questions = [
        { q: "In which season do we usually see flowers bloom?", a: "Spring" },
        { q: "Which season is the hottest?", a: "Summer" },
        { q: "In which season do leaves fall from trees?", a: "Autumn" },
        { q: "Which season is the coldest?", a: "Winter" },
        { q: "In which season do we wear heavy coats and gloves?", a: "Winter" },
        { q: "In which season do we go to the beach to cool off?", a: "Summer" }
    ];
    const item = rng.pick(questions);
    
    return {
        type: 'mcq',
        level: difficulty,
        questionText: item.q,
        options: rng.shuffle(SEASONS),
        correctAnswerIndex: -1,
        get correctAnswerIndex() { return this.options.indexOf(item.a) },
        explanation: {
            sections: [
                { content: `**${item.a}** is the season described in the question.` }
            ]
        },
        metadata: { question: item.q, answer: item.a, task: 'seasons' }
    };
};

const generateAmPmQuestion = (rng, difficulty) => {
    const scenarios = [
        { name: "Lauren", event: "swimming on a hot afternoon", time: "2:00", period: "P.M.", type: "afternoon" },
        { name: "David", event: "eating breakfast before school", time: "7:30", period: "A.M.", type: "morning" },
        { name: "Sarah", event: "looking at the stars at night", time: "9:00", period: "P.M.", type: "night" },
        { name: "Tom", event: "waking up as the sun rises", time: "6:00", period: "A.M.", type: "morning" },
        { name: "Maya", event: "eating lunch with friends", time: "12:30", period: "P.M.", type: "afternoon" },
        { name: "Ben", event: "doing homework after school", time: "4:30", period: "P.M.", type: "afternoon" },
        { name: "Leo", event: "sleeping in the middle of the night", time: "3:00", period: "A.M.", type: "night" },
        { name: "Amy", event: "going to soccer practice in the morning", time: "10:30", period: "A.M.", type: "morning" }
    ];
    const scenario = rng.pick(scenarios);
    
    // For Class II/III (difficulty >= medium), use a visual clock
    const useVisual = difficulty !== 'easy';
    const clockType = rng.pick(['digital', 'analogue']);
    let clockPart = null;

    if (useVisual) {
        const [h, m] = scenario.time.split(':').map(Number);
        // Use night mode for night types, or just random
        const isNight = scenario.type === 'night';
        const svg = clockType === 'digital' 
            ? generateDigitalClockSvg(scenario.time, isNight)
            : generateClockSvg(h, m, scenario.type === 'afternoon' ? 'pink' : 'green');
        clockPart = { type: 'svg', content: svg };
    }

    const questionText = useVisual 
        ? `${scenario.name} is ${scenario.event}. The clock shows:`
        : `Would **${scenario.event}** happen in the **A.M.** or **P.M.**?`;

    return {
        type: 'mcq',
        level: difficulty,
        questionText,
        parts: clockPart ? [clockPart, { type: 'text', content: 'What time is it?' }] : [],
        options: [`${scenario.time} A.M.`, `${scenario.time} P.M.`],
        correctAnswerIndex: scenario.period === 'A.M.' ? 0 : 1,
        explanation: {
            sections: [
                { content: `**A.M.** is for morning times (midnight to noon).` },
                { content: `**P.M.** is for afternoon and evening times (noon to midnight).` },
                { content: `Since ${scenario.name} is ${scenario.event}, it must be **${scenario.period}**.` }
            ]
        },
        metadata: { ...scenario, task: 'am_pm' }
    };
};

const generateDaysInMonthQuestion = (rng, difficulty) => {
    const monthObj = rng.pick(MONTHS_OF_YEAR);
    const answer = monthObj.days.toString();
    
    return {
        type: 'mcq',
        level: difficulty,
        questionText: `How many days are in the month of **${monthObj.name}**?`,
        options: rng.shuffle(['28', '30', '31']),
        correctAnswerIndex: -1,
        get correctAnswerIndex() { return this.options.indexOf(answer) },
        explanation: {
            sections: [
                { content: `**${monthObj.name}** has **${answer}** days.` },
                { content: `Tip: You can use the knuckle rule or a rhyme to remember the days in each month.` }
            ]
        },
        metadata: { month: monthObj.name, days: monthObj.days, task: 'days_in_month' }
    };
};

const generateTimeUnitsQuestion = (rng, difficulty) => {
    const unit = rng.pick(TIME_UNITS.filter(u => !u.approximate));
    
    return {
        type: 'fillInTheBlank',
        level: difficulty,
        questionText: `How many **${unit.relate}** are in 1 **${unit.unit}**? [blank:ans]`,
        correctAnswer: unit.value.toString(),
        explanation: {
            sections: [
                { content: `There are **${unit.value} ${unit.relate}** in one **${unit.unit}**.` }
            ]
        },
        metadata: { unit: unit.unit, value: unit.value, relate: unit.relate, task: 'time_units' }
    };
};


/**
 * Calendar SVG Generator
 */
const generateCalendarSvg = (monthName, year, calendar) => {
    const width = 450;
    const height = 360;
    const padding = 20;
    const headerHeight = 60;
    const cellWidth = (width - padding * 2) / 7;
    const cellHeight = (height - headerHeight - padding * 2) / 6; // Up to 6 weeks

    const headerY = padding + 25;
    const daysY = padding + 65;
    const gridStartY = padding + 85;

    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 450px; height: auto;">`;
    
    // Background card
    svg += `<rect x="5" y="5" width="${width-10}" height="${height-10}" rx="24" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />`;
    
    // Subtle inner shadow/gradient effect
    svg += `<rect x="5" y="5" width="${width-10}" height="${headerHeight}" rx="24" fill="#f8fafc" />`;
    svg += `<rect x="5" y="${headerHeight-15}" width="${width-10}" height="15" fill="#f8fafc" />`;
    
    // Month & Year Title
    svg += `<text x="${width/2}" y="${headerY}" text-anchor="middle" font-family="Outfit, sans-serif" font-size="22" font-weight="900" fill="#1e293b">${monthName} ${year}</text>`;
    
    // Day Headers
    const dayHeaders = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    dayHeaders.forEach((day, i) => {
        const x = padding + i * cellWidth + cellWidth / 2;
        svg += `<text x="${x}" y="${daysY}" text-anchor="middle" font-family="Outfit, sans-serif" font-size="13" font-weight="800" fill="#94a3b8" text-transform="uppercase" letter-spacing="0.05em">${day}</text>`;
    });

    // Separator
    svg += `<line x1="${padding}" y1="${daysY + 12}" x2="${width - padding}" y2="${daysY + 12}" stroke="#f1f5f9" stroke-width="2" stroke-linecap="round" />`;

    // Days
    calendar.forEach((week, rowIndex) => {
        week.forEach((day, colIndex) => {
            if (day) {
                const x = padding + colIndex * cellWidth + cellWidth / 2;
                const y = gridStartY + rowIndex * cellHeight + cellHeight / 2 + 5;
                svg += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Outfit, sans-serif" font-size="16" font-weight="700" fill="#334155">${day}</text>`;
            }
        });
    });

    svg += `</svg>`;
    return svg;
};

const generateCalendarQuestion = (rng, difficulty) => {
    // Basic calendar generation
    const monthIdx = rng.int(0, 11);
    const month = MONTHS_OF_YEAR[monthIdx];
    const year = 2024; // Use a fixed year for predictable starting day or calculate
    const firstDayOfMonth = new Date(year, monthIdx, 1).getDay(); // 0 = Sunday
    
    const calendar = [];
    let day = 1;
    for (let i = 0; i < 6; i++) {
        const week = [];
        for (let j = 0; j < 7; j++) {
            if (i === 0 && j < firstDayOfMonth) {
                week.push('');
            } else if (day > month.days) {
                week.push('');
            } else {
                week.push(day++);
            }
        }
        calendar.push(week);
        if (day > month.days) break;
    }

    const svg = generateCalendarSvg(month.name, year, calendar);

    const targetDay = rng.int(1, month.days);
    const targetDate = new Date(year, monthIdx, targetDay);
    const dayName = DAYS_OF_WEEK[targetDate.getDay()];

    const questionTypes = ['what_day', 'what_date'];
    const qType = rng.pick(questionTypes);

    if (qType === 'what_day') {
        return {
            type: 'mcq',
            level: difficulty,
            questionText: `Looking at the calendar, what day of the week is **${month.name} ${targetDay}**?`,
            parts: [{ type: 'svg', content: svg }],
            options: DAYS_OF_WEEK,
            correctAnswerIndex: targetDate.getDay(),
            explanation: {
                sections: [
                    { content: `Find **${targetDay}** on the calendar.` },
                    { content: `Look at the top of the column. It is under **${dayName}**.` }
                ]
            },
            metadata: { month: month.name, targetDay, dayName, task: 'calendar' }
        };
    } else {
        const randomDayName = rng.pick(DAYS_OF_WEEK);
        // Find all dates with this day name
        const datesWithDayName = [];
        for (let d = 1; d <= month.days; d++) {
            if (DAYS_OF_WEEK[new Date(year, monthIdx, d).getDay()] === randomDayName) {
                datesWithDayName.push(d);
            }
        }
        const targetDatePick = rng.pick(datesWithDayName);
        const occurrence = datesWithDayName.indexOf(targetDatePick) + 1;
        const ordinal = ['first', 'second', 'third', 'fourth', 'fifth'][occurrence - 1];

        return {
            type: 'mcq',
            level: difficulty,
            questionText: `What is the date of the **${ordinal} ${randomDayName}** of ${month.name}?`,
            parts: [{ type: 'svg', content: svg }],
            options: rng.shuffle([targetDatePick.toString(), ...rng.shuffle(Array.from({length: month.days}, (_, i) => (i + 1).toString()).filter(d => d !== targetDatePick.toString())).slice(0, 3)]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(targetDatePick.toString()) },
            explanation: {
                sections: [
                    { content: `Find the column for **${randomDayName}**.` },
                    { content: `Count down to the **${ordinal}** number in that column.` },
                    { content: `The date is **${targetDatePick}**.` }
                ]
            },
            metadata: { month: month.name, randomDayName, targetDatePick, ordinal, task: 'calendar' }
        };
    }
};

const generateOrderDaysQuestion = (rng, difficulty) => {
    const startIdx = rng.int(0, 6);
    const count = 3;
    const sequence = [];
    for (let i = 0; i < count; i++) {
        sequence.push(DAYS_OF_WEEK[(startIdx + i) % 7]);
    }
    const shuffled = rng.shuffle(sequence);
    
    return {
        type: 'fillInTheBlank',
        level: difficulty,
        questionText: `Put these days in the correct order, starting with **${sequence[0]}**.`,
        parts: [
            { type: 'text', content: `Days: ${shuffled.join(', ')}` },
            { type: 'text', content: `1. ${sequence[0]}` },
            { type: 'text', content: `2. [blank:day2]` },
            { type: 'text', content: `3. [blank:day3]` }
        ],
        correctAnswer: {
            day2: sequence[1],
            day3: sequence[2]
        },
        explanation: {
            sections: [
                { content: `The correct order starting from **${sequence[0]}** is: ${sequence.join(', ')}.` }
            ]
        },
        metadata: { sequence, task: 'order_days' }
    };
};

const generateOrderSeasonsQuestion = (rng, difficulty) => {
    const startIdx = rng.int(0, 3);
    const sequence = [];
    for (let i = 0; i < 4; i++) {
        sequence.push(SEASONS[(startIdx + i) % 4]);
    }
    const shuffled = rng.shuffle(sequence);

    return {
        type: 'fillInTheBlank',
        level: difficulty,
        questionText: `Put the seasons in the correct order, starting with **${sequence[0]}**.`,
        parts: [
            { type: 'text', content: `Seasons: ${shuffled.join(', ')}` },
            { type: 'text', content: `1. ${sequence[0]}` },
            { type: 'text', content: `2. [blank:s2]` },
            { type: 'text', content: `3. [blank:s3]` },
            { type: 'text', content: `4. [blank:s4]` }
        ],
        correctAnswer: {
            s2: sequence[1],
            s3: sequence[2],
            s4: sequence[3]
        },
        explanation: {
            sections: [
                { content: `The seasons follow a cycle: **${sequence.join(' → ')}**.` }
            ]
        },
        metadata: { sequence, task: 'order_seasons' }
    };
};

/**
 * Analogue Clock SVG Generator
 */
const generateClockSvg = (hours, minutes, theme = 'green', framed = false) => {
    const size = 300;
    const center = size / 2;
    const radius = size / 2 - 20;

    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="max-width: 300px; height: auto;">`;
    
    const ringColor = theme === 'pink' ? "#fbcfe8" : (theme === 'blue' ? "#bbdefb" : (theme === 'black' ? "#1e293b" : "#8bc34a"));
    const frameColor = theme === 'pink' ? "#f472b6" : (theme === 'blue' ? "#2196f3" : (theme === 'black' ? "#000000" : "#27ae60"));
    const accentColor = theme === 'pink' ? "#f472b6" : (theme === 'blue' ? "#1e3a8a" : (theme === 'black' ? "#94a3b8" : "#1e293b"));

    if (framed) {
        svg += `<rect x="5" y="5" width="${size-10}" height="${size-10}" rx="20" fill="${frameColor}" />`;
    }

    // Outer ring (premium style)
    svg += `<circle cx="${center}" cy="${center}" r="${radius + 10}" fill="${ringColor}" />`; 
    svg += `<circle cx="${center}" cy="${center}" r="${radius}" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" />`;
    
    // Tick marks
    for (let i = 0; i < 60; i++) {
        const angle = (i * 6) * Math.PI / 180;
        const x1 = center + (radius - 8) * Math.sin(angle);
        const y1 = center - (radius - 8) * Math.cos(angle);
        const x2 = center + radius * Math.sin(angle);
        const y2 = center - radius * Math.cos(angle);
        const isMajor = i % 5 === 0;
        
        if (theme === 'black') {
            // Dots for minutes in classic theme
            if (isMajor) {
                svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000" stroke-width="2.5" stroke-linecap="round" />`;
            } else {
                const dotX = center + (radius - 4) * Math.sin(angle);
                const dotY = center - (radius - 4) * Math.cos(angle);
                svg += `<circle cx="${dotX}" cy="${dotY}" r="1.5" fill="#94a3b8" />`;
            }
        } else {
            svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${isMajor ? '#1e293b' : '#94a3b8'}" stroke-width="${isMajor ? 2 : 1}" />`;
        }
    }

    // Numbers
    for (let i = 1; i <= 12; i++) {
        const angle = (i * 30) * Math.PI / 180;
        const x = center + (radius - 35) * Math.sin(angle);
        const y = center - (radius - 35) * Math.cos(angle) + 8;
        svg += `<text x="${x}" y="${y}" text-anchor="middle" font-family="Outfit, sans-serif" font-size="26" font-weight="900" fill="#1e293b">${i}</text>`;
    }

    // Hands
    const minuteAngle = (minutes * 6) * Math.PI / 180;
    const hourAngle = (hours * 30 + minutes * 0.5) * Math.PI / 180;

    // Hour hand
    const hx = center + (radius - 80) * Math.sin(hourAngle);
    const hy = center - (radius - 80) * Math.cos(hourAngle);
    svg += `<line x1="${center}" y1="${center}" x2="${hx}" y2="${hy}" stroke="#1e293b" stroke-width="10" stroke-linecap="round" />`;

    // Minute hand
    const mx = center + (radius - 40) * Math.sin(minuteAngle);
    const my = center - (radius - 40) * Math.cos(minuteAngle);
    svg += `<line x1="${center}" y1="${center}" x2="${mx}" y2="${my}" stroke="#1e293b" stroke-width="6" stroke-linecap="round" />`;

    // Center pin
    svg += `<circle cx="${center}" cy="${center}" r="8" fill="${accentColor}" />`;
    svg += `<circle cx="${center}" cy="${center}" r="3" fill="#ffffff" />`;

    svg += `</svg>`;
    return svg;
};

/**
 * Converts inline SVG to Data URL for use in Konva-based labs
 */
const svgToDataUrl = (svg) => {
    try {
        if (typeof btoa === 'function') {
            return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
        } else {
            return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
        }
    } catch (e) {
        return "";
    }
};

const generateAnalogueClockQuestion = (rng, difficulty) => {
    // Difficulty determines minute intervals
    let minuteStep = 60; // On the hour
    if (difficulty === 'medium') minuteStep = 15; // 15 min intervals
    if (difficulty === 'hard') minuteStep = 5; // 5 min intervals

    const hours = rng.int(1, 12);
    const minutes = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
    const timeString = `${hours}:${minutes === 0 ? '00' : (minutes < 10 ? '0' + minutes : minutes)}`;

    // If easy/medium, mostly MCQ as per screenshot
    const type = difficulty === 'hard' ? rng.pick(['tell_time', 'match_clock']) : 'tell_time';

    if (type === 'tell_time') {
        const svg = generateClockSvg(hours, minutes);
        // Distractors
        const distractors = [];
        while (distractors.length < 3) {
            const h = rng.int(1, 12);
            const m = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
            const t = `${h}:${m === 0 ? '00' : (m < 10 ? '0' + m : m)}`;
            if (t !== timeString && !distractors.includes(t)) {
                distractors.push(t);
            }
        }

        return {
            type: 'mcq',
            level: difficulty,
            questionText: "What time does the clock show?",
            parts: [{ type: 'svg', content: svg }],
            options: rng.shuffle([timeString, ...distractors]),
            correctAnswerIndex: -1,
            get correctAnswerIndex() { return this.options.indexOf(timeString) },
            explanation: {
                sections: [
                    { content: `The short hand is the **hour hand**. It points to **${hours}**.` },
                    { content: `The long hand is the **minute hand**. It points to **${minutes === 0 ? '12 (which means 00 minutes)' : minutes + ' minutes'}**.` },
                    { content: `So, the time is **${timeString}**.` }
                ]
            },
            metadata: { hours, minutes, timeString, task: 'analogue_clock' }
        };
    } else {
        // Matching Question
        const pairs = [];
        const usedTimes = new Set();
        while (pairs.length < 3) {
            const h = rng.int(1, 12);
            const m = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
            const t = `${h}:${m === 0 ? '00' : (m < 10 ? '0' + m : m)}`;
            if (!usedTimes.has(t)) {
                usedTimes.add(t);
                const svg = generateClockSvg(h, m);
                pairs.push({
                    id: `p${pairs.length}`,
                    left: { imageUrl: svgToDataUrl(svg) },
                    right: { content: t }
                });
            }
        }

        return {
            type: 'matching',
            level: difficulty,
            questionText: "Match the analogue clocks with their digital times.",
            pairs,
            explanation: {
                sections: [
                    { content: "Look at the position of the hour and minute hands on each clock to find the matching digital time." }
                ]
            },
            metadata: { task: 'analogue_clock_match' }
        };
    }
};

const generateMatchAnalogClockWordsQuestion = (rng, difficulty) => {
    const hourWords = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
    
    // Always to the hour for this specific template
    const hours = rng.int(1, 12);
    const minutes = 0;
    const hWord = hourWords[hours % 12];
    const timeInWords = `${hWord} o'clock`;

    const svg = generateClockSvg(hours, minutes, 'black');

    // Distractors
    const distractors = [];
    while (distractors.length < 3) {
        const h = rng.int(1, 12);
        if (h !== hours && !distractors.includes(h)) {
            distractors.push(h);
        }
    }

    const options = rng.shuffle([
        { text: timeInWords, isCorrect: true },
        ...distractors.map(h => ({ text: `${hourWords[h % 12]} o'clock`, isCorrect: false }))
    ]);

    return {
        type: 'mcq',
        level: difficulty,
        questionText: "What time does the clock show?",
        parts: [
            { type: 'text', content: "What time does the clock show?", hasAudio: true },
            { type: 'svg', content: svg }
        ],
        options: options.map(opt => opt.text),
        correctAnswerIndex: options.findIndex(opt => opt.isCorrect),
        explanation: {
            sections: [
                { content: `The short hand (hour hand) is at **${hours}**.` },
                { content: `The long hand (minute hand) is at **12**, which means it's exactly on the hour.` },
                { content: `So, the time is **${timeInWords}**.` }
            ]
        },
        metadata: { hours, minutes, timeInWords, task: 'match_analog_clock_words' }
    };
};

/**
 * Digital Clock SVG Generator
 */
const generateDigitalClockSvg = (timeString, isNight = false, theme = 'pink') => {
    const width = 200;
    const height = 120;
    
    let svg = `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; height: auto;">`;
    
    const colors = {
        'green': { body: '#dcfce7', border: '#22c55e', text: '#14532d' },
        'blue': { body: '#dbeafe', border: '#3b82f6', text: '#1e3a8a' },
        'pink': { body: '#fdf2f8', border: '#f472b6', text: '#831843' },
        'red': { body: '#fee2e2', border: '#ef4444', text: '#7f1d1d' }
    };
    const color = colors[theme] || colors.pink;
    const screenBg = isNight ? "#1f2937" : "#f1f5f9";
    const textColor = isNight ? "#ffffff" : "#1e293b";

    // Outer frame/border (The pink part in screenshot)
    svg += `<rect x="5" y="5" width="${width-10}" height="${height-20}" rx="12" fill="${color.border}" />`;
    
    // Inner screen background (Light grey)
    svg += `<rect x="15" y="15" width="${width-30}" height="${height-40}" rx="8" fill="${screenBg}" />`;
    
    // Colon (:)
    svg += `<circle cx="${width/2}" cy="${height/2 - 15}" r="3" fill="${textColor}" />`;
    svg += `<circle cx="${width/2}" cy="${height/2 - 5}" r="3" fill="${textColor}" />`;

    // Digital Time Text (Segmented look using font-family)
    svg += `<text x="${width/2}" y="${height/2 + 5}" text-anchor="middle" font-family="monospace, Courier, sans-serif" font-size="44" font-weight="900" fill="${textColor}" letter-spacing="2">${timeString}</text>`;
    
    // Feet (The black bars at bottom)
    svg += `<rect x="40" y="${height-15}" width="20" height="5" rx="2" fill="#000" />`;
    svg += `<rect x="${width-60}" y="${height-15}" width="20" height="5" rx="2" fill="#000" />`;
    
    svg += `</svg>`;
    return svg;
};

const generateMatchDigitalClockQuestion = (rng, difficulty) => {
    const hourWords = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
    
    let minuteStep = 60; // o'clock
    if (difficulty === 'medium') minuteStep = 15;
    if (difficulty === 'hard') minuteStep = 5;

    const hours = rng.int(1, 12);
    const minutes = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
    const timeString = `${hours}:${minutes === 0 ? '00' : (minutes < 10 ? '0' + minutes : minutes)}`;
    
    const hWord = hourWords[hours % 12];
    let timeInWords = "";
    if (minutes === 0) timeInWords = `${hWord} o'clock`;
    else if (minutes === 15) timeInWords = `quarter past ${hWord}`;
    else if (minutes === 30) timeInWords = `half past ${hWord}`;
    else if (minutes === 45) timeInWords = `quarter to ${hourWords[(hours + 1) % 12]}`;
    else timeInWords = `${hWord} ${minutes}`;

    const correctSvg = generateDigitalClockSvg(timeString, false, 'pink');

    // Distractors
    const distractors = [];
    while (distractors.length < 2) {
        const h = rng.int(1, 12);
        const m = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
        const t = `${h}:${m === 0 ? '00' : (m < 10 ? '0' + m : m)}`;
        if (t !== timeString && !distractors.some(d => d.time === t)) {
            distractors.push({ time: t, svg: generateDigitalClockSvg(t, false, 'pink') });
        }
    }

    const options = rng.shuffle([
        { time: timeString, svg: correctSvg, isCorrect: true },
        ...distractors.map(d => ({ ...d, isCorrect: false }))
    ]);

    return {
        type: 'mcq',
        level: difficulty,
        questionText: `Which clock shows **${timeInWords}**?`,
        parts: [
            { type: 'text', content: `Which clock shows **${timeInWords}**?`, hasAudio: true }
        ],
        options: options.map(opt => opt.svg),
        correctAnswerIndex: options.findIndex(opt => opt.isCorrect),
        explanation: {
            sections: [
                { content: `**${timeInWords}** is written as **${timeString}** on a digital clock.` },
                { content: `The clock with **${timeString}** is the correct one.` }
            ]
        },
        metadata: { timeString, timeInWords, task: 'match_digital_clock' }
    };
};

const generateDigitalClockQuestion = (rng, difficulty) => {
    const hourWords = ["twelve", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven"];
    
    let minuteStep = 60; // o'clock
    if (difficulty === 'medium') minuteStep = 15;
    if (difficulty === 'hard') minuteStep = 5;

    const hours = rng.int(1, 12);
    const minutes = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
    const timeString = `${hours}:${minutes === 0 ? '00' : (minutes < 10 ? '0' + minutes : minutes)}`;
    
    const isNight = rng.next() > 0.5; // Randomly choose day/night
    const theme = rng.pick(['green', 'blue', 'pink', 'red']);

    let timeInWords = "";
    const hWord = hourWords[hours % 12];
    if (minutes === 0) timeInWords = `${hWord} o'clock`;
    else if (minutes === 15) timeInWords = `quarter past ${hWord}`;
    else if (minutes === 30) timeInWords = `half past ${hWord}`;
    else if (minutes === 45) timeInWords = `quarter to ${hourWords[(hours + 1) % 12]}`;
    else timeInWords = `${hWord} ${minutes}`;

    const svg = generateDigitalClockSvg(timeString, isNight, theme);

    // Distractors
    const distractors = [];
    while (distractors.length < 2) {
        const h = rng.int(1, 12);
        const m = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
        const t = `${h}:${m === 0 ? '00' : (m < 10 ? '0' + m : m)}`;
        if (t !== timeString && !distractors.some(d => d.time === t)) {
            distractors.push({ time: t, svg: generateDigitalClockSvg(t, isNight, theme) });
        }
    }

    const options = rng.shuffle([
        { time: timeString, svg: svg, isCorrect: true },
        ...distractors.map(d => ({ ...d, isCorrect: false }))
    ]);

    return {
        type: 'mcq',
        level: difficulty,
        questionText: `Which clock shows **${timeInWords}**?`,
        options: options.map(opt => opt.svg),
        correctAnswerIndex: options.findIndex(opt => opt.isCorrect),
        explanation: {
            sections: [
                { content: `**${timeInWords}** corresponds to the digital time **${timeString}**.` },
                { content: `The correct clock displays **${timeString}** on its screen.` }
            ]
        },
        metadata: { timeString, timeInWords, isNight, task: 'digital_clock' }
    };
};

const generateReadClockQuestion = (rng, difficulty) => {
    let minuteStep = 60;
    if (difficulty === 'medium') minuteStep = 15;
    if (difficulty === 'hard') minuteStep = 5;

    const hours = rng.int(1, 12);
    const minutes = rng.int(0, (60 / minuteStep) - 1) * minuteStep;
    const theme = rng.pick(['green', 'pink']);
    const svg = generateClockSvg(hours, minutes, theme);

    if (minutes === 0) {
        return {
            type: 'fillInTheBlank',
            level: difficulty,
            questionText: "What time does the clock show? **[blank:hour] : 00**",
            parts: [{ type: 'svg', content: svg }],
            correctAnswer: { hour: String(hours) },
            explanation: {
                sections: [
                    { content: `The minute hand points to **12**, so it is exactly **${hours} o'clock**.` }
                ]
            },
            metadata: { hours, minutes, task: 'read_clock' }
        };
    } else {
        const mStr = minutes < 10 ? '0' + minutes : minutes.toString();
        return {
            type: 'fillInTheBlank',
            level: difficulty,
            questionText: `What time does the clock show? **[blank:hour] : [blank:minute]**`,
            parts: [{ type: 'svg', content: svg }],
            correctAnswer: { hour: String(hours), minute: mStr },
            explanation: {
                sections: [
                    { content: `The hour hand is at **${hours}** and the minute hand points to **${minutes}**.` }
                ]
            },
            metadata: { hours, minutes, task: 'read_clock' }
        };
    }
};

const generateElapsedTimeQuestion = (rng, difficulty) => {
    // Determine the step (hours or minutes)
    const type = rng.pick(['hours', 'minutes']);
    let amount = 0;
    
    if (type === 'hours') {
        amount = rng.int(1, 6);
    } else {
        // Minutes usually in 15 or 30 min intervals for easy/medium
        amount = rng.pick([15, 30, 45]);
        if (difficulty === 'hard') amount = rng.int(1, 11) * 5;
    }

    const startH = rng.int(1, 12);
    const startM = rng.pick([0, 15, 30, 45]);
    const startStr = `${startH}:${startM === 0 ? '00' : startM}`;
    const svg = generateClockSvg(startH, startM);

    // Calculate end time
    let endH = startH;
    let endM = startM;

    if (type === 'hours') {
        endH = ((startH + amount - 1) % 12) + 1;
    } else {
        endM = startM + amount;
        if (endM >= 60) {
            endH = ((startH + Math.floor(endM / 60) - 1) % 12) + 1;
            endM = endM % 60;
        }
    }

    const endStr = `${endH}:${endM < 10 ? '0' + endM : endM}`;
    const amountStr = type === 'hours' 
        ? (amount === 1 ? 'one hour' : (amount === 2 ? 'two hours' : (amount === 3 ? 'three hours' : (amount === 4 ? 'four hours' : (amount === 5 ? 'five hours' : amount + ' hours')))))
        : `${amount} minutes`;

    return {
        type: 'fillInTheBlank',
        level: difficulty,
        questionText: `Look at this clock: What time will it be in **${amountStr}**? Write your answer using numbers and a colon (for example, 11:58). [blank:ans]`,
        parts: [{ type: 'svg', content: svg }],
        correctAnswer: { ans: endStr },
        explanation: {
            sections: [
                { content: `The clock currently shows **${startStr}**.` },
                { content: `Adding **${amountStr}** to the current time gives **${endStr}**.` },
                { content: `Tip: You can count around the clock face to find the new time.` }
            ]
        },
        metadata: { startH, startM, amount, type, endStr, task: 'elapsed_time' }
    };
};

const generateTimePatternsQuestion = (rng, difficulty) => {
    const direction = rng.pick(['forward', 'backward']);
    const step = difficulty === 'hard' ? rng.pick([60, 30, 15, 10, 5]) : rng.pick([60, 30, 15]);
    
    // Choose start time carefully to avoid negative hours/minutes in backward
    const startH = direction === 'forward' ? rng.int(1, 6) : rng.int(7, 12);
    const startM = rng.pick([0, 15, 30, 45]);
    
    const sequence = [];
    let currentH = startH;
    let currentM = startM;

    for (let i = 0; i < 5; i++) {
        const tStr = `${currentH}:${currentM === 0 ? '00' : (currentM < 10 ? '0' + currentM : currentM)}`;
        sequence.push({ h: currentH, m: currentM, str: tStr });
        
        if (direction === 'forward') {
            currentM += step;
            if (currentM >= 60) {
                currentH = (currentH % 12) + 1;
                currentM = currentM % 60;
            }
        } else {
            currentM -= step;
            if (currentM < 0) {
                currentH = (currentH - 2 + 12) % 12 + 1;
                currentM = 60 + currentM;
            }
        }
    }

    const mode = rng.pick(['digital', 'analogue', 'numbers']);
    const theme = mode === 'digital' ? rng.pick(['blue', 'green', 'pink', 'red']) : rng.pick(['blue', 'green', 'pink']);
    const missingIdx = rng.int(0, 4); // Randomize where the gap is

    if (mode === 'numbers') {
        const parts = [];
        const correctAnswer = {};
        
        sequence.forEach((s, idx) => {
            if (idx === missingIdx) {
                parts.push({ type: 'text', content: `[blank:ans]` });
                correctAnswer.ans = s.str;
            } else {
                parts.push({ type: 'text', content: s.str });
            }
            if (idx < 4) parts.push({ type: 'text', content: ', ' });
        });

        return {
            type: 'fillInTheBlank',
            level: difficulty,
            questionText: "Fill in the missing time to complete the pattern.",
            parts: [
                { 
                    type: 'row', 
                    style: { fontSize: '1.5rem', fontWeight: '800', gap: '0.25rem' },
                    parts 
                }
            ],
            correctAnswer,
            explanation: {
                sections: [
                    { content: `The pattern shows times that are **${step} minutes** ${direction === 'forward' ? 'apart (moving forward)' : 'apart (moving backward)'}.` },
                    { content: `Looking at the sequence, the missing time is **${sequence[missingIdx].str}**.` }
                ]
            },
            metadata: { step, missingIdx, task: 'time_patterns_numbers' }
        };
    }

    const svgs = sequence.map(s => 
        mode === 'digital' 
            ? generateDigitalClockSvg(s.str, false, theme)
            : generateClockSvg(s.h, s.m, theme, true)
    );
    
    const answerStr = sequence[missingIdx].str;
    const answerSvg = svgs[missingIdx];

    // Distractor logic
    const dH = (sequence[missingIdx].h % 12) + 1;
    const distractorStr = `${dH}:${sequence[missingIdx].m === 0 ? '00' : (sequence[missingIdx].m < 10 ? '0' + sequence[missingIdx].m : sequence[missingIdx].m)}`;
    const distractorSvg = mode === 'digital' 
        ? generateDigitalClockSvg(distractorStr, false, theme)
        : generateClockSvg(dH, sequence[missingIdx].m, theme, true);

    const options = rng.shuffle([
        { str: answerStr, svg: answerSvg, isCorrect: true },
        { str: distractorStr, svg: distractorSvg, isCorrect: false }
    ]);

    const questionParts = [];
    svgs.forEach((svg, idx) => {
        if (idx === missingIdx) {
            questionParts.push({ 
                type: 'text', 
                content: '?', 
                style: { fontSize: '4rem', fontWeight: '900', margin: '0 1rem' } 
            });
        } else {
            questionParts.push({ 
                type: 'svg', 
                content: svg,
                style: { width: '120px', height: '120px' }
            });
        }
    });

    return {
        type: 'mcq',
        level: difficulty,
        questionText: "Which clock is missing from the pattern?",
        parts: [
            { 
                type: 'row', 
                style: { gap: '0.25rem', flexWrap: 'nowrap', justifyContent: 'center', alignItems: 'center', marginBottom: '3rem' },
                parts: questionParts
            }
        ],
        options: options.map(opt => opt.svg),
        correctAnswerIndex: options.findIndex(opt => opt.isCorrect),
        explanation: {
            sections: [
                { content: `Each clock in the pattern is **${step} minutes** ${direction === 'forward' ? 'later' : 'earlier'} than the one before it.` },
                { content: `By following the sequence, the missing clock should show **${answerStr}**.` }
            ]
        },
        metadata: { step, mode, missingIdx, task: 'time_patterns_visual' }
    };
};
