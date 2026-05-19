export const competencyGraphs = {
  math: {
    addition: {
      competencies: [
        {
          id: 'addition_facts_to_10',
          title: 'Addition facts within 10',
          prerequisites: ['count_objects', 'compose_numbers_to_10'],
          remediation: ['count_objects', 'addition_models_to_10'],
        },
        {
          id: 'addition_models_to_10',
          title: 'Represent addition with models within 10',
          prerequisites: ['count_objects'],
          remediation: ['count_objects'],
        },
        {
          id: 'addition_word_problems_to_20',
          title: 'Solve addition word problems within 20',
          prerequisites: ['addition_facts_to_10', 'addition_models_to_10'],
          remediation: ['addition_models_to_10'],
        },
        {
          id: 'addition_facts_to_20',
          title: 'Addition facts within 20',
          prerequisites: ['addition_facts_to_10'],
          remediation: ['addition_facts_to_10'],
        },
        {
          id: 'two_digit_addition_no_regrouping',
          title: 'Add two-digit numbers without regrouping',
          prerequisites: ['addition_facts_to_20', 'place_value_tens_ones'],
          remediation: ['place_value_tens_ones', 'addition_facts_to_20'],
        },
        {
          id: 'two_digit_addition_with_regrouping',
          title: 'Add two-digit numbers with regrouping',
          prerequisites: ['two_digit_addition_no_regrouping'],
          remediation: ['two_digit_addition_no_regrouping', 'make_ten_strategy'],
        },
        {
          id: 'make_ten_strategy',
          title: 'Use make-ten and near-doubles addition strategies',
          prerequisites: ['addition_facts_to_10'],
          remediation: ['addition_facts_to_10'],
        },
        {
          id: 'combining_sets',
          title: 'Combine two sets into one total',
          prerequisites: ['count_objects'],
          remediation: ['count_objects', 'counting_all'],
        },
        {
          id: 'counting_all',
          title: 'Count all objects to find a sum',
          prerequisites: ['count_objects'],
          remediation: ['count_objects'],
        },
        {
          id: 'counting_on',
          title: 'Count on from one addend',
          prerequisites: ['counting_all'],
          remediation: ['counting_all'],
        },
        {
          id: 'one_more',
          title: 'Add one more',
          prerequisites: ['counting_on'],
          remediation: ['counting_all'],
        },
        {
          id: 'two_more',
          title: 'Add two more',
          prerequisites: ['counting_on', 'one_more'],
          remediation: ['one_more'],
        },
        {
          id: 'number_decomposition',
          title: 'Decompose numbers to add',
          prerequisites: ['number_bonds'],
          remediation: ['number_bonds', 'part_part_whole'],
        },
        {
          id: 'part_part_whole',
          title: 'Use part-part-whole addition models',
          prerequisites: ['combining_sets'],
          remediation: ['visual_quantities', 'combining_sets'],
        },
        {
          id: 'number_bonds',
          title: 'Use number bonds for addition',
          prerequisites: ['part_part_whole'],
          remediation: ['part_part_whole'],
        },
        {
          id: 'doubles',
          title: 'Add doubles facts',
          prerequisites: ['addition_facts_to_10'],
          remediation: ['addition_facts_to_10'],
        },
        {
          id: 'near_doubles',
          title: 'Use doubles and near doubles',
          prerequisites: ['doubles'],
          remediation: ['doubles'],
        },
        {
          id: 'addition_fact_fluency',
          title: 'Build addition fact fluency',
          prerequisites: ['addition_facts_to_10', 'addition_facts_to_20'],
          remediation: ['addition_facts_to_10'],
        },
        {
          id: 'number_line_jumps',
          title: 'Represent addition as jumps on a number line',
          prerequisites: ['counting_on'],
          remediation: ['counting_on'],
        },
        {
          id: 'visual_quantities',
          title: 'Represent sums with visual quantities',
          prerequisites: ['count_objects'],
          remediation: ['counting_all'],
        },
        {
          id: 'unknown_addend',
          title: 'Find an unknown addend',
          prerequisites: ['number_bonds', 'addition_facts_to_10'],
          remediation: ['number_bonds'],
        },
        {
          id: 'word_problem_translation',
          title: 'Translate addition stories into equations',
          prerequisites: ['equation_representation', 'part_part_whole'],
          remediation: ['part_part_whole', 'visual_quantities'],
        },
        {
          id: 'equation_representation',
          title: 'Represent addition with equations',
          prerequisites: ['combining_sets'],
          remediation: ['visual_quantities'],
        },
        {
          id: 'equality',
          title: 'Understand equal sums',
          prerequisites: ['addition_fact_fluency'],
          remediation: ['addition_facts_to_20'],
        },
        {
          id: 'balancing_equations',
          title: 'Balance addition equations',
          prerequisites: ['equality', 'unknown_addend'],
          remediation: ['equality', 'unknown_addend'],
        },
        {
          id: 'place_value_addition',
          title: 'Add using place value',
          prerequisites: ['addition_facts_to_20', 'place_value_tens_ones'],
          remediation: ['addition_facts_to_20', 'place_value_tens_ones'],
        },
        {
          id: 'regrouping',
          title: 'Regroup while adding',
          prerequisites: ['place_value_addition', 'make_ten_strategy'],
          remediation: ['place_value_addition', 'make_ten_strategy'],
        },
        {
          id: 'mental_strategies',
          title: 'Use mental addition strategies',
          prerequisites: ['number_decomposition', 'make_ten_strategy'],
          remediation: ['number_decomposition', 'make_ten_strategy'],
        },
        {
          id: 'addition_subtraction_relation',
          title: 'Use the relationship between addition and subtraction',
          prerequisites: ['unknown_addend', 'addition_facts_to_20'],
          remediation: ['unknown_addend'],
        },
        {
          id: 'teen_numbers',
          title: 'Add to make teen numbers',
          prerequisites: ['make_ten_strategy'],
          remediation: ['make_ten_strategy'],
        },
        {
          id: 'multi_addend_addition',
          title: 'Add three or more addends',
          prerequisites: ['addition_fact_fluency', 'make_ten_strategy'],
          remediation: ['addition_fact_fluency', 'make_ten_strategy'],
        },
      ],
      skillMap: {
        'addition-remedial-combine-sets-to-5': 'combining_sets',
        'addition-remedial-count-all-to-10': 'counting_all',
        'addition-remedial-one-more-to-10': 'one_more',
        'addition-remedial-two-more-to-10': 'two_more',
        'addition-remedial-number-bonds-to-10': 'number_bonds',
        'addition-remedial-unknown-addend-to-10': 'unknown_addend',
        'addition-g1-a1-horizontal-to-9': 'addition_facts_to_10',
        'addition-g1-counting-on-to-20': 'counting_on',
        'addition-g1-one-more-to-20': 'one_more',
        'addition-g1-two-more-to-20': 'two_more',
        'addition-g1-c1-visual-counting-to-10': 'addition_models_to_10',
        'addition-g1-copy-cubes-to-boxes': 'addition_models_to_10',
        'addition-g1-e3-model-match-to-10': 'addition_models_to_10',
        'addition-g1-v7-picture-sentence-to-5': 'addition_models_to_10',
        'addition-g1-visual-quantities-to-10': 'visual_quantities',
        'addition-g1-part-part-whole-to-10': 'part_part_whole',
        'addition-g1-number-bonds-to-10': 'number_bonds',
        'addition-g1-q5-word-sentence-to-10': 'addition_word_problems_to_20',
        'addition-g1-equation-representation-to-10': 'equation_representation',
        'addition-g1-word-translation-to-20': 'word_problem_translation',
        'addition-g1-q13-sort-facts-sums-to-20': 'addition_facts_to_20',
        'addition-g1-q13b-sort-values-html-sums-to-20': 'addition_facts_to_20',
        'addition-g1-q14-make-number-sums-to-20': 'addition_facts_to_20',
        'addition-g1-r1-word-problems-models-to-20': 'addition_word_problems_to_20',
        'addition-g1-fact-fluency-to-20': 'addition_fact_fluency',
        'addition-g1-teen-numbers-to-20': 'teen_numbers',
        'addition-g1-number-line-jumps-to-20': 'number_line_jumps',
        'addition-g2-b1-vertical-10-99': 'two_digit_addition_no_regrouping',
        'addition-g2-b2-vertical-10-99-regrouping': 'two_digit_addition_with_regrouping',
        'addition-g2-g3-three-addends-make-10': 'make_ten_strategy',
        'addition-g2-doubles-to-20': 'doubles',
        'addition-g2-g4-doubles-plus-one': 'near_doubles',
        'addition-g2-g4-three-addends-vertical': 'multi_addend_addition',
        'addition-g2-balance-equations-to-20': 'balancing_equations',
        'addition-g2-unknown-addend-to-20': 'unknown_addend',
        'addition-g2-equality-to-20': 'equality',
        'addition-g2-addition-subtraction-relation-to-20': 'addition_subtraction_relation',
        'addition-g2-mental-strategies-to-100': 'mental_strategies',
        'addition-g2-place-value-to-99': 'place_value_addition',
        'addition-g2-multi-addend-to-20': 'multi_addend_addition',
        'addition-g3-place-value-to-999': 'place_value_addition',
        'addition-g3-regrouping-to-999': 'regrouping',
        'addition-g3-mental-strategies-to-1000': 'mental_strategies',
        'addition-g3-multi-addend-to-999': 'multi_addend_addition',
        'addition-g3-number-decomposition-to-1000': 'number_decomposition',
        'addition-g4-place-value-to-9999': 'place_value_addition',
        'addition-g4-regrouping-to-9999': 'regrouping',
        'addition-g4-multi-addend-to-9999': 'multi_addend_addition',
        'addition-g4-mental-strategies-to-10000': 'mental_strategies',
      },
    },
    subtraction: {
      competencies: [
        {
          id: 'subtraction_models_to_10',
          title: 'Represent subtraction with models within 10',
          prerequisites: ['count_objects'],
          remediation: ['count_objects'],
        },
        {
          id: 'subtraction_take_away_cubes_to_5',
          title: 'Take away cubes - numbers up to 5',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'subtraction_subtract_cubes_to_5',
          title: 'Subtract with cubes - numbers up to 5',
          prerequisites: ['subtraction_take_away_cubes_to_5'],
          remediation: ['subtraction_take_away_cubes_to_5'],
        },
        {
          id: 'subtraction_subtract_pictures_to_5',
          title: 'Subtract with pictures - numbers up to 5',
          prerequisites: ['subtraction_subtract_cubes_to_5'],
          remediation: ['subtraction_subtract_cubes_to_5'],
        },
        {
          id: 'subtraction_sentence_model_matches_to_5',
          title: 'Subtraction sentences up to 5 - which model matches?',
          prerequisites: ['subtraction_subtract_pictures_to_5'],
          remediation: ['subtraction_subtract_pictures_to_5'],
        },
        {
          id: 'subtraction_sentence_what_model_shows_to_5',
          title: 'Subtraction sentences up to 5 - what does the model show?',
          prerequisites: ['subtraction_sentence_model_matches_to_5'],
          remediation: ['subtraction_sentence_model_matches_to_5'],
        },
        {
          id: 'subtraction_sentence_what_cube_train_shows_to_5',
          title: 'Subtraction sentences up to 5 - what does the cube train show?',
          prerequisites: ['subtraction_sentence_what_model_shows_to_5'],
          remediation: ['subtraction_sentence_what_model_shows_to_5'],
        },
        {
          id: 'subtraction_word_problems_pictures_to_5',
          title: 'Subtraction word problems with pictures - numbers up to 5',
          prerequisites: ['subtraction_sentence_what_cube_train_shows_to_5'],
          remediation: ['subtraction_sentence_what_cube_train_shows_to_5'],
        },
        {
          id: 'subtraction_take_away_cubes_to_10',
          title: 'Take away cubes - numbers up to 10',
          prerequisites: ['subtraction_take_away_cubes_to_5'],
          remediation: ['subtraction_take_away_cubes_to_5'],
        },
        {
          id: 'subtraction_subtract_cubes_to_10',
          title: 'Subtract with cubes - numbers up to 10',
          prerequisites: ['subtraction_take_away_cubes_to_10'],
          remediation: ['subtraction_take_away_cubes_to_10'],
        },
        {
          id: 'subtraction_subtract_pictures_to_10',
          title: 'Subtract with pictures - numbers up to 10',
          prerequisites: ['subtraction_subtract_cubes_to_10'],
          remediation: ['subtraction_subtract_cubes_to_10'],
        },
        {
          id: 'subtraction_sentence_model_matches_to_10',
          title: 'Subtraction sentences up to 10 - which model matches?',
          prerequisites: ['subtraction_subtract_pictures_to_10'],
          remediation: ['subtraction_subtract_pictures_to_10'],
        },
        {
          id: 'subtraction_sentence_what_model_shows_to_10',
          title: 'Subtraction sentences up to 10 - what does the model show?',
          prerequisites: ['subtraction_sentence_model_matches_to_10'],
          remediation: ['subtraction_sentence_model_matches_to_10'],
        },
        {
          id: 'subtraction_sentence_what_cube_train_shows_to_10',
          title: 'Subtraction sentences up to 10 - what does the cube train show?',
          prerequisites: ['subtraction_sentence_what_model_shows_to_10'],
          remediation: ['subtraction_sentence_what_model_shows_to_10'],
        },
        {
          id: 'subtraction_word_problems_pictures_to_10',
          title: 'Subtraction word problems with pictures - numbers up to 10',
          prerequisites: ['subtraction_sentence_what_cube_train_shows_to_10'],
          remediation: ['subtraction_sentence_what_cube_train_shows_to_10'],
        },
      ],
      skillMap: {
        'subtraction-g1-c1-remove-cubes-to-10': 'subtraction_models_to_10',
        'subtraction-prek-x1-take-away-cubes-to-5': 'subtraction_take_away_cubes_to_5',
        'subtraction-prek-x2-subtract-cubes-to-5': 'subtraction_subtract_cubes_to_5',
        'subtraction-prek-x3-subtract-pictures-to-5': 'subtraction_subtract_pictures_to_5',
        'subtraction-prek-x4-sentence-which-model-matches-to-5': 'subtraction_sentence_model_matches_to_5',
        'subtraction-prek-x5-sentence-what-model-shows-to-5': 'subtraction_sentence_what_model_shows_to_5',
        'subtraction-prek-x6-sentence-what-cube-train-shows-to-5': 'subtraction_sentence_what_cube_train_shows_to_5',
        'subtraction-prek-x7-word-problems-pictures-to-5': 'subtraction_word_problems_pictures_to_5',
        'subtraction-prek-y1-take-away-cubes-to-10': 'subtraction_take_away_cubes_to_10',
        'subtraction-prek-y2-subtract-cubes-to-10': 'subtraction_subtract_cubes_to_10',
        'subtraction-prek-y3-subtract-pictures-to-10': 'subtraction_subtract_pictures_to_10',
        'subtraction-prek-y4-sentence-which-model-matches-to-10': 'subtraction_sentence_model_matches_to_10',
        'subtraction-prek-y5-sentence-what-model-shows-to-10': 'subtraction_sentence_what_model_shows_to_10',
        'subtraction-prek-y6-sentence-what-cube-train-shows-to-10': 'subtraction_sentence_what_cube_train_shows_to_10',
        'subtraction-prek-y7-word-problems-pictures-to-10': 'subtraction_word_problems_pictures_to_10',
      },
    },
    fractions: {
      competencies: [
        {
          id: 'fraction_visual_models',
          title: 'Understand fractions using visual models',
          prerequisites: ['equal_parts'],
          remediation: ['equal_parts'],
        },
        {
          id: 'fraction_equivalence',
          title: 'Equivalent fractions on number lines',
          prerequisites: ['fraction_visual_models'],
          remediation: ['fraction_visual_models'],
        }
      ],
      skillMap: {
        visual_models_identify: 'fraction_visual_models',
        visual_models_equal_parts: 'fraction_visual_models',
        visual_models_fraction_of_set: 'fraction_visual_models',
        visual_models_mixed_numbers: 'fraction_visual_models',
        visual_models_remove_fraction_pie: 'fraction_visual_models',
        visual_models_remove_fraction_square: 'fraction_visual_models',
        visual_models_remove_fraction_bar: 'fraction_visual_models',
        visual_models_remove_fraction_rectangle: 'fraction_visual_models',
        visual_models_fill_fraction_pie: 'fraction_visual_models',
        visual_models_fill_fraction_square: 'fraction_visual_models',
        visual_models_fill_fraction_rectangle: 'fraction_visual_models',
        visual_models_cut_rectangle_fourths: 'fraction_visual_models',
        visual_models_cut_circle_fourths: 'fraction_visual_models',
        visual_models_cut_rectangle_halves_different: 'fraction_visual_models',
        equivalence_number_line: 'fraction_equivalence',
      },
    },
    time: {
      competencies: [
        {
          id: 'calendar_sequence',
          title: 'Use calendar and sequence concepts',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'clock_reading',
          title: 'Read analogue and digital clocks',
          prerequisites: ['time_units'],
          remediation: ['time_units'],
        },
        {
          id: 'time_patterns',
          title: 'Solve elapsed time and time pattern problems',
          prerequisites: ['clock_reading'],
          remediation: ['clock_reading'],
        },
      ],
      skillMap: {
        v1_days_of_week: 'calendar_sequence',
        order_days: 'calendar_sequence',
        v2_seasons: 'calendar_sequence',
        order_seasons: 'calendar_sequence',
        v3_calendar: 'calendar_sequence',
        v4_months: 'calendar_sequence',
        m5_days_in_month: 'calendar_sequence',
        m6_relate_time_units: 'time_patterns',
        v5_am_pm: 'clock_reading',
        match_analog_clock_words: 'clock_reading',
        match_digital_clock: 'clock_reading',
        o3_read_clock: 'clock_reading',
        o5_elapsed_time: 'time_patterns',
        o7_time_patterns: 'time_patterns',
      },
    },
    'place-values': {
      competencies: [
        {
          id: 'place_value_tens_ones',
          title: 'Understand tens and ones',
          prerequisites: ['count_objects'],
          remediation: ['count_objects'],
        },
        {
          id: 'place_value_hundreds_thousands',
          title: 'Understand hundreds and thousands',
          prerequisites: ['place_value_tens_ones'],
          remediation: ['place_value_tens_ones'],
        },
        {
          id: 'place_value_forms',
          title: 'Use expanded, table, and word forms',
          prerequisites: ['place_value_tens_ones'],
          remediation: ['place_value_tens_ones'],
        },
      ],
      skillMap: {
        'pv-g1-blocks-units': 'place_value_tens_ones',
        'pv-g1-place-name': 'place_value_tens_ones',
        'pv-g1-match-blocks-to-number': 'place_value_tens_ones',
        'pv-g2-blocks-hundreds': 'place_value_hundreds_thousands',
        'pv-g2-expanded-form': 'place_value_forms',
        'pv-g2-breakdown-table': 'place_value_forms',
        'pv-g3-blocks-thousands': 'place_value_hundreds_thousands',
        'pv-g3-word-to-number': 'place_value_forms',
      },
    },
    testing: {
      competencies: [
        {
          id: 'interactive_tool_fluency',
          title: 'Use reusable interactive practice tools',
          prerequisites: [],
          remediation: [],
        },
      ],
      skillMap: {},
    },
  },
  social: {
    gk: {
      competencies: [
        {
          id: 'gk_people_and_facts',
          title: 'Recognize people, facts, and civic/sports knowledge',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'gk_reasoning',
          title: 'Reason about general knowledge statements',
          prerequisites: ['gk_people_and_facts'],
          remediation: ['gk_people_and_facts'],
        },
      ],
      skillMap: {
        gk_identify_person_v1: 'gk_people_and_facts',
        gk_identify_image_v1: 'gk_people_and_facts',
        gk_trivia_v1: 'gk_people_and_facts',
        gk_fill_blanks_v1: 'gk_people_and_facts',
        gk_sort_people_v1: 'gk_people_and_facts',
        gk_true_false_v1: 'gk_reasoning',
        gk_misconception_v1: 'gk_reasoning',
        gk_inference_v1: 'gk_reasoning',
      },
    },
  },
  science: {
    'units-measurement': {
      competencies: [
        {
          id: 'temperature_reading_celsius',
          title: 'Read a thermometer (Celsius)',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'temperature_reading_fahrenheit',
          title: 'Read a thermometer (Fahrenheit)',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'temperature_compare',
          title: 'Compare temperatures',
          prerequisites: ['temperature_reading_celsius'],
          remediation: ['temperature_reading_celsius'],
        },
        {
          id: 'temperature_estimation',
          title: 'Estimate temperatures',
          prerequisites: ['temperature_reading_celsius', 'temperature_reading_fahrenheit'],
          remediation: ['temperature_reading_celsius'],
        },
        {
          id: 'temperature_unit_conversion',
          title: 'Convert temperature units',
          prerequisites: ['temperature_reading_celsius', 'temperature_reading_fahrenheit'],
          remediation: ['temperature_reading_celsius'],
        },
        {
          id: 'time_estimation',
          title: 'Choose units of time',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'distance_estimation',
          title: 'Choose customary units of distance',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'metric_distance_estimation',
          title: 'Choose metric units of distance',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'measuring_tool_choice',
          title: 'Choose the best measuring tool',
          prerequisites: [],
          remediation: [],
        },
      ],
      skillMap: {
        'science-g2-p6-read-thermometer-celsius': 'temperature_reading_celsius',
        'science-g2-p7-compare-temperatures': 'temperature_compare',
        'science-g3-t1-read-thermometer': 'temperature_reading_celsius',
        'science-g3-t2-compare-temperatures': 'temperature_compare',
        'science-g3-t3-metric-units-distance': 'metric_distance_estimation',
        'science-g3-t4-choose-units-of-time': 'time_estimation',
        'science-g3-t5-customary-units-distance': 'distance_estimation',
        'science-g3-t6-choose-measuring-tool': 'measuring_tool_choice',
        'science-g4-w1-read-thermometer': 'temperature_reading_fahrenheit',
        'science-g4-w2-compare-temperatures': 'temperature_compare',
        'science-g8-ii3-estimate-temperatures': 'temperature_estimation',
      },
    },
  },
  multiplication: {
  competencies: [
    {
      id: 'multiplication_facts_to_5',
      title: 'Multiplication facts up to 5',
      prerequisites: ['skip_counting'],
      remediation: ['repeated_addition']
    },
    {
      id: 'multiplication_facts_to_10',
      title: 'Multiplication facts up to 10',
      prerequisites: ['multiplication_facts_to_5'],
      remediation: ['multiplication_facts_to_5'],
    },
    {
      id: 'multiplication_equal_groups',
      title: 'Describe multiplication as equal groups',
      prerequisites: ['count_objects'],
      remediation: ['count_objects']
    },
    {
      id: 'multiplication_equal_groups_expressions',
      title: 'Match equal groups to multiplication expressions',
      prerequisites: ['multiplication_equal_groups'],
      remediation: ['multiplication_equal_groups']
    },
    {
      id: 'multiplication_equal_groups_sentences',
      title: 'Write multiplication sentences from equal groups',
      prerequisites: ['multiplication_equal_groups_expressions'],
      remediation: ['multiplication_equal_groups']
    },
    {
      id: 'multiplication_repeated_addition',
      title: 'Relate repeated addition and multiplication',
      prerequisites: ['multiplication_equal_groups_sentences'],
      remediation: ['multiplication_equal_groups_expressions']
    },
    {
      id: 'multiplication_vertical_1digit',
      title: 'Vertical multiplication with one-digit factors',
      prerequisites: ['multiplication_facts_to_10'],
      remediation: ['multiplication_facts_to_5']
    },
    {
      id: 'multiplication_vertical_2digit',
      title: 'Two-digit by one-digit multiplication without regrouping',
      prerequisites: ['multiplication_vertical_1digit'],
      remediation: ['multiplication_facts_to_10']
    },
    {
      id: 'multiplication_vertical_2digit_regrouping',
      title: 'Two-digit by one-digit multiplication with regrouping',
      prerequisites: ['multiplication_vertical_2digit'],
      remediation: ['multiplication_vertical_2digit']
    },
    {
      id: 'multiplication_vertical_3digit',
      title: 'Three-digit by one-digit multiplication without regrouping',
      prerequisites: ['multiplication_vertical_2digit'],
      remediation: ['multiplication_vertical_2digit']
    },
    {
      id: 'multiplication_vertical_3digit_regrouping',
      title: 'Three-digit by one-digit multiplication with regrouping',
      prerequisites: ['multiplication_vertical_3digit'],
      remediation: ['multiplication_vertical_2digit_regrouping']
    },
    {
      id: 'multiplication_vertical_4digit',
      title: 'Four-digit by one-digit multiplication without regrouping',
      prerequisites: ['multiplication_vertical_3digit'],
      remediation: ['multiplication_vertical_3digit']
    },
    {
      id: 'multiplication_vertical_4digit_regrouping',
      title: 'Four-digit by one-digit multiplication with regrouping',
      prerequisites: ['multiplication_vertical_4digit'],
      remediation: ['multiplication_vertical_3digit_regrouping']
    },
    {
      id: 'multiplication_equal_groups_rabbits',
      title: 'Multiplication with equal groups of rabbits',
      prerequisites: ['multiplication_equal_groups_sentences'],
      remediation: ['multiplication_equal_groups']
    },
    {
      id: 'multiplication_equal_groups_penguins',
      title: 'Multiplication with equal groups of penguins',
      prerequisites: ['multiplication_equal_groups_sentences'],
      remediation: ['multiplication_equal_groups']
    }
  ],
  skillMap: {
    'multiplication-g2-a1-facts-to-5': 'multiplication_facts_to_5',
    'multiplication-g2-a2-facts-to-10': 'multiplication_facts_to_10',
    'multiplication-g2-n1-describe-equal-groups': 'multiplication_equal_groups',
    'multiplication-g2-n4-expression-equal-groups': 'multiplication_equal_groups_expressions',
    'multiplication-g3-n5-write-sentence-equal-groups': 'multiplication_equal_groups_sentences',
    'multiplication-g3-n6-relate-addition-multiplication-equal-groups': 'multiplication_repeated_addition',
    'multiplication-g3-n7-rabbit-equal-groups': 'multiplication_equal_groups_rabbits',
    'multiplication-g3-n8-penguin-equal-groups': 'multiplication_equal_groups_penguins',
    'multiplication-g2-b1-vertical-1digit-no-carry': 'multiplication_vertical_1digit',
    'multiplication-g2-b2-vertical-2digit-no-carry': 'multiplication_vertical_2digit',
    'multiplication-g2-b3-vertical-2digit-carry': 'multiplication_vertical_2digit_regrouping',
    'multiplication-g3-c1-vertical-3digit-no-carry': 'multiplication_vertical_3digit',
    'multiplication-g3-c2-vertical-3digit-carry': 'multiplication_vertical_3digit_regrouping',
    'multiplication-g4-d1-vertical-4digit-no-carry': 'multiplication_vertical_4digit',
    'multiplication-g4-d2-vertical-4digit-carry': 'multiplication_vertical_4digit_regrouping',

  }
},
};

function normalizeId(value) {
  return String(value || '').trim();
}

export function getTopicCompetencyGraph(subject, topic) {
  return competencyGraphs[subject]?.[topic] || null;
}

export function resolveCompetency({ subject = 'math', topic = 'addition', skillId, templateId } = {}) {
  const graph = getTopicCompetencyGraph(subject, topic);
  if (!graph) return null;

  const normalizedSkillId = normalizeId(skillId);
  const normalizedTemplateId = normalizeId(templateId);
  const competencyId = graph.skillMap?.[normalizedSkillId]
    || graph.skillMap?.[normalizedTemplateId]
    || (topic === 'testing' ? 'interactive_tool_fluency' : null);

  const competency = graph.competencies.find((candidate) => candidate.id === competencyId) || null;
  if (!competency) return null;

  return {
    ...competency,
    subject,
    topic,
  };
}

export function getSkillCompetencyId(input) {
  return resolveCompetency(input)?.id || null;
}
