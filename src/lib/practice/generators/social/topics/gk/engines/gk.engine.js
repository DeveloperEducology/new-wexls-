/**
 * GK Mastery Lab Engine
 * Handles identification and categorization of famous personalities and landmarks.
 */

const MEDIA_LIBRARY = {
  "sachin_tendulkar": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/fe777c14-4ce5-446c-a394-09ecfbe84eb8.png",
  "rohit_sharma": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/1400a1db-cccb-4ac7-b4c2-9bfd4c51c4fd.jpg",
  "virat_kohli": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/6ee77303-8f57-4f88-b519-f6a4ed84d171.jpg",
  "rahul_gandhi": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/a0e41e53-9407-4d46-9a60-0e367464c9aa.jpg",
  "draupadi_murmu": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/4a6eb4b0-83c2-41dc-b187-b17411a896dc.jpg",
  "narendra_modi": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/b8304bd4-e56d-4191-99ea-0c62f91b89de.jpg",
  "revanth_reddy": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/695ff9c6-735f-497b-9211-5edb10db3832.png",
  "ms_dhoni": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/aed8d870-728f-441e-bc86-c1d5763fabe8.png",
  "pv_sindhu": "https://img-cdn.publive.online/fit-in/640x430/filters:format(webp)/afaqs/media/media_files/2025/02/24/KR43MypFusjja3XSo9vv.png",
  "neeraj_chopra": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/f2bbe5a2-ffcb-43df-acfd-8942ac9135ba.jpg",
  "mahatma_gandhi": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/import-docs/db335f2b-793b-4fc9-9931-b97c571d1b9c.png"

};

const resolveImageUrl = (key) => MEDIA_LIBRARY[key] || key;

