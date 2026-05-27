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
          id: 'addition_models_to_5',
          title: 'Represent addition with models within 5',
          prerequisites: ['count_objects'],
          remediation: ['count_objects'],
        },
        {
          id: 'addition_models_to_10',
          title: 'Represent addition with models within 10',
          prerequisites: ['count_objects', 'addition_models_to_5'],
          remediation: ['count_objects', 'addition_models_to_5'],
        },
        {
          id: 'addition_models_to_20',
          title: 'Represent addition with models within 20',
          prerequisites: ['addition_models_to_10'],
          remediation: ['addition_models_to_10'],
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
        'addition-g1-cube-build-to-5': 'addition_models_to_5',
        'addition-g1-cube-build-to-10': 'addition_models_to_10',
        'addition-g1-cube-build-to-20': 'addition_models_to_20',
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
          id: 'subtraction_models_to_20',
          title: 'Represent subtraction with models within 20',
          prerequisites: ['subtraction_models_to_10'],
          remediation: ['subtraction_models_to_10'],
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
        {
          id: 'subtraction_visual_to_5',
          title: 'Subtract with cubes up to 5',
          prerequisites: [],
          remediation: []
        },
        {
          id: 'subtraction_visual_to_10',
          title: 'Subtract with cubes up to 10',
          prerequisites: ['subtraction_visual_to_5'],
          remediation: ['subtraction_visual_to_5']
        },
        {
          id: 'subtraction_pictures_to_5',
          title: 'Write subtraction sentence for pictures up to 5',
          prerequisites: ['subtraction_visual_to_5'],
          remediation: ['subtraction_visual_to_5']
        },
        {
          id: 'subtraction_facts_to_10',
          title: 'Subtract basic facts up to 10',
          prerequisites: ['subtraction_visual_to_10'],
          remediation: ['subtraction_visual_to_10']
        },
        {
          id: 'two_digit_subtraction_no_regrouping',
          title: 'Subtract two-digit numbers vertically without regrouping',
          prerequisites: ['subtraction_facts_to_10'],
          remediation: ['subtraction_facts_to_10']
        },
        {
          id: 'two_digit_subtraction_with_regrouping',
          title: 'Subtract two-digit numbers vertically with regrouping',
          prerequisites: ['two_digit_subtraction_no_regrouping'],
          remediation: ['two_digit_subtraction_no_regrouping']
        },
        {
          id: 'mental_subtraction_strategies',
          title: 'Mental subtraction strategies - up to 100',
          prerequisites: ['subtraction_facts_to_10'],
          remediation: ['subtraction_facts_to_10']
        },
        {
          id: 'unknown_minuend_to_20',
          title: 'Find the missing number in subtraction equations up to 20',
          prerequisites: ['subtraction_facts_to_10'],
          remediation: ['subtraction_facts_to_10']
        },
        {
          id: 'subtraction_word_problems',
          title: 'Subtraction word problems up to 100',
          prerequisites: ['two_digit_subtraction_no_regrouping'],
          remediation: ['two_digit_subtraction_no_regrouping']
        },
        {
          id: 'three_digit_subtraction_no_regrouping',
          title: 'Subtract three-digit numbers vertically without regrouping',
          prerequisites: ['two_digit_subtraction_no_regrouping'],
          remediation: ['two_digit_subtraction_no_regrouping']
        },
        {
          id: 'three_digit_subtraction_with_regrouping',
          title: 'Subtract three-digit numbers vertically with regrouping',
          prerequisites: ['three_digit_subtraction_no_regrouping'],
          remediation: ['three_digit_subtraction_no_regrouping']
        },
        {
          id: 'three_digit_mental_subtraction',
          title: 'Mental subtraction strategies - up to 1000',
          prerequisites: ['mental_subtraction_strategies'],
          remediation: ['mental_subtraction_strategies']
        },
        {
          id: 'three_digit_subtraction_word_problems',
          title: 'Subtraction word problems up to 1000',
          prerequisites: ['subtraction_word_problems'],
          remediation: ['subtraction_word_problems']
        },
        {
          id: 'four_digit_subtraction_no_regrouping',
          title: 'Subtract multi-digit numbers vertically without regrouping',
          prerequisites: ['three_digit_subtraction_no_regrouping'],
          remediation: ['three_digit_subtraction_no_regrouping']
        },
        {
          id: 'four_digit_subtraction_with_regrouping',
          title: 'Subtract multi-digit numbers vertically with regrouping',
          prerequisites: ['four_digit_subtraction_no_regrouping'],
          remediation: ['four_digit_subtraction_no_regrouping']
        },
        {
          id: 'four_digit_mental_subtraction',
          title: 'Mental subtraction strategies - up to 10000',
          prerequisites: ['three_digit_mental_subtraction'],
          remediation: ['three_digit_mental_subtraction']
        }
      ],
      skillMap: {
        'subtraction-g1-c1-remove-cubes-to-10': 'subtraction_models_to_10',
        'subtraction-g1-c2-remove-cubes-to-20': 'subtraction_models_to_20',
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
        'subtraction-remedial-take-away-to-5': 'subtraction_visual_to_5',
        'subtraction-remedial-take-away-to-10': 'subtraction_visual_to_10',
        'subtraction-remedial-picture-sentence-5': 'subtraction_pictures_to_5',
        'subtraction-remedial-facts-to-10': 'subtraction_facts_to_10',
        'subtraction-g2-b1-vertical-10-99': 'two_digit_subtraction_no_regrouping',
        'subtraction-g2-b2-vertical-regrouping': 'two_digit_subtraction_with_regrouping',
        'subtraction-g2-mental-to-100': 'mental_subtraction_strategies',
        'subtraction-g2-missing-number-to-20': 'unknown_minuend_to_20',
        'subtraction-g2-word-problems-to-100': 'subtraction_word_problems',
        'subtraction-g3-b1-vertical-100-999': 'three_digit_subtraction_no_regrouping',
        'subtraction-g3-b2-vertical-regrouping': 'three_digit_subtraction_with_regrouping',
        'subtraction-g3-mental-to-1000': 'three_digit_mental_subtraction',
        'subtraction-g3-word-problems-to-1000': 'three_digit_subtraction_word_problems',
        'subtraction-g4-b1-vertical-1000-9999': 'four_digit_subtraction_no_regrouping',
        'subtraction-g4-b2-vertical-regrouping': 'four_digit_subtraction_with_regrouping',
        'subtraction-g4-mental-to-10000': 'four_digit_mental_subtraction',
      },
    },
    fractions: {
      competencies: [
        {
          id: 'equal_parts',
          title: 'Identify equal parts',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'identify_half',
          title: 'Identify halves',
          prerequisites: ['equal_parts'],
          remediation: ['equal_parts'],
        },
        {
          id: 'identify_quarter',
          title: 'Identify quarters',
          prerequisites: ['equal_parts'],
          remediation: ['equal_parts'],
        },
        {
          id: 'number_line_half',
          title: 'Represent half on a number line',
          prerequisites: ['identify_half'],
          remediation: ['identify_half'],
        },
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
        },
        {
          id: 'fraction_decompositions',
          title: 'Decompose fractions into sums of unit fractions',
          prerequisites: ['fraction_visual_models'],
          remediation: ['fraction_visual_models'],
        },
        {
          id: 'fraction_unlike_denominators',
          title: 'Add and subtract fractions with unlike denominators',
          prerequisites: ['fraction_visual_models'],
          remediation: ['fraction_visual_models'],
        }
      ],
      skillMap: {
        'fractions-remedial-equal-parts': 'equal_parts',
        'fractions-remedial-identify-half': 'identify_half',
        'fractions-remedial-identify-quarter': 'identify_quarter',
        'fractions-remedial-number-line-half': 'number_line_half',
        'fractions-g2-identify-visual': 'fraction_visual_models',
        'fractions-g3-types': 'fraction_visual_models',
        'fractions-g3-like-unlike': 'fraction_equivalence',
        visual_models_identify: 'fraction_visual_models',
        visual_models_write_fraction: 'fraction_visual_models',
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
        visual_models_cut_rectangle_thirds: 'fraction_visual_models',
        visual_models_cut_circle_thirds: 'fraction_visual_models',
        visual_models_cut_circle_sixths: 'fraction_visual_models',
        equivalence_number_line: 'fraction_equivalence',
        fractions_decompose_into_unit_fractions: 'fraction_decompositions',
        fractions_decompose_missing_unit_fraction: 'fraction_decompositions',
        fractions_decompose_select_all_sums: 'fraction_decompositions',
        fractions_build_from_words: 'fraction_decompositions',
        fractions_decompose_error_analysis: 'fraction_decompositions',
        fractions_count_unit_fraction_pieces: 'fraction_decompositions',
        fractions_decompose_puzzle_style: 'fraction_decompositions',
        'fractions-g5-add-subtract-unlike-denominators': 'fraction_unlike_denominators',
        'fractions.unlikeDenominators.addSubtract': 'fraction_unlike_denominators',
        'fractions-g5-convert-improper-to-mixed': 'fraction_visual_models',
        'fractions-g5-convert-mixed-to-improper': 'fraction_visual_models',
        'fractions-g5-compare-like-fractions': 'fraction_equivalence',
        'fractions-g5-compare-unlike-fractions': 'fraction_equivalence',
        'fractions-g5-compare-proper-fractions': 'fraction_equivalence',
        'fractions-g5-add-like-fractions': 'fraction_visual_models',
        'fractions-g5-add-improper-fractions': 'fraction_visual_models',
        'fractions-g5-add-fraction-and-integer': 'fraction_visual_models',
        'fractions-g5-missing-fraction-addend': 'fraction_visual_models',
        'fractions-g5-missing-integer-addend': 'fraction_visual_models',
        'fractions-g5-add-multiple-fractions': 'fraction_visual_models',
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
        'time-remedial-days-of-week': 'calendar_sequence',
        'time-remedial-am-pm': 'clock_reading',
        'time-remedial-read-hour': 'clock_reading',
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
        {
          id: 'indian_number_system',
          title: 'Read and structure large numbers in the Indian number system',
          prerequisites: ['place_value_forms'],
          remediation: ['place_value_forms'],
        },
        {
          id: 'international_number_system',
          title: 'Read and structure large numbers in the international number system',
          prerequisites: ['indian_number_system'],
          remediation: ['indian_number_system'],
        },
        {
          id: 'large_number_magnitude',
          title: 'Compare, order, and reason about large-number magnitude',
          prerequisites: ['place_value_forms', 'indian_number_system'],
          remediation: ['place_value_forms'],
        },
        {
          id: 'rounding_estimation',
          title: 'Round and estimate large numbers using benchmarks',
          prerequisites: ['large_number_magnitude'],
          remediation: ['large_number_magnitude'],
        },
        {
          id: 'flexible_decomposition',
          title: 'Compose and decompose numbers flexibly by place value',
          prerequisites: ['place_value_forms'],
          remediation: ['place_value_tens_ones', 'place_value_forms'],
        },
        {
          id: 'shortcut_scaling',
          title: 'Scale numbers by 10, 100, and 1,000',
          prerequisites: ['place_value_forms'],
          remediation: ['place_value_forms'],
        },
      ],
      skillMap: {
        'pv-remedial-tens-ones-to-20': 'place_value_tens_ones',
        'pv-remedial-count-tens-to-100': 'place_value_tens_ones',
        'pv-g1-blocks-units': 'place_value_tens_ones',
        'pv-g1-place-name': 'place_value_tens_ones',
        'pv-g1-match-blocks-to-number': 'place_value_tens_ones',
        'pv-g2-blocks-hundreds': 'place_value_hundreds_thousands',
        'pv-g2-expanded-form': 'place_value_forms',
        'pv-g2-breakdown-table': 'place_value_forms',
        'pv-g3-blocks-thousands': 'place_value_hundreds_thousands',
        'pv-g3-word-to-number': 'place_value_forms',
        'pv-g4-indian-comma-placement': 'indian_number_system',
        'pv-g4-place-value-chart-large': 'indian_number_system',
        'pv-g4-expanded-form-large': 'place_value_forms',
        'pv-g4-compare-large-numbers': 'large_number_magnitude',
        'pv-g4-order-large-numbers': 'large_number_magnitude',
        'pv-g5-round-nearest-thousand': 'rounding_estimation',
        'pv-g5-round-nearest-lakh': 'rounding_estimation',
        'pv-g5-button-machine-decomposition': 'flexible_decomposition',
        'pv-g5-number-magnitude-benchmarks': 'large_number_magnitude',
        'pv-g5-shortcut-multiply-10-100-1000': 'shortcut_scaling',
        'pv-g6-international-comma-placement': 'international_number_system',
        'pv-g6-indian-international-compare': 'international_number_system',
        'pv-g6-large-number-system-conversion': 'indian_number_system',
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
    lkg: {
      competencies: [
        {
          id: 'lkg_counting_5',
          title: 'Learn to count - up to 5',
          prerequisites: [],
          remediation: [],
        },
      ],
      skillMap: {
        'lkg_counting_5': 'lkg_counting_5',
        'lkg.count.objects_up_to_5': 'lkg_counting_5',
      },
    },
    'data-graphs': {
      competencies: [
        {
          id: 'data_graphs_count_objects',
          title: 'Count objects to collect data',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'data_graphs_tally_5',
          title: 'Read tally marks up to 5',
          prerequisites: ['data_graphs_count_objects'],
          remediation: ['data_graphs_count_objects'],
        },
        {
          id: 'data_graphs_read_pictograph',
          title: 'Read simple or scaled pictographs',
          prerequisites: ['data_graphs_tally_5'],
          remediation: ['data_graphs_tally_5'],
        },
        {
          id: 'data_graphs_tally_chart',
          title: 'Read and interpret tally charts',
          prerequisites: ['data_graphs_tally_5'],
          remediation: ['data_graphs_tally_5'],
        },
        {
          id: 'data_graphs_scaled_bar',
          title: 'Count, compare, and find least in bar graphs',
          prerequisites: ['data_graphs_read_pictograph'],
          remediation: ['data_graphs_read_pictograph'],
        },
        {
          id: 'data_graphs_line_plot',
          title: 'Interpret line plots with fractions',
          prerequisites: ['data_graphs_scaled_bar'],
          remediation: ['data_graphs_scaled_bar'],
        },
      ],
      skillMap: {
        'data-graphs-remedial-count-objects': 'data_graphs_count_objects',
        'data-graphs-remedial-tally-read-5': 'data_graphs_tally_5',
        'data-graphs-g1-read-picture-graph': 'data_graphs_read_pictograph',
        'data-graphs-g1-read-pictograph': 'data_graphs_read_pictograph',
        'data-graphs-g1-compare-bar-graph': 'data_graphs_scaled_bar',
        'data-graphs-g1-count-bar-graph': 'data_graphs_scaled_bar',
        'data-graphs-g1-find-least-bar-graph': 'data_graphs_scaled_bar',
        'data-graphs-g2-scaled-bar-graph': 'data_graphs_scaled_bar',
        'data-graphs-g2-scaled-pictograph': 'data_graphs_read_pictograph',
        'data-graphs-g2-read-tally-chart': 'data_graphs_tally_chart',
        'data-graphs-g3-line-plot': 'data_graphs_line_plot',
      },
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
    'solar-system': {
      competencies: [
        {
          id: 'planet_identification',
          title: 'Identify planets in the solar system',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'height_comparison',
          title: 'Measure and compare character heights',
          prerequisites: [],
          remediation: [],
        },
      ],
      skillMap: {
        'science-g3-solar-system-planets-hotspot': 'planet_identification',
        'science-g3-solar-system-height-measure': 'height_comparison',
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
      },
      {
        id: 'multiplication_visual_equal_groups_to_5',
        title: 'Describe equal groups up to 5',
        prerequisites: ['count_objects'],
        remediation: ['count_objects']
      },
      {
        id: 'multiplication_skip_counting_2s',
        title: 'Multiply by 2',
        prerequisites: ['skip_counting'],
        remediation: ['repeated_addition']
      },
      {
        id: 'multiplication_skip_counting_5s',
        title: 'Multiply by 5',
        prerequisites: ['skip_counting'],
        remediation: ['repeated_addition']
      },
      {
        id: 'multiplication_skip_counting_10s',
        title: 'Multiply by 10',
        prerequisites: ['skip_counting'],
        remediation: ['repeated_addition']
      },
      {
        id: 'multiplication_repeated_addition_cubes',
        title: 'Understand multiplication as repeated addition with cubes',
        prerequisites: ['multiplication_equal_groups'],
        remediation: ['multiplication_equal_groups']
      },
      {
        id: 'multiplication_arrays_cubes',
        title: 'Represent multiplication arrays with cubes',
        prerequisites: ['multiplication_repeated_addition_cubes'],
        remediation: ['multiplication_repeated_addition_cubes']
      },
      {
        id: 'multiplication_area_modeling_cubes',
        title: 'Area modeling using cubes',
        prerequisites: ['multiplication_arrays_cubes'],
        remediation: ['multiplication_arrays_cubes']
      },
      {
        id: 'multiplication_distributive_property_cubes',
        title: 'Represent distributive property of multiplication with cubes',
        prerequisites: ['multiplication_area_modeling_cubes'],
        remediation: ['multiplication_area_modeling_cubes']
      },
      {
        id: 'multiplication_area_grid_rectangle_cubes',
        title: 'Count squares in a rectangle grid to model multiplication',
        prerequisites: ['multiplication_arrays_cubes'],
        remediation: ['multiplication_arrays_cubes']
      },
      {
        id: 'multiplication_fill_grid_cubes',
        title: 'Fill a rectangle grid with cubes to model multiplication',
        prerequisites: ['multiplication_area_grid_rectangle_cubes'],
        remediation: ['multiplication_area_grid_rectangle_cubes']
      },
      {
        id: 'multiplication_skip_counting_number_line',
        title: 'Skip counting on a number line',
        prerequisites: ['multiplication_repeated_addition_cubes'],
        remediation: ['multiplication_repeated_addition_cubes']
      },
      {
        id: 'multiplication_number_line_equations',
        title: 'Write multiplication equations from number line visual representations',
        prerequisites: ['multiplication_skip_counting_number_line'],
        remediation: ['multiplication_skip_counting_number_line']
      },
      {
        id: 'multiplication_repeated_addition_towers',
        title: 'Understand multiplication as repeated addition with towers of cubes',
        prerequisites: ['multiplication_repeated_addition_cubes'],
        remediation: ['multiplication_repeated_addition_cubes']
      },
      {
        id: 'multiplication_dot_array_modeling',
        title: 'Model multiplication using dot arrays',
        prerequisites: ['multiplication_arrays_cubes'],
        remediation: ['multiplication_arrays_cubes']
      },
      {
        id: 'multiplication_bar_model_total',
        title: 'Use bar models to find the total product',
        prerequisites: ['multiplication_repeated_addition_cubes'],
        remediation: ['multiplication_repeated_addition_cubes']
      },
      {
        id: 'multiplication_bar_model_value',
        title: 'Use bar models to find the value of individual parts',
        prerequisites: ['multiplication_bar_model_total'],
        remediation: ['multiplication_bar_model_total']
      },
      {
        id: 'multiplication_bar_model_comparison_large',
        title: 'Use bar models to solve multiplicative comparison problems for the larger value',
        prerequisites: ['multiplication_bar_model_total'],
        remediation: ['multiplication_bar_model_total']
      },
      {
        id: 'multiplication_bar_model_comparison_small',
        title: 'Use bar models to solve multiplicative comparison problems for the base value',
        prerequisites: ['multiplication_bar_model_value', 'multiplication_bar_model_comparison_large'],
        remediation: ['multiplication_bar_model_value']
      },
      {
        id: 'multiplication_function_machine_output',
        title: 'Find the output value of a multiplication function machine',
        prerequisites: ['multiplication_facts_to_10'],
        remediation: ['multiplication_facts_to_10']
      },
      {
        id: 'multiplication_function_machine_input',
        title: 'Find the input value of a multiplication function machine',
        prerequisites: ['multiplication_function_machine_output'],
        remediation: ['multiplication_function_machine_output']
      },
      {
        id: 'multiplication_function_machine_rule',
        title: 'Find the multiplying rule of a function machine',
        prerequisites: ['multiplication_function_machine_output'],
        remediation: ['multiplication_function_machine_output']
      }
    ],
    skillMap: {
      'multiplication-remedial-equal-groups-to-5': 'multiplication_visual_equal_groups_to_5',
      'multiplication-remedial-facts-to-5': 'multiplication_facts_to_5',
      'multiplication-remedial-skip-counting-2s': 'multiplication_skip_counting_2s',
      'multiplication-remedial-skip-counting-5s': 'multiplication_skip_counting_5s',
      'multiplication-remedial-skip-counting-10s': 'multiplication_skip_counting_10s',
      'multiplication-g2-a1-facts-to-5': 'multiplication_facts_to_5',
      'multiplication-g2-a2-facts-to-10': 'multiplication_facts_to_10',
      'multiplication-g2-n1-describe-equal-groups': 'multiplication_equal_groups',
      'multiplication-g2-n2-repeated-addition-cubes': 'multiplication_repeated_addition_cubes',
      'multiplication-g2-n3-array-grid-cubes': 'multiplication_arrays_cubes',
      'multiplication-g2-n4-expression-equal-groups': 'multiplication_equal_groups_expressions',
      'multiplication-g3-n5-write-sentence-equal-groups': 'multiplication_equal_groups_sentences',
      'multiplication-g3-n6-relate-addition-multiplication-equal-groups': 'multiplication_repeated_addition',
      'multiplication-g3-n7-rabbit-equal-groups': 'multiplication_equal_groups_rabbits',
      'multiplication-g3-n8-penguin-equal-groups': 'multiplication_equal_groups_penguins',
      'multiplication-g3-n9-area-model-cubes': 'multiplication_area_modeling_cubes',
      'multiplication-g3-n10-distributive-property-cubes': 'multiplication_distributive_property_cubes',
      'multiplication-g3-n11-area-grid-rectangle-cubes': 'multiplication_area_grid_rectangle_cubes',
      'multiplication-g3-n12-fill-grid-cubes': 'multiplication_fill_grid_cubes',
      'multiplication-g2-n5-skip-counting-number-line': 'multiplication_skip_counting_number_line',
      'multiplication-g3-n13-number-line-equations': 'multiplication_number_line_equations',
      'multiplication-g2-b1-vertical-1digit-no-carry': 'multiplication_vertical_1digit',
      'multiplication-g2-b2-vertical-2digit-no-carry': 'multiplication_vertical_2digit',
      'multiplication-g2-b3-vertical-2digit-carry': 'multiplication_vertical_2digit_regrouping',
      'multiplication-g3-c1-vertical-3digit-no-carry': 'multiplication_vertical_3digit',
      'multiplication-g3-c2-vertical-3digit-carry': 'multiplication_vertical_3digit_regrouping',
      'multiplication-g4-d1-vertical-4digit-no-carry': 'multiplication_vertical_4digit',
      'multiplication-g4-d2-vertical-4digit-carry': 'multiplication_vertical_4digit_regrouping',
      'multiplication-g2-n6-repeated-addition-tower': 'multiplication_repeated_addition_towers',
      'multiplication-g3-n14-dot-array-modeling': 'multiplication_dot_array_modeling',
      'multiplication-g4-n3-bar-model-total': 'multiplication_bar_model_total',
      'multiplication-g4-n4-bar-model-value': 'multiplication_bar_model_value',
      'multiplication-g4-n5-bar-model-comparison-large': 'multiplication_bar_model_comparison_large',
      'multiplication-g4-n6-bar-model-comparison-small': 'multiplication_bar_model_comparison_small',
      'multiplication-g4-f1-function-machine-output': 'multiplication_function_machine_output',
      'multiplication-g4-f2-function-machine-input': 'multiplication_function_machine_input',
      'multiplication-g4-f3-function-machine-rule': 'multiplication_function_machine_rule',
    },
  },
  shapes: {
    competencies: [
      {
        id: 'shapes_remedial_match',
        title: 'Match basic shapes (circle, triangle, square)',
        prerequisites: [],
        remediation: [],
      },
      {
        id: 'shapes_remedial_sides',
        title: 'Count sides of simple shapes',
        prerequisites: ['shapes_remedial_match'],
        remediation: ['shapes_remedial_match'],
      },
      {
        id: 'identify_shapes_visual',
         title: 'Identify shapes by their visual appearance or name',
         prerequisites: ['shapes_remedial_sides'],
         remediation: ['shapes_remedial_sides'],
      },
      {
        id: 'shapes_2d_vs_3d',
        title: 'Identify 2D vs 3D shapes',
        prerequisites: ['identify_shapes_visual'],
        remediation: ['identify_shapes_visual'],
      },
      {
        id: 'shapes_3d_properties',
        title: 'Count vertices, edges, and faces of 3D shapes',
        prerequisites: ['shapes_2d_vs_3d'],
        remediation: ['shapes_2d_vs_3d'],
      },
      {
        id: 'shapes_quadrilaterals',
        title: 'Classify quadrilaterals by properties',
        prerequisites: ['identify_shapes_visual'],
        remediation: ['identify_shapes_visual'],
      },
      {
        id: 'shapes_symmetry_check',
        title: 'Identify lines of symmetry',
        prerequisites: ['identify_shapes_visual'],
        remediation: ['identify_shapes_visual'],
      },
      {
        id: 'shapes_symmetry_lines',
        title: 'Count lines of symmetry',
        prerequisites: ['shapes_symmetry_check'],
        remediation: ['shapes_symmetry_check'],
      },
    ],
    skillMap: {
      'shapes-remedial-match-basic': 'shapes_remedial_match',
      'shapes-remedial-count-sides': 'shapes_remedial_sides',
      'shapes-g1-identify-visual-text-opts': 'identify_shapes_visual',
      'shapes-g1-identify-name-visual-opts': 'identify_shapes_visual',
      'shapes-g2-2d-vs-3d': 'shapes_2d_vs_3d',
      'shapes-g2-vertices-edges-faces': 'shapes_3d_properties',
      'shapes-g3-quadrilaterals': 'shapes_quadrilaterals',
      'shapes-g3-symmetry-check': 'shapes_symmetry_check',
      'shapes-g3-symmetry-lines': 'shapes_symmetry_lines',
    },
  },
  division: {
    competencies: [
      {
        id: 'division_sharing',
        title: 'Equal sharing up to 10',
        prerequisites: ['count_objects'],
        remediation: ['count_objects']
      },
      {
        id: 'division_grouping',
        title: 'Equal grouping up to 20',
        prerequisites: ['division_sharing'],
        remediation: ['division_sharing']
      },
      {
        id: 'division_facts_to_5',
        title: 'Division facts up to 5',
        prerequisites: ['division_grouping'],
        remediation: ['division_grouping']
      },
      {
        id: 'division_facts_to_12',
        title: 'Division facts up to 12',
        prerequisites: ['division_facts_to_5'],
        remediation: ['division_facts_to_5']
      },
      {
        id: 'division_word_problems_to_50',
        title: 'Division word problems up to 50',
        prerequisites: ['division_facts_to_12'],
        remediation: ['division_facts_to_12']
      },
      {
        id: 'division_long_div_2d',
        title: 'Divide 2-digit numbers by 1-digit numbers',
        prerequisites: ['division_facts_to_12'],
        remediation: ['division_facts_to_12']
      },
      {
        id: 'division_remainders',
        title: 'Divide 2-digit numbers by 1-digit numbers with remainders',
        prerequisites: ['division_long_div_2d'],
        remediation: ['division_long_div_2d']
      },
      {
        id: 'division_long_div_3d',
        title: 'Divide 3-digit numbers by 1-digit numbers',
        prerequisites: ['division_long_div_2d'],
        remediation: ['division_long_div_2d']
      },
      {
        id: 'division_word_problems_large',
        title: 'Division word problems with larger numbers',
        prerequisites: ['division_long_div_2d'],
        remediation: ['division_long_div_2d']
      },
      {
        id: 'division_2digit_divisor',
        title: 'Divide multi-digit numbers by 2-digit numbers',
        prerequisites: ['division_long_div_3d'],
        remediation: ['division_long_div_3d']
      }
    ],
    skillMap: {
      'division-remedial-sharing-to-10': 'division_sharing',
      'division-remedial-grouping-to-20': 'division_grouping',
      'division-remedial-facts-to-5': 'division_facts_to_5',
      'division-g3-a1-facts-to-12': 'division_facts_to_12',
      'division-g3-a2-facts-to-50': 'division_facts_to_12',
      'division-g3-a3-word-problems-to-50': 'division_word_problems_to_50',
      'division-g4-b1-long-div-2digit': 'division_long_div_2d',
      'division-g4-b2-long-div-remainder': 'division_remainders',
      'division-g4-b3-long-div-3digit': 'division_long_div_3d',
      'division-g4-b4-word-problems': 'division_word_problems_large',
      'division-g5-c1-divide-by-2digit': 'division_2digit_divisor'
    }
  },
  english: {
    grammar: {
      competencies: [
        {
          id: 'grammar_nouns',
          title: 'Understand nouns: identification and classification',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'grammar_pronouns',
          title: 'Understand pronouns: personal pronouns and noun replacement',
          prerequisites: ['grammar_nouns'],
          remediation: ['grammar_nouns'],
        },
        {
          id: 'grammar_verbs',
          title: 'Understand action verbs and past/present tenses',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'grammar_adjectives',
          title: 'Understand describing words (adjectives)',
          prerequisites: ['grammar_nouns'],
          remediation: ['grammar_nouns'],
        },
        {
          id: 'grammar_articles',
          title: 'Use articles correctly: "a" and "an"',
          prerequisites: [],
          remediation: [],
        },
        {
          id: 'grammar_sentences',
          title: 'Sentence construction: types, punctuation, and capitalization',
          prerequisites: ['grammar_nouns', 'grammar_verbs'],
          remediation: ['grammar_verbs'],
        }
      ],
      skillMap: {
        'english-g1-n1-identify-nouns': 'grammar_nouns',
        'english-g1-n2-classify-nouns': 'grammar_nouns',
        'english-g1-n3-sort-nouns': 'grammar_nouns',
        'english-g1-p1-choose-pronoun': 'grammar_pronouns',
        'english-g1-p2-replace-pronoun': 'grammar_pronouns',
        'english-g1-a1-choose-article': 'grammar_articles',
        'english-g2-v1-identify-verbs': 'grammar_verbs',
        'english-g2-v2-tense-verbs': 'grammar_verbs',
        'english-g2-adj1-identify-adjectives': 'grammar_adjectives',
        'english-g2-a2-sentence-article': 'grammar_articles',
        'english-g3-s1-sentence-type': 'grammar_sentences',
        'english-g3-s2-sentence-punctuation': 'grammar_sentences',
        'english-g3-s3-sentence-capitalization': 'grammar_sentences'
      }
    },
    lkg: {
      competencies: [
        {
          id: 'lkg_english_basics',
          title: 'Learn the basics of English beginning sounds and categories',
          prerequisites: [],
          remediation: [],
        }
      ],
      skillMap: {
        'lkg-english-beginning-sounds': 'lkg_english_basics',
        'lkg-english-identify-category': 'lkg_english_basics',
        'lkg-english-letter-recognition-uppercase': 'lkg_english_basics',
        'lkg-english-letter-recognition-lowercase': 'lkg_english_basics',
        'lkg-english-letter-recognition-case-match': 'lkg_english_basics',
        'lkg-english-letter-recognition-phonics-sound': 'lkg_english_basics',
        'lkg-english-letter-recognition-alphabetical-sequence': 'lkg_english_basics',
        'lkg-english-letter-recognition-odd-one-out': 'lkg_english_basics'
      }
    }
  }
};

