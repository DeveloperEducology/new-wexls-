/**
 * Compiles a structured Gemini worksheet JSON into Markdown.
 *
 * @param {object} worksheet - The worksheetJson object from Gemini.
 * @param {'worksheet'|'lesson'} mode
 *   - 'worksheet' → blank lines/underscores (student handout)
 *   - 'lesson'    → answers filled in (teacher guide / study notes)
 * @returns {string} Markdown string
 */
export function compileToMarkdown(worksheet, mode = 'worksheet') {
  const isLesson = mode === 'lesson';
  const lines = [];

  lines.push(`# ${worksheet.title}\n`);

  // ──────────────────────────────────────────
  // 1. KEY CONCEPT
  // ──────────────────────────────────────────
  if (worksheet.keyConcept) {
    const k = worksheet.keyConcept;
    lines.push(`## 📘 Key Concept: ${k.title}\n`);
    lines.push(`${k.description}\n`);

    if (k.diagram && k.diagram.code) {
      lines.push(`\`\`\`mermaid\n${k.diagram.code}\n\`\`\`\n`);
    }

    if (k.equation) {
      const eq = k.equation.replace(/^\$\$?|\$\$?$/g, '').trim();
      lines.push(`$$\n${eq}\n$$\n`);
    }

    if (k.bullets?.length) {
      k.bullets.forEach((b) => lines.push(`- ${b}`));
      lines.push('');
    }
  }

  // ──────────────────────────────────────────
  // 2. HOW TO IDENTIFY
  // ──────────────────────────────────────────
  if (worksheet.howToIdentify) {
    const h = worksheet.howToIdentify;
    lines.push(`## 🔍 ${h.title}\n`);
    lines.push(`${h.description}\n`);

    lines.push('| Component | Description | Keywords |');
    lines.push('| :--- | :--- | :--- |');

    if (h.intercept) {
      lines.push(
        `| **${h.intercept.title}** | ${h.intercept.description} | \`${h.intercept.keywords}\` |`
      );
    }
    if (h.slope) {
      lines.push(
        `| **${h.slope.title}** | ${h.slope.description} | \`${h.slope.keywords}\` |`
      );
    }
    lines.push('');
  }

  // ──────────────────────────────────────────
  // 3. WORKED EXAMPLE
  // ──────────────────────────────────────────
  if (worksheet.workedExample) {
    const w = worksheet.workedExample;
    lines.push(`## 🛠️ ${w.title}\n`);
    lines.push(`**Scenario:** ${w.scenario}\n`);

    if (w.diagram && w.diagram.code) {
      lines.push(`\`\`\`mermaid\n${w.diagram.code}\n\`\`\`\n`);
    }

    lines.push('| Step | Explanation | Value |');
    lines.push('| :--- | :--- | :---: |');
    w.steps?.forEach((step) => {
      const eq = step.equation ? step.equation.replace(/^\$\$?|\$\$?$/g, '').trim() : '';
      lines.push(`| **${step.title}** | ${step.explanation} | $${eq}$ |`);
    });
    lines.push('');
  }

  // ──────────────────────────────────────────
  // 4. CHECK YOUR UNDERSTANDING
  // ──────────────────────────────────────────
  if (worksheet.checkYourUnderstanding) {
    const c = worksheet.checkYourUnderstanding;
    lines.push(`## 🧠 ${c.title}\n`);
    lines.push(`${c.instructions}\n`);

    c.questions?.forEach((q, idx) => {
      let text = q.replace(/^\d+[\s.)-]+\s*/, '');
      if (isLesson && c.answers?.[idx]) {
        const answerParts = c.answers[idx].split(',').map((s) => s.trim());
        let partIdx = 0;
        text = text.replace(/_{3,}/g, () => {
          const a = answerParts[partIdx] || answerParts[0] || '___';
          partIdx++;
          return `**${a}**`;
        });
      }
      lines.push(`${idx + 1}. ${text}`);
    });
    lines.push('');

    if (c.reflection) {
      lines.push(`> 💬 **${c.reflection}**\n`);
      if (isLesson && c.reflectionAnswer) {
        lines.push(`> 💡 *${c.reflectionAnswer}*\n`);
      } else {
        lines.push('> _Your answer here…_\n');
      }
    }
  }

  // ──────────────────────────────────────────
  // 5. GUIDED PRACTICE
  // ──────────────────────────────────────────
  if (worksheet.guidedPractice) {
    const g = worksheet.guidedPractice;
    lines.push(`## 📝 ${g.title}\n`);
    lines.push(`${g.instructions}\n`);

    g.scenarios?.forEach((sc) => {
      lines.push(`### ${sc.title}`);
      lines.push(`${sc.text}\n`);

      const blank = isLesson ? null : '___________';
      lines.push('| Field | Answer |');
      lines.push('| :--- | :--- |');
      lines.push(`| **${sc.slopeLabel || 'Slope (m):'}** | ${isLesson ? `**${sc.slopeAnswer}**` : blank} |`);
      lines.push(`| **${sc.interceptLabel || 'y-intercept (b):'}** | ${isLesson ? `**${sc.interceptAnswer}**` : blank} |`);
      const eq = sc.equationAnswer ? sc.equationAnswer.replace(/^\$\$?|\$\$?$/g, '').trim() : '';
      lines.push(`| **${sc.equationLabel || 'Final Equation:'}** | ${isLesson ? `$${eq}$` : blank} |`);
      lines.push('');
    });
  }

  // ──────────────────────────────────────────
  // 6. INDEPENDENT PRACTICE
  // ──────────────────────────────────────────
  if (worksheet.independentPractice) {
    const p = worksheet.independentPractice;
    lines.push(`## ✏️ ${p.title}\n`);
    lines.push(`${p.instructions}\n`);

    p.scenarios?.forEach((sc, idx) => {
      lines.push(`#### ${idx + 1}. ${sc.title}`);
      lines.push(`${sc.text}\n`);
      lines.push(`- **A.** ${sc.questionA}`);
      if (isLesson) lines.push(`  > **Answer:** ${sc.answerA}`);
      lines.push(`- **B.** ${sc.questionB}`);
      if (isLesson) lines.push(`  > **Answer:** ${sc.answerB}`);
      lines.push('');
    });
  }

  // ──────────────────────────────────────────
  // 7. EXTENSION CHALLENGE
  // ──────────────────────────────────────────
  if (worksheet.extensionChallenge) {
    const e = worksheet.extensionChallenge;
    lines.push(`## 🚀 ${e.title || 'Extension Challenge'}\n`);
    lines.push(`${e.text}\n`);
    if (isLesson && e.answer) {
      lines.push(`> 💡 **Solution Guide:** ${e.answer}\n`);
    }
  }

  // ──────────────────────────────────────────
  // 8. ANSWER KEY
  // ──────────────────────────────────────────
  if (worksheet.answerKey) {
    const ak = worksheet.answerKey;
    lines.push(`---\n`);
    lines.push(`## 🔑 ${ak.title || 'Answer Key'}\n`);

    ak.sections?.forEach((sect) => {
      lines.push(`### ${sect.title}`);
      sect.bullets?.forEach((b) => lines.push(`- ${b}`));
      lines.push('');
    });
  }

  return lines.join('\n');
}