const GK_DATABASE = {
  famous_persons: [
    { 
      name: "Sachin Tendulkar", 
      title: "Sports Person", 
      category: "sports_person",
      level: 1,
      imageKey: "sachin_tendulkar",
      nickname: "God of Cricket",
      achievement: "First double century in ODI",
      tags: ["cricket", "batsman", "world_cup_winner", "legend", "bharat_ratna"],
      key_points: [
        "Known as the 'God of Cricket'.",
        "First player to score a double century in ODI.",
        "Scored 100 international centuries."
      ],
      description: "Legendary Indian cricketer known as the God of Cricket."
    },
    { 
      name: "Rohit Sharma", 
      title: "Sports Person", 
      category: "sports_person",
      level: 2,
      imageKey: "rohit_sharma",
      tags: ["cricket", "batsman", "captain", "hitman", "active"],
      key_points: [
        "Current captain of the Indian cricket team.",
        "Known by the nickname 'Hitman'.",
        "Famous for scoring multiple double centuries in ODIs."
      ],
      description: "Current Indian cricket captain and prolific opening batsman."
    },
    { 
      name: "Virat Kohli", 
      title: "Sports Person", 
      category: "sports_person",
      level: 1,
      imageKey: "virat_kohli",
      nickname: "King Kohli",
      tags: ["cricket", "batsman", "captain", "aggressive", "active"],
      key_points: [
        "Known by the nickname 'King Kohli'.",
        "Famous for his aggressive batting and fitness.",
        "Former captain of the Indian cricket team."
      ],
      description: "Aggressive Indian batsman and former captain."
    },
    {
      name: "MS Dhoni",
      title: "Sports Person",
      category: "sports_person",
      level: 1,
      imageKey: "ms_dhoni",
      nickname: "Captain Cool",
      achievement: "2011 Cricket World Cup victory",
      tags: ["cricket", "wicketkeeper", "captain", "finisher", "world_cup_winner"],
      key_points: [
        "Led India to the 2011 World Cup victory.",
        "Known as 'Captain Cool' for his calm nature.",
        "Famous wicketkeeper and finisher."
      ],
      description: "Legendary Indian captain who won the 2011 World Cup."
    },
    {
      name: "PV Sindhu",
      title: "Sports Person",
      category: "sports_person",
      level: 2,
      imageKey: "pv_sindhu",
      sport: "Badminton",
      tags: ["badminton", "female", "olympic_medalist", "world_champion", "active"],
      key_points: [
        "Famous Indian badminton player.",
        "First Indian woman to win two Olympic medals.",
        "Won the World Badminton Championship."
      ],
      description: "Famous Indian badminton player and Olympic medalist."
    },
    {
      name: "Neeraj Chopra",
      title: "Sports Person",
      category: "sports_person",
      level: 1,
      imageKey: "neeraj_chopra",
      sport: "Javelin Throw",
      achievement: "Olympic gold medal",
      tags: ["javelin", "athletics", "olympic_gold", "active"],
      key_points: [
        "Won the Olympic gold medal in Javelin Throw.",
        "First Indian to win gold in Track and Field.",
        "Known as the 'Golden Boy' of India."
      ],
      description: "Indian athlete who won Olympic gold in Javelin Throw."
    },
    { 
      name: "Rahul Gandhi", 
      title: "Congress Leader", 
      category: "political_leader",
      level: 2,
      imageKey: "rahul_gandhi",
      tags: ["politics", "congress", "mp", "active"],
      key_points: [
        "Senior leader of the Indian National Congress.",
        "Member of Parliament (MP).",
        "Known for his nationwide 'Bharat Jodo Yatra'."
      ],
      description: "Senior leader of the Indian National Congress."
    },
    { 
      name: "Droupadi Murmu", 
      title: "President of India", 
      category: "political_leader",
      level: 2,
      imageKey: "draupadi_murmu",
      tags: ["politics", "president", "female", "tribal_leader", "active"],
      key_points: [
        "The current President of India.",
        "First tribal woman to hold the office.",
        "The 15th President of the Republic of India."
      ],
      description: "The 15th President of India, serving since 2022."
    },
    { 
      name: "Narendra Modi", 
      title: "Prime Minister of India", 
      category: "political_leader",
      level: 1,
      imageKey: "narendra_modi",
      tags: ["politics", "pm", "bjp", "active"],
      key_points: [
        "The current Prime Minister of India.",
        "Former Chief Minister of Gujarat.",
        "Leader of the Bharatiya Janata Party (BJP)."
      ],
      description: "The current Prime Minister of India since 2014."
    },
    { 
      name: "Revanth Reddy", 
      title: "Telangana CM", 
      category: "political_leader",
      level: 3,
      imageKey: "revanth_reddy",
      tags: ["politics", "cm", "congress", "telangana", "active"],
      key_points: [
        "Current Chief Minister of Telangana.",
        "President of Telangana Pradesh Congress Committee.",
        "Represented Kodangal constituency."
      ],
      description: "The current Chief Minister of Telangana."
    },
    {
      name: "Mahatma Gandhi",
      title: "Freedom Fighter",
      category: "historical_figure",
      level: 1,
      imageKey: "mahatma_gandhi",
      nickname: "Father of the Nation",
      tags: ["history", "freedom_fighter", "non_violence", "legend"],
      key_points: [
        "Known as the 'Father of the Nation'.",
        "Led India's non-violent independence movement.",
        "Famous for the Dandi March and Quit India movement."
      ],
      description: "Leader of India's non-violent independence movement."
    }
  ]
};