function normalizeId(value) {
  return String(value || '').trim();
}

export function getTopicCompetencyGraph(subject, topic) {
  return competencyGraphs[subject]?.[topic] || competencyGraphs[topic] || null;
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

export function getNextUnlockingSkills(subject = 'math', topic = 'addition', currentSkillId) {
  const graph = getTopicCompetencyGraph(subject, topic);
  if (!graph) return [];

  const currentCompId = graph.skillMap?.[currentSkillId];
  if (!currentCompId) return [];

  const skillIds = Object.keys(graph.skillMap);
  const currentSkillIndex = skillIds.indexOf(currentSkillId);

  // 1. Same-competency progression: if there are other skills in this competency after the current one, return it
  const sameCompSkills = skillIds.filter((id, idx) => graph.skillMap[id] === currentCompId && idx > currentSkillIndex);
  if (sameCompSkills.length > 0) {
    return [sameCompSkills[0]];
  }

  // 2. Cross-competency progression: find competencies that have currentCompId in their prerequisites
  const unlockedComps = graph.competencies.filter((comp) => comp.prerequisites?.includes(currentCompId));
  const unlockedCompIds = unlockedComps.map((c) => c.id);

  // Return any skills mapped to those unlocked child competencies
  const unlockedSkills = skillIds.filter((id) => unlockedCompIds.includes(graph.skillMap[id]));
  return unlockedSkills;
}

export function getPrerequisiteFallback(subject = 'math', topic = 'addition', currentSkillId) {
  const graph = getTopicCompetencyGraph(subject, topic);
  if (!graph) return null;

  const currentCompId = graph.skillMap?.[currentSkillId];
  if (!currentCompId) return null;

  const currentComp = graph.competencies.find((c) => c.id === currentCompId);
  if (!currentComp) return null;

  // Use direct remediation competency if listed, otherwise direct prerequisite competency
  const fallbackCompId = (currentComp.remediation && currentComp.remediation[0]) || (currentComp.prerequisites && currentComp.prerequisites[0]);
  if (!fallbackCompId) return null;

  // Return the first skill mapped to that fallback competency
  const fallbackSkillId = Object.keys(graph.skillMap).find((id) => graph.skillMap[id] === fallbackCompId);
  return fallbackSkillId || null;
}
