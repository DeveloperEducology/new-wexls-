import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

// Complete list of skills to scrape
const SKILLS_TO_SCRAPE = [
  { code: 'A.1', url: 'https://in.ixl.com/maths/class-i/counting-review-up-to-10', name: 'Counting review - up to 10' },
  { code: 'A.2', url: 'https://in.ixl.com/maths/class-i/count-to-fill-a-ten-frame', name: 'Count to fill a ten frame' },
  { code: 'A.3', url: 'https://in.ixl.com/maths/class-i/counting-review-up-to-20', name: 'Counting review - up to 20' },
  { code: 'A.4', url: 'https://in.ixl.com/maths/class-i/counting-tens-and-ones-up-to-30', name: 'Counting tens and ones - up to 30' },
  { code: 'A.5', url: 'https://in.ixl.com/maths/class-i/count-on-ten-frames-up-to-40', name: 'Count on ten frames - up to 40' },
  { code: 'A.6', url: 'https://in.ixl.com/maths/class-i/counting-up-to-100', name: 'Counting - up to 100' },
  { code: 'A.7', url: 'https://in.ixl.com/maths/class-i/counting-tens-and-ones-up-to-99', name: 'Counting tens and ones - up to 99' },
  { code: 'A.8', url: 'https://in.ixl.com/maths/class-i/counting-by-twos-fives-and-tens-with-pictures', name: 'Counting by twos, fives and tens with pictures' },
  { code: 'A.9', url: 'https://in.ixl.com/maths/class-i/counting-by-twos-fives-and-tens', name: 'Counting by twos, fives and tens' },
  { code: 'A.10', url: 'https://in.ixl.com/maths/class-i/counting-forward-and-backward', name: 'Counting forward and backward' },
  { code: 'A.11', url: 'https://in.ixl.com/maths/class-i/number-lines-up-to-100', name: 'Number lines - up to 100' },
  { code: 'A.12', url: 'https://in.ixl.com/maths/class-i/hundred-chart', name: 'Hundred chart' },
  { code: 'A.13', url: 'https://in.ixl.com/maths/class-i/even-or-odd', name: 'Even or odd' },
  { code: 'A.14', url: 'https://in.ixl.com/maths/class-i/identify-numbers-as-even-or-odd', name: 'Identify numbers as even or odd' },
  { code: 'A.15', url: 'https://in.ixl.com/maths/class-i/even-or-odd-numbers-on-number-lines', name: 'Even or odd numbers on number lines' },
  { code: 'A.16', url: 'https://in.ixl.com/maths/class-i/which-even-or-odd-number-comes-before-or-after', name: 'Which even or odd number comes before or after?' },
  { code: 'A.17', url: 'https://in.ixl.com/maths/class-i/skip-counting-patterns-with-tables', name: 'Skip-counting patterns - with tables' },
  { code: 'A.18', url: 'https://in.ixl.com/maths/class-i/sequences-count-up-and-down-by-1-2-3-5-and-10', name: 'Sequences - count up and down by 1, 2, 3, 5 and 10' },
  { code: 'A.19', url: 'https://in.ixl.com/maths/class-i/sequences-count-up-and-down-by-100', name: 'Sequences - count up and down by 100' },
  { code: 'A.20', url: 'https://in.ixl.com/maths/class-i/ordinal-numbers', name: 'Ordinal numbers' },
  { code: 'A.21', url: 'https://in.ixl.com/maths/class-i/writing-numbers-in-words', name: 'Writing numbers in words' }
];

async function scrapeSkill(browser, skill) {
  const page = await browser.newPage();
  
  // Set real user agent to mimic a normal browser
  await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  console.log(`\nStarting fetch for skill [${skill.code}]: ${skill.name}`);
  const capturedQuestions = [];

  // Run a loop to fetch a few variations of questions for this skill
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await page.goto(skill.url, { waitUntil: 'networkidle2', timeout: 30000 });
      
      // Wait for any general content container to load (adjust selectors if needed)
      await page.waitForSelector('#practice-question-container, .question-wrapper, .practice-area, body', { timeout: 10000 });

      // Extract raw question texts and option layouts
      const questionData = await page.evaluate(() => {
        // Attempt to search general common selectors for question prompts and options
        const questionEl = document.querySelector('.question-text, .problem-statement, .question-text-class, h2');
        const optionsEls = document.querySelectorAll('.option-choice, .mcq-card, .answer-option, .choice-box');
        
        const questionText = questionEl ? questionEl.innerText.trim() : '';
        const options = Array.from(optionsEls).map(el => el.innerText.trim()).filter(Boolean);
        
        return {
          questionText,
          options,
          scrapedAt: new Date().toISOString()
        };
      });

      if (questionData.questionText) {
        capturedQuestions.push(questionData);
        console.log(`  [Attempt ${attempt}/5] Captured: "${questionData.questionText.slice(0, 60)}..."`);
      }
      
      // Mimic human reading speed delay
      await new Promise(r => setTimeout(r, 2000));
    } catch (err) {
      console.warn(`  [Attempt ${attempt}] Skipping load error:`, err.message);
    }
  }

  await page.close();
  return {
    code: skill.code,
    name: skill.name,
    url: skill.url,
    templates: capturedQuestions
  };
}

async function run() {
  console.log('🚀 Initiating Headless Scraper...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  
  // Scrape the first few skills as a demonstration to avoid extensive wait time.
  // You can extend this to run the entire list.
  const activeSkills = SKILLS_TO_SCRAPE.slice(0, 3); 
  console.log(`Will scrape the first ${activeSkills.length} skills (A.1, A.2, A.3). Modify the slice count in the script to scrape more!`);

  for (const skill of activeSkills) {
    const data = await scrapeSkill(browser, skill);
    results.push(data);
  }

  await browser.close();

  const outputDir = path.join(process.cwd(), 'scripts');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, 'ixl_scraped_skills.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf8');
  console.log(`\n🎉 Successfully saved scraped IXL skills dataset to: ${outputPath}`);
}

run();