export function generateGKQuestion(config = {}) {
  const { 
    forcedTask = 'gk_identify_person_v1',
    difficulty = 'easy' 
  } = config;

  const levelMap = { 'easy': 1, 'medium': 2, 'hard': 3, 'adaptive': 2 };
  const targetLevel = levelMap[difficulty] || 1;

  const pool = GK_DATABASE.famous_persons.filter(p => {
    if (targetLevel === 1) return p.level === 1;
    if (targetLevel === 2) return p.level <= 2;
    return true; 
  });

  const target = pool[Math.floor(Math.random() * pool.length)];

  // 2. Determine number of distractors based on difficulty
  // Easy: 1 distractor (2 options total)
  // Medium: 2 distractors (3 options total)
  // Hard: 3 distractors (4 options total)
  const numDistractors = targetLevel === 1 ? 1 : targetLevel === 2 ? 2 : 3;

  // Helper to get distractors with fallback
  const getDistractors = (count) => {
    // Try same category first if level > 1
    let list = GK_DATABASE.famous_persons.filter(p => 
        p.name !== target.name && 
        (targetLevel > 1 ? p.category === target.category : true)
    );

    // If not enough, fill with any category
    if (list.length < count) {
        const others = GK_DATABASE.famous_persons.filter(p => 
            p.name !== target.name && !list.find(l => l.name === p.name)
        );
        list = [...list, ...others];
    }

    return list.sort(() => 0.5 - Math.random()).slice(0, count);
  };

  // Task: Identify Person (Image -> Name)
  if (forcedTask === 'gk_identify_person_v1') {
    const distractors = getDistractors(numDistractors).map(p => p.name);
    const options = [...distractors, target.name].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(target.name);

    return {
      type: "mcq",
      text: null,
      parts: [
        { type: "text", content: `Identify the person shown in the image:` },
        { type: "image", imageUrl: resolveImageUrl(target.imageKey) }
      ],
      options: options,
      correct_answer_index: correctIndex,
      solution: {
        text: `The person in the image is **${target.name}**.`,
        explanation: `${target.name} is a ${target.title}. ${target.description}`
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Identify Image (Name -> Image)
  if (forcedTask === 'gk_identify_image_v1') {
    const distractors = getDistractors(numDistractors);
    const options = [...distractors, target].sort(() => 0.5 - Math.random())
      .map(p => ({ content: resolveImageUrl(p.imageKey), label: p.name }));
    
    const correctIndex = options.findIndex(o => o.label === target.name);

    return {
      type: "mcq",
      text: null,
      parts: [{ type: "text", content: `Identify the image of **${target.name}**:` }],
      options: options,
      correct_answer_index: correctIndex,
      isGrid: true,
      layoutConfig: { columns: 2, gap: '1.5rem' },
      solution: {
        text: `This is the correct image of **${target.name}**.`,
        explanation: `${target.name} is a ${target.title}. ${target.description}`
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Trivia (Fact -> Person)
  if (forcedTask === 'gk_trivia_v1') {
    const triviaPool = GK_DATABASE.famous_persons.filter(p => p.nickname || p.sport);
    const t = triviaPool[Math.floor(Math.random() * triviaPool.length)];
    
    let qText = "";
    if (t.nickname) qText = `Who is called the **"${t.nickname}"**?`;
    else if (t.sport) qText = `Which sport does **${t.name}** play?`;

    const distractors = GK_DATABASE.famous_persons
      .filter(p => p.name !== t.name)
      .sort(() => 0.5 - Math.random())
      .slice(0, numDistractors)
      .map(p => p.name);
    
    const options = [...distractors, t.name].sort(() => 0.5 - Math.random());
    const correctIndex = options.indexOf(t.name);

    return {
      type: "mcq",
      text: null,
      parts: [{ type: "text", content: qText }],
      options: options,
      correct_answer_index: correctIndex,
      solution: {
        text: t.name,
        explanation: `${t.name} is famously known for this role.`
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Fill in the Blanks
  if (forcedTask === 'gk_fill_blanks_v1') {
    const winners = GK_DATABASE.famous_persons.filter(p => p.achievement);
    const t = winners[Math.floor(Math.random() * winners.length)];
    
    return {
      type: "fillInTheBlank",
      text: null,
      parts: [
        { type: "text", content: "Fill in the blank:" },
        { type: "text", content: `**[blank]** ${t.achievement.toLowerCase()} for India.` }
      ],
      correctAnswer: { "blank": t.name },
      solution: {
        text: t.name,
        explanation: `${t.name} is the person associated with this major achievement.`
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Match Following
  if (forcedTask === 'gk_match_v1') {
    const matchItems = GK_DATABASE.famous_persons
      .filter(p => p.nickname || p.sport || p.achievement)
      .sort(() => 0.5 - Math.random())
      .slice(0, 3);
    
    const leftItems = matchItems.map((p, i) => ({ id: `left_${i}`, content: p.name }));
    const rightItems = matchItems.map((p, i) => ({ 
        id: `right_${i}`, 
        content: p.nickname || p.sport || p.achievement,
        matchId: `left_${i}`
    })).sort(() => 0.5 - Math.random());

    return {
      type: "matching",
      text: null,
      parts: [{ type: "text", content: "Match the personality with their famous title or sport:" }],
      pairs: matchItems.map((p, i) => ({ 
          id: `match_${i}`,
          left: { content: p.name }, 
          right: { content: p.nickname || p.sport || p.achievement } 
      })),
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  if (forcedTask === 'gk_sort_people_v1') {
    const categoryDefinitions = [
      { id: 'political_leader', label: 'Political leaders' },
      { id: 'sports_person', label: 'Sports persons' }
    ];
    const sourceItems = [
      GK_DATABASE.famous_persons.find(p => p.name === 'Sachin Tendulkar'),
      GK_DATABASE.famous_persons.find(p => p.name === 'PV Sindhu'),
      GK_DATABASE.famous_persons.find(p => p.name === 'Narendra Modi'),
      GK_DATABASE.famous_persons.find(p => p.name === 'Droupadi Murmu')
    ].filter(Boolean).sort(() => 0.5 - Math.random());
    const categories = categoryDefinitions;
    const items = sourceItems.map(person => ({
      id: person.imageKey,
      content: person.name,
      imageUrl: resolveImageUrl(person.imageKey),
      target: person.category,
      categoryId: person.category
    }));
    const answer = {};
    items.forEach(item => {
      answer[item.id] = item.target;
    });

    return {
      type: "categorization",
      questionText: "Sort each person: political leader or sports person.",
      categories,
      items,
      poolPosition: "bottom",
      answer,
      solution: {
        text: "Political leaders and sports persons are different GK categories.",
        explanation: "Narendra Modi and Droupadi Murmu are political leaders. Sachin Tendulkar and PV Sindhu are sports persons."
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: True/False
  if (forcedTask === 'gk_true_false_v1') {
    const isTrue = Math.random() > 0.5;
    const t = pool[Math.floor(Math.random() * pool.length)];
    let other = pool.filter(p => p.category !== t.category)[0] || t;
    
    const qText = isTrue 
        ? `**${t.name}** is famous for **${t.category === 'sports_person' ? (t.sport || 'Cricket') : t.title}**.`
        : `**${t.name}** is famous for **${other.category === 'sports_person' ? (other.sport || 'Cricket') : other.title}**.`;

    return {
      type: "mcq",
      text: null,
      parts: [
        { type: "text", content: "True or False?" },
        { type: "text", content: qText }
      ],
      options: ["True", "False"],
      correct_answer_index: isTrue ? 0 : 1,
      solution: {
        text: isTrue ? "True" : "False",
        explanation: `${t.name} is associated with ${t.category === 'sports_person' ? (t.sport || 'Cricket') : t.title}.`
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Misconception Detection
  if (forcedTask === 'gk_misconception_v1') {
    const scenarios = [
      {
        prompt: "Which statement about **Indian Governance** is CORRECT?",
        correct: { text: "The President is the ceremonial Head of State.", remediation: "The President represents the nation but doesn't lead the daily government." },
        distractors: [
          { text: "The President leads the government's daily work.", remediation: "No, that is the Prime Minister's role." },
          { text: "The Prime Minister is the Head of State.", remediation: "No, the President is the Head of State." },
          { text: "Chief Ministers report directly to the President.", remediation: "CMs lead states; the system is parliamentary." }
        ]
      },
      {
        prompt: "Which statement about **Cricket Nicknames** is CORRECT?",
        correct: { text: "Sachin Tendulkar is known as the 'God of Cricket'.", remediation: "Sachin holds the record for 100 centuries." },
        distractors: [
          { text: "Virat Kohli is the 'God of Cricket'.", remediation: "No, Virat is called 'King Kohli'." },
          { text: "MS Dhoni is called 'King Kohli'.", remediation: "No, Dhoni is 'Captain Cool'." },
          { text: "Sachin Tendulkar is called 'Captain Cool'.", remediation: "No, Dhoni is 'Captain Cool'." }
        ]
      },
      {
        prompt: "Which statement about **Olympic Heroes** is CORRECT?",
        correct: { text: "Neeraj Chopra won a Gold medal in Javelin Throw.", remediation: "He won it at the Tokyo Olympics." },
        distractors: [
          { text: "PV Sindhu is a famous Cricket player.", remediation: "No, PV Sindhu plays Badminton." },
          { text: "Neeraj Chopra is a famous Badminton player.", remediation: "No, he does Javelin Throw." },
          { text: "Virat Kohli won an Olympic Gold medal.", remediation: "No, Virat is a cricketer; cricket is not currently in the Olympics." }
        ]
      }
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const distractors = scenario.distractors.sort(() => 0.5 - Math.random()).slice(0, 3);
    const allOptions = [...distractors, scenario.correct].sort(() => 0.5 - Math.random());

    return {
      type: "mcq",
      text: null,
      parts: [{ type: "text", content: scenario.prompt }],
      options: allOptions.map(o => o.text),
      correct_answer_index: allOptions.findIndex(o => o.text === scenario.correct.text),
      solution: {
        text: scenario.correct.text,
        explanation: scenario.correct.remediation
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Inference (Smart Mode)
  if (forcedTask === 'gk_inference_v1') {
    const modes = ['riddle', 'association', 'achievement'];
    const mode = modes[Math.floor(Math.random() * modes.length)];

    if (mode === 'riddle') {
      const t = GK_DATABASE.famous_persons.filter(p => p.tags && p.tags.length >= 2).sort(() => 0.5 - Math.random())[0];
      const displayTags = t.tags.slice(0, 2).map(tag => `**${tag.replace('_', ' ')}**`).join(', ');
      const prompt = `I am associated with ${displayTags}. My title is **"${t.nickname || t.title}"**. Who am I?`;
      
      // Distractors should NOT have both tags
      const distractors = GK_DATABASE.famous_persons
        .filter(p => p.name !== t.name && !(p.tags.includes(t.tags[0]) && p.tags.includes(t.tags[1])))
        .sort(() => 0.5 - Math.random())
        .slice(0, numDistractors)
        .map(p => p.name);

      const options = [...distractors, t.name].sort(() => 0.5 - Math.random());
      
      return {
        type: "mcq",
        text: null,
        parts: [{ type: "text", content: prompt }],
        options: options,
        correct_answer_index: options.indexOf(t.name),
        solution: { text: t.name, explanation: t.description },
        metadata: { task: forcedTask, module: 'gk', difficulty }
      };
    }

    if (mode === 'association') {
      const t = GK_DATABASE.famous_persons[Math.floor(Math.random() * GK_DATABASE.famous_persons.length)];
      const categoryLabel = t.category.replace('_', ' ');
      const tagLabel = t.tags[0].replace('_', ' ');
      const prompt = `Which of these people is a **${categoryLabel}** and is associated with **${tagLabel}**?`;
      
      // Distractors MUST NOT be in this category AND match this tag
      const distractors = GK_DATABASE.famous_persons
        .filter(p => p.name !== t.name && !(p.category === t.category && p.tags.includes(t.tags[0])))
        .sort(() => 0.5 - Math.random())
        .slice(0, numDistractors)
        .map(p => p.name);

      const options = [...distractors, t.name].sort(() => 0.5 - Math.random());
      
      return {
        type: "mcq",
        text: null,
        parts: [{ type: "text", content: prompt }],
        options: options,
        correct_answer_index: options.indexOf(t.name),
        solution: { text: t.name, explanation: `${t.name} is a ${t.title} who works in ${tagLabel}.` },
        metadata: { task: forcedTask, module: 'gk', difficulty }
      };
    }

    // Default: Achievement Scenario
    const scenarios = [
      {
        prompt: "Who among these won an **Olympic gold medal** for India?",
        tag: "olympic_gold",
        explanation: "Neeraj Chopra won the Olympic gold medal in Javelin Throw."
      },
      {
        prompt: "Which captain led India to the **2011 Cricket World Cup** victory?",
        tag: "world_cup_winner",
        explanation: "MS Dhoni led India to the historic 2011 World Cup win."
      },
      {
        prompt: "Who among these is the first **tribal woman** to become the President of India?",
        tag: "tribal_leader",
        explanation: "Droupadi Murmu made history as the first tribal woman President."
      }
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const t = GK_DATABASE.famous_persons.find(p => p.tags?.includes(scenario.tag));
    
    if (!t) return null;

    const distractors = GK_DATABASE.famous_persons
        .filter(p => p.name !== t.name && !p.tags?.includes(scenario.tag))
        .sort(() => 0.5 - Math.random())
        .slice(0, numDistractors)
        .map(p => p.name);

    const options = [...distractors, t.name].sort(() => 0.5 - Math.random());
    
    return {
      type: "mcq",
      text: null,
      parts: [{ type: "text", content: scenario.prompt }],
      options: options,
      correct_answer_index: options.indexOf(t.name),
      solution: { text: t.name, explanation: scenario.explanation },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Multi-Select Identification
  if (forcedTask === 'gk_multi_select_v1') {
    const scenarios = [
      { label: "Cricketers", filter: p => p.tags.includes("cricket"), explanation: "These people are famous Indian cricketers." },
      { label: "Political Leaders", filter: p => p.category === "political_leader", explanation: "These people are prominent Indian politicians." },
      { label: "Olympic Medalists", filter: p => p.tags.includes("olympic_medalist") || p.tags.includes("olympic_gold"), explanation: "These athletes have won medals at the Olympics." },
      { label: "Women Leaders", filter: p => p.tags.includes("female"), explanation: "These are famous Indian women who achieved greatness." }
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
    const correctOnes = GK_DATABASE.famous_persons.filter(scenario.filter);
    const wrongOnes = GK_DATABASE.famous_persons.filter(p => !scenario.filter(p));

    // Pick 2 correct and 2 wrong for a total of 4 options
    const targetCorrect = correctOnes.sort(() => 0.5 - Math.random()).slice(0, 2);
    const targetWrong = wrongOnes.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    const options = [...targetCorrect, ...targetWrong].sort(() => 0.5 - Math.random()).map(p => p.name);
    const correctIndices = options.map((opt, i) => targetCorrect.find(t => t.name === opt) ? i : -1).filter(i => i !== -1);

    return {
      type: "mcq",
      isMultiSelect: true,
      text: null,
      parts: [{ type: "text", content: `Select **ALL** the **${scenario.label}** from the list:` }],
      options: options,
      correct_answer_indices: correctIndices,
      solution: {
        text: targetCorrect.map(p => p.name).join(", "),
        explanation: scenario.explanation
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  // Task: Key Points Multi-Select
  if (forcedTask === 'gk_key_points_v1') {
    const t = GK_DATABASE.famous_persons[Math.floor(Math.random() * GK_DATABASE.famous_persons.length)];
    const correctPoints = t.key_points.sort(() => 0.5 - Math.random()).slice(0, 2);
    
    const otherPoints = GK_DATABASE.famous_persons
      .filter(p => p.name !== t.name)
      .flatMap(p => p.key_points)
      .sort(() => 0.5 - Math.random())
      .slice(0, 2);

    const allOptions = [...correctPoints, ...otherPoints].sort(() => 0.5 - Math.random());
    const correctIndices = allOptions.map((opt, i) => correctPoints.includes(opt) ? i : -1).filter(i => i !== -1);

    return {
      type: "mcq",
      isMultiSelect: true,
      text: null,
      parts: [
        { type: "text", content: `Identify all the **correct facts** about **${t.name}**:` },
        { type: "image", imageUrl: resolveImageUrl(t.imageKey) }
      ],
      options: allOptions,
      correct_answer_indices: correctIndices,
      solution: {
        text: correctPoints.join(" | "),
        explanation: `${t.name} is a ${t.title}. ${t.description}`
      },
      metadata: { task: forcedTask, module: 'gk', difficulty }
    };
  }

  return null;
}
