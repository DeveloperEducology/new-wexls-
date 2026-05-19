import Image from 'next/image';
import Link from 'next/link';
import { additionSkillsByGrade } from '../lib/practice/generators/math/topics/addition/skills/index.js';
import { multiplicationSkillsByGrade } from '../lib/practice/generators/math/topics/multiplication/skills/index.js';
import { unitsMeasurementSkillsByGrade } from '../lib/practice/generators/science/topics/units-measurement/skills/index.js';
import { grammarSkillsByGrade } from '../lib/practice/generators/english/topics/grammar/skills/index.js';

const additionHomeGroups = Object.entries(additionSkillsByGrade).map(([grade, skills]) => ({
  title: grade === 'remediation' ? 'Remediation skills' : `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`,
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const gradeOrdinal = (grade) => `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`;

const multiplicationHomeGroups = Object.entries(multiplicationSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const unitsMeasurementHomeGroups = Object.entries(unitsMeasurementSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const grammarHomeGroups = Object.entries(grammarSkillsByGrade).map(([grade, skills]) => ({
  title: gradeOrdinal(grade),
  skills: skills.map((skill) => [skill.code, skill.title, skill.id]),
}));

const TOPICS = [
  {
    id: 'addition',
    title: 'Addition',
    color: '#ff951f',
    subject: 'math',
    topic: 'addition',
    includes: ['Counting on', 'Make ten', 'Doubles and near doubles', 'Word problem translation', 'Regrouping'],
    groups: additionHomeGroups,
  },
  {
    id: 'subtraction',
    title: 'Subtraction',
    color: '#ef6c35',
    subject: 'math',
    topic: 'subtraction',
    includes: ['Remove cubes from a row', 'Subtraction facts up to 10', 'Model subtraction sentences'],
    groups: [
      {
        title: 'First-grade skills',
        skills: [
          ['C.1', 'Subtract with cubes up to 10', 'subtraction-g1-c1-remove-cubes-to-10'],
        ],
      },
    ],
  },

  {
    id: 'multiplication',
    title: 'Multiplication',
    color: '#ff951f',
    subject: 'math',
    topic: 'multiplication',
    includes: ['Facts to 10', 'Vertical multiplication', 'Regrouping', 'Indian number system'],
    groups: multiplicationHomeGroups,
  },

  {
    id: 'time',
    title: 'Time',
    color: '#2fbfd0',
    subject: 'math',
    topic: 'time',
    includes: ['Days of the week', 'Seasons', 'Read clocks and write times', 'Elapsed time', 'Time patterns'],
    groups: [
      {
        title: 'Calendar skills',
        skills: [
          ['T.1', 'Days of the week', 'v1_days_of_week'],
          ['T.2', 'Order days of the week', 'order_days'],
          ['T.3', 'Seasons of the year', 'v2_seasons'],
          ['T.4', 'Read a calendar', 'v3_calendar'],
          ['T.5', 'Months of the year', 'v4_months'],
          ['T.6', 'Days in each month', 'm5_days_in_month'],
        ],
      },
      {
        title: 'Clock skills',
        skills: [
          ['C.1', 'A.M. or P.M.', 'v5_am_pm'],
          ['C.2', 'Match analogue clocks and times', 'match_analog_clock_words'],
          ['C.3', 'Match digital clocks and times', 'match_digital_clock'],
          ['C.4', 'Read clocks and write times', 'o3_read_clock'],
          ['C.5', 'Elapsed time', 'o5_elapsed_time'],
          ['C.6', 'Time patterns', 'o7_time_patterns'],
        ],
      },
    ],
  },
  {
    id: 'fractions',
    title: 'Fractions',
    color: '#7a56d6',
    subject: 'math',
    topic: 'fractions',
    includes: ['Identify fractions from shapes', 'Equal parts', 'Fraction of a set', 'Remove parts from models'],
    groups: [
      {
        title: 'Visual model skills',
        skills: [
          ['F.1', 'Identify fractions from shapes', 'visual_models_identify'],
          ['F.1b', 'Write fractions from shapes', 'visual_models_write_fraction'],
          ['F.2', 'Equal parts', 'visual_models_equal_parts'],
          ['F.3', 'Fraction of a set', 'visual_models_fraction_of_set'],
          ['F.4', 'Mixed numbers from models', 'visual_models_mixed_numbers'],
          ['F.5', 'Remove parts from a circle', 'visual_models_remove_fraction_pie'],
          ['F.6', 'Remove parts from a square', 'visual_models_remove_fraction_square'],
          ['F.7', 'Remove parts from a rectangle', 'visual_models_remove_fraction_rectangle'],
          ['F.8', 'Remove parts from a fraction bar', 'visual_models_remove_fraction_bar'],
          ['F.9', 'Fill parts of a circle', 'visual_models_fill_fraction_pie'],
          ['F.10', 'Fill parts of a square', 'visual_models_fill_fraction_square'],
          ['F.11', 'Fill parts of a rectangle', 'visual_models_fill_fraction_rectangle'],
          ['F.13', 'Cut rectangle into fourths', 'visual_models_cut_rectangle_fourths'],
          ['F.14', 'Cut circle into fourths', 'visual_models_cut_circle_fourths'],
          ['F.15', 'Cut rectangle into halves in different ways', 'visual_models_cut_rectangle_halves_different'],
          ['F.16', 'Cut rectangle into thirds', 'visual_models_cut_rectangle_thirds'],
          ['F.17', 'Cut circle into thirds', 'visual_models_cut_circle_thirds'],
          ['F.18', 'Cut circle into sixths', 'visual_models_cut_circle_sixths'],
        ],
      },
      {
        title: 'Equivalence skills',
        skills: [
          ['F.12', 'Equivalent fractions on number lines', 'equivalence_number_line'],
        ],
      },
      {
        title: 'Decomposing & Unit Fractions',
        skills: [
          ['F.19', 'Decompose fractions into unit fractions', 'fractions_decompose_into_unit_fractions'],
          ['F.20', 'Decompose fractions: missing unit fraction', 'fractions_decompose_missing_unit_fraction'],
          ['F.21', 'Decompose fractions: select all sums', 'fractions_decompose_select_all_sums'],
          ['F.22', 'Build fractions from unit fraction words', 'fractions_build_from_words'],
          ['F.23', 'Decompose fractions: error analysis', 'fractions_decompose_error_analysis'],
          ['F.24', 'Count the unit fraction pieces', 'fractions_count_unit_fraction_pieces'],
          ['F.25', 'Decompose fractions: puzzle style', 'fractions_decompose_puzzle_style'],
        ],
      },
      {
        title: 'Operations skills',
        skills: [
          ['F.26', 'Add and subtract fractions with unlike denominators', 'fractions-g5-add-subtract-unlike-denominators'],
        ],
      },
    ],
  },
  {
    id: 'place-values',
    title: 'Place Values',
    color: '#4db46b',
    subject: 'math',
    topic: 'place-values',
    includes: ['Tens and ones blocks', 'Place value names', 'Expanded form', 'Word form', 'Place-value tables'],
    groups: [
      {
        title: 'First-grade skills',
        skills: [
          ['PV.1', 'Identify numbers from tens and ones blocks', 'pv-g1-blocks-units'],
          ['PV.2', 'Name the place value of a digit', 'pv-g1-place-name'],
          ['PV.3', 'Which model shows the number?', 'pv-g1-match-blocks-to-number'],
        ],
      },
      {
        title: 'Second-grade skills',
        skills: [
          ['PV.4', 'Identify hundreds, tens, and ones blocks', 'pv-g2-blocks-hundreds'],
          ['PV.5', 'Write numbers in expanded form', 'pv-g2-expanded-form'],
          ['PV.6', 'Break down numbers in a table', 'pv-g2-breakdown-table'],
        ],
      },
      {
        title: 'Third-grade skills',
        skills: [
          ['PV.7', 'Identify thousands blocks', 'pv-g3-blocks-thousands'],
          ['PV.8', 'Write word form as a number', 'pv-g3-word-to-number'],
        ],
      },
    ],
  },
  {
    id: 'social-gk',
    title: 'General Knowledge',
    color: '#3f8bd6',
    subject: 'social',
    topic: 'gk',
    includes: ['Identify famous persons', 'Personality trivia', 'Political vs sports sorting', 'True or false'],
    groups: [
      {
        title: 'People skills',
        skills: [
          ['GK.1', 'Identify famous persons', 'gk_identify_person_v1'],
          ['GK.2', 'Identify from images', 'gk_identify_image_v1'],
          ['GK.3', 'Political vs sports sorting', 'gk_sort_people_v1'],
        ],
      },
      {
        title: 'Reasoning skills',
        skills: [
          ['GK.4', 'Personality trivia', 'gk_trivia_v1'],
          ['GK.5', 'Fill in the blanks', 'gk_fill_blanks_v1'],
          ['GK.6', 'True or false', 'gk_true_false_v1'],
          ['GK.7', 'Spot the truth', 'gk_misconception_v1'],
          ['GK.8', 'Inference questions', 'gk_inference_v1'],
        ],
      },
    ],
  },
  {
    id: 'testing',
    title: 'Testing Tools',
    color: '#d64d3d',
    subject: 'math',
    topic: 'testing',
    includes: ['Interactive protractor', 'Copy drag/drop', 'Categorization', 'Number line', 'Inputs plus options'],
    groups: [
      {
        title: 'Interactive parts',
        skills: [
          ['TEST.1', 'Interactive protractor', 'testing-protractor'],
          ['TEST.2', 'Copy drag/drop', 'testing-copy-drag-drop'],
          ['TEST.3', 'Categorization', 'testing-categorization'],
        ],
      },
      {
        title: 'Visual parts',
        skills: [
          ['TEST.4', 'Number line', 'testing-number-line'],
          ['TEST.5', 'Base-ten blocks', 'testing-base-ten-blocks'],
          ['TEST.6', 'Clock', 'testing-clock'],
          ['TEST.7', 'Missing time pattern', 'testing-clock-pattern'],
          ['TEST.8', 'Fraction model', 'testing-fraction-model'],
          ['TEST.9', 'Mixed text/SVG/blank', 'testing-mixed-parts'],
        ],
      },
      {
        title: 'Composition',
        skills: [
          ['TEST.10', 'Inputs + options', 'testing-doubles-plus-one-mixed'],
        ],
      },
    ],
  },
  {
    id: 'english-grammar',
    title: 'English Grammar',
    color: '#a855f7',
    subject: 'english',
    topic: 'grammar',
    includes: ['Identify nouns', 'Pronouns & replacements', 'Action verbs & tenses', 'Articles a vs an', 'Capitalization & punctuation'],
    groups: grammarHomeGroups,
  },
  {
    id: 'units-measurement',
    title: 'Units and measurement',
    color: '#0ea5e9',
    subject: 'science',
    topic: 'units-measurement',
    includes: ['Units', 'temperature', 'measuring tools', 'metric/customary units', 'conversions'],
    groups: unitsMeasurementHomeGroups,
  },
  {
    id: 'ratio',
    title: 'Ratios',
    color: '#ea580c',
    subject: 'math',
    topic: 'ratio',
    includes: ['Simplifying ratios', 'Same-kind check', 'Antecedent & consequent', 'Ratio tables', 'Equivalent ratios', 'Word problems'],
    groups: [
      {
        title: 'Ratio concepts',
        skills: [
          ['R.1', 'Compare quantities of same kind', 'ratio_identify_from_words'],
          ['R.2', 'Compare quantities by subtraction vs division', 'ratio_subtraction_vs_division'],
          ['R.3', 'Check if comparison is same kind', 'ratio_same_kind_check'],
          ['R.4', 'Understand antecedent and consequent', 'ratio_terms_antecedent_consequent'],
          ['R.5', 'Ratio has no units', 'ratio_units_concept'],
        ],
      },
      {
        title: 'Equivalence & simplification',
        skills: [
          ['R.6', 'Simplify ratios using HCF (two terms)', 'ratio_simplify_two_terms'],
          ['R.7', 'Simplify ratios using HCF (three terms)', 'ratio_simplify_three_terms'],
          ['R.8', 'Check equivalent ratios', 'ratio_equivalent_check'],
          ['R.9', 'Find equivalent ratios', 'ratio_equivalent_find'],
          ['R.10', 'Equivalent ratios with fractions', 'ratio_fraction_to_whole'],
        ],
      },
      {
        title: 'Missing values & tables',
        skills: [
          ['R.11', 'Solve missing values in ratios', 'ratio_missing_value'],
          ['R.12', 'Complete ratio tables', 'ratio_table_completion'],
          ['R.13', 'Pattern completion in ratios', 'ratio_pattern_completion'],
          ['R.14', 'Greater ratio comparison', 'ratio_greater_comparison'],
        ],
      },
      {
        title: 'Visuals & applications',
        skills: [
          ['R.15', 'Identify ratios from visual count', 'ratio_visual_count'],
          ['R.16', 'Word problems on ratios', 'ratio_word_problem_basic'],
          ['R.17', 'Error analysis of ratio mistakes', 'ratio_error_analysis'],
          ['R.18', 'Match ratios to descriptions', 'ratio_matching'],
          ['R.19', 'Sort ratios into categories', 'ratio_sorting'],
          ['R.20', 'Misconception remediation', 'ratio_remediation'],
          ['S.1', 'Write a part-to-part ratio', 'ratio_write_part_to_part_mcq'],
          ['S.2', 'Write a ratio using a colon', 'ratio_write_colon_single_blank'],
          ['S.3', 'Write a ratio using a fraction', 'ratio_write_fraction_single_blank'],
          ['S.6', 'Which model represents the ratio?', 'ratio_which_model_represents_mcq'],
        ],
      },
    ],
  },
];

function countSkills(topic) {
  return topic.groups.reduce((total, group) => total + group.skills.length, 0);
}

function practiceHref(topic, skill) {
  return `/practice?subject=${topic.subject}&topic=${topic.topic}&skill=${skill}`;
}

function HomeHero() {
  return (
    <section className="home-hero" aria-label="WEXLS learning hero">
      <div className="home-hero-frame">
        <Image
          className="home-hero-image home-hero-image-desktop"
          src="/images/heroc.png"
          alt="Students practicing interactive math and reasoning skills"
          width={1774}
          height={887}
          priority
        />
        <Image
          className="home-hero-image home-hero-image-mobile"
          src="/images/heromobile.png"
          alt="Students practicing interactive math and reasoning skills"
          width={941}
          height={1672}
          priority
        />
      </div>
    </section>
  );
}

function TopicCatalog() {
  return (
    <main className="topic-catalog-page">
      <HomeHero />
      <section className="topic-catalog-hero">
        <p>WEXLS Practice</p>
        <h1>Choose a topic</h1>
      </section>
      <section className="topic-card-list" aria-label="Practice topics">
        {TOPICS.map((topic) => (
          <article className="topic-row-card" key={topic.id} style={{ '--topic-color': topic.color }}>
            <div className="topic-color-bar" />
            <div className="topic-row-copy">
              <h2>{topic.title}</h2>
              <p>
                <span>Includes:</span>{' '}
                {topic.includes.map((item, index) => (
                  <span key={item}>
                    {index > 0 ? <b aria-hidden="true"> | </b> : null}
                    {item}
                  </span>
                ))}
              </p>
            </div>
            <Link className="topic-row-button" href={`/?topic=${topic.id}`} style={{ background: topic.color }}>
              See all {countSkills(topic)} skills ›
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function TopicSkillsPage({ selectedTopic }) {
  const selected = TOPICS.find((topic) => topic.id === selectedTopic) || TOPICS[0];

  return (
    <main className="topic-detail-page">
      <aside className="topic-side-nav" aria-label="Topic navigation">
        {TOPICS.map((topic) => (
          <Link
            key={topic.id}
            href={`/?topic=${topic.id}`}
            className={`topic-side-link ${topic.id === selected.id ? 'active' : ''}`}
            style={{ '--topic-color': topic.color }}
          >
            <span />
            {topic.title}
          </Link>
        ))}
      </aside>

      <section className="topic-skill-content" style={{ '--topic-color': selected.color }}>
        <Link className="back-to-topics" href="/">‹ All topics</Link>
        <h1>{selected.title}</h1>
        <p className="topic-skill-intro">
          Here is a list of skills for {selected.title.toLowerCase()}. Skills are organized by level, and each link opens in the shared adaptive practice shell.
        </p>
        <div className="skill-columns">
          {selected.groups.map((group) => (
            <section key={group.title} className="skill-column">
              <h2>{group.title}</h2>
              <ol>
                {group.skills.map(([code, name, skill]) => (
                  <li key={skill}>
                    <span>{code}</span>
                    <Link href={practiceHref(selected, skill)}>{name}</Link>
                    <small aria-hidden="true"> ✎ ⊙</small>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      </section>
    </main>
  );
}

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const selectedTopic = params?.topic;

  if (selectedTopic) {
    return <TopicSkillsPage selectedTopic={selectedTopic} />;
  }

  return <TopicCatalog />;
}
