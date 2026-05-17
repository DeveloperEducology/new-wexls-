/**
 * GK Theory Module
 * Provides structured educational content about famous personalities and world facts.
 */

export const gkTheory = {
  famous_personalities: {
    title: "Famous Personalities",
    description: "Learn about the people who shaped our world—from legendary sports icons to powerful political leaders.",
    personality_directory: [
      {
        name: "Sachin Tendulkar",
        known_as: "God of Cricket",
        field: "Sports (Cricket)",
        achievement: "First player to score a double century in ODI cricket.",
        key_points: [
          "Sachin Tendulkar is called the 'God of Cricket'.",
          "He is one of India's greatest cricketers.",
          "He scored 100 international centuries.",
          "He was the first player to score a double century in ODI cricket.",
          "He played for India for many years."
        ],
        question_clues: {
          nickname: "God of Cricket",
          sport: "Cricket",
          famous_for: "100 international centuries",
          first_achievement: "First double century in ODI",
          country: "India"
        }
      },
      {
        name: "Virat Kohli",
        known_as: "King Kohli",
        field: "Sports (Cricket)",
        achievement: "One of India's best modern batsmen.",
        key_points: [
          "Virat Kohli is one of India's greatest modern batsmen.",
          "He is popularly called 'King Kohli'.",
          "He has led India to many victories.",
          "He is known for aggressive batting and fitness.",
          "He is a famous Indian cricketer."
        ],
        question_clues: {
          nickname: "King Kohli",
          sport: "Cricket",
          famous_for: "Batting and leadership",
          country: "India"
        }
      },
      {
        name: "MS Dhoni",
        known_as: "Captain Cool",
        field: "Sports (Cricket)",
        achievement: "Led India to the 2011 Cricket World Cup victory.",
        key_points: [
          "MS Dhoni is famous for calm captaincy.",
          "He is called 'Captain Cool'.",
          "He led India to the 2011 Cricket World Cup victory.",
          "He is one of India's greatest cricket captains.",
          "He is known for wicketkeeping and finishing matches."
        ],
        question_clues: {
          nickname: "Captain Cool",
          sport: "Cricket",
          famous_for: "2011 World Cup victory",
          role: "Captain and wicketkeeper",
          country: "India"
        }
      },
      {
        name: "PV Sindhu",
        field: "Sports (Badminton)",
        achievement: "Olympic medal winner.",
        key_points: [
          "PV Sindhu is a famous badminton player.",
          "She won Olympic medals for India.",
          "She is one of India's top sports stars.",
          "She made India proud in badminton."
        ],
        question_clues: {
          sport: "Badminton",
          famous_for: "Olympic medals",
          country: "India"
        }
      },
      {
        name: "Neeraj Chopra",
        field: "Sports (Javelin Throw)",
        achievement: "Won Olympic gold medal.",
        key_points: [
          "Neeraj Chopra is famous for javelin throw.",
          "He won an Olympic gold medal for India.",
          "He is one of India's sports heroes."
        ],
        question_clues: {
          sport: "Javelin Throw",
          famous_for: "Olympic gold medal",
          country: "India"
        }
      },
      {
        name: "Narendra Modi",
        known_as: "NaMo",
        field: "Politics",
        role: "Prime Minister of India",
        key_points: [
          "Narendra Modi is the Prime Minister of India.",
          "He has served as Prime Minister since 2014.",
          "The Prime Minister leads the government."
        ],
        question_clues: {
          role: "Prime Minister",
          country: "India",
          field: "Politics"
        }
      },
      {
        name: "Droupadi Murmu",
        field: "Politics",
        role: "President of India",
        key_points: [
          "Droupadi Murmu is the President of India.",
          "She is the first tribal woman President of India.",
          "The President is the head of state."
        ],
        question_clues: {
          role: "President",
          country: "India",
          famous_for: "First tribal woman President"
        }
      },
      {
        name: "Mahatma Gandhi",
        known_as: "Father of the Nation",
        field: "Freedom Fighter",
        key_points: [
          "Mahatma Gandhi is called the Father of the Nation.",
          "He helped India gain independence.",
          "He believed in peace and non-violence."
        ],
        question_clues: {
          nickname: "Father of the Nation",
          famous_for: "Freedom struggle",
          country: "India"
        }
      }
    ],
    pitfalls: [
      {
        title: "PM vs President",
        description: "Don't confuse the Prime Minister with the President. The PM leads the government (Executive), while the President is the Head of State."
      },
      {
        title: "God vs King",
        description: "In Cricket, Sachin Tendulkar is called the 'God of Cricket', while Virat Kohli is called 'King Kohli'."
      },
      {
        title: "Sport Identification",
        description: "Be careful with multi-sport athletes. For example, PV Sindhu plays Badminton, while Neeraj Chopra does Javelin Throw."
      }
    ]
  }
};