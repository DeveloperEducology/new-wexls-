'use client';

import { useMemo, useState, useEffect } from 'react';
import styles from './question-bank.module.css';

const SAMPLE_JSON = `{
  "type": "mcq",
  "questionText": "2 + 3 = ?",
  "parts": [
    { "type": "text", "content": "2 + 3 = ?" }
  ],
  "options": ["4", "5", "6"],
  "answer": "5",
  "correctAnswerIndex": 1,
  "solution": {
    "sections": [
      { "type": "text", "content": "2 + 3 = 5." }
    ]
  },
  "metadata": {
    "subject": "math",
    "topic": "addition",
    "skillId": "addition-g1-a1-facts-to-9",
    "templateId": "questionBank.mcq",
    "engine": "questionBank"
  }
}`;

function parseQuestionJson(raw) {
  const parsed = JSON.parse(raw);
  return parsed?.question && typeof parsed.question === 'object' ? parsed.question : parsed;
}

function readPath(question, path, fallback = '') {
  return path.split('.').reduce((value, key) => value?.[key], question) || fallback;
}

export default function QuestionBankPage() {
  const [rawJson, setRawJson] = useState(SAMPLE_JSON);
  const [mode, setMode] = useState('upsert');
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);
  const [samples, setSamples] = useState([]);
  const [selectedSample, setSelectedSample] = useState('');

  useEffect(() => {
    async function loadSamplesList() {
      try {
        const res = await fetch('/api/question-bank/samples');
        const data = await res.json();
        if (data.success) {
          setSamples(data.samples || []);
        }
      } catch (err) {
        console.error('Failed to load question bank samples:', err);
      }
    }
    loadSamplesList();
  }, []);

  async function handleLoadSample(filename) {
    setSelectedSample(filename);
    if (!filename) return;

    try {
      const res = await fetch(`/api/question-bank/samples?file=${filename}`);
      const data = await res.json();
      if (data.success) {
        setRawJson(JSON.stringify(data.content, null, 2));
      } else {
        console.error('Failed to retrieve sample contents:', data.error);
      }
    } catch (err) {
      console.error('Failed to load sample:', err);
    }
  }

  const parsedState = useMemo(() => {
    try {
      const question = parseQuestionJson(rawJson);
      return { ok: true, question };
    } catch (error) {
      return { ok: false, error: error.message };
    }
  }, [rawJson]);

  const question = parsedState.ok ? parsedState.question : null;
  const isArrayPayload = Array.isArray(question);
  
  // Display preview using first item if it is a list
  const previewQuestion = isArrayPayload ? question[0] : question;

  const subject = previewQuestion ? readPath(previewQuestion, 'metadata.subject', previewQuestion.subject) : '';
  const topic = previewQuestion ? readPath(previewQuestion, 'metadata.topic', previewQuestion.topic) : '';
  const skillId = previewQuestion ? readPath(previewQuestion, 'metadata.skillId', previewQuestion.skillId || previewQuestion.microSkillId) : '';
  const templateId = previewQuestion ? readPath(previewQuestion, 'metadata.templateId', previewQuestion.templateId) : '';

  async function handleSave() {
    setSaving(true);
    setStatus(null);

    try {
      if (!parsedState.ok) {
        throw new Error(parsedState.error);
      }

      const response = await fetch('/api/question-bank', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          question: parsedState.question,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Question save failed.');
      }

      if (data.result.mode === 'bulk') {
        setStatus({
          type: 'success',
          message: `Bulk saved ${data.result.count} questions successfully (${data.result.inserted} inserted, ${data.result.updated} updated).`,
        });
      } else {
        setStatus({
          type: 'success',
          message: `${data.result.mode === 'insert' ? 'Saved' : 'Updated'} question ${data.result.id}.`,
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: error.message,
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <div>
          <p className={styles.eyebrow}>Question Bank</p>
          <h1>Paste JSON and Save to MongoDB</h1>
          <p>
            Import generated or hand-authored question JSON into the shared question bank.
            Practice still falls back to generators when no stored question is found.
          </p>
        </div>
        <a className={styles.linkButton} href="/practice">
          Open Practice
        </a>
      </section>

      <section className={styles.grid}>
        <div className={styles.editorCard}>
          <div className={styles.toolbar}>
            <label>
              Save mode
              <select value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="upsert">Update existing by id, else insert</option>
                <option value="insert">Always insert new document</option>
              </select>
            </label>
            {samples.length > 0 ? (
              <label>
                Load sample
                <select value={selectedSample} onChange={(event) => handleLoadSample(event.target.value)}>
                  <option value="">-- Choose sample file --</option>
                  {samples.map((s) => (
                    <option key={s.filename} value={s.filename}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <button type="button" onClick={() => setRawJson(SAMPLE_JSON)}>
                Load sample
              </button>
            )}
          </div>

          <textarea
            className={styles.textarea}
            value={rawJson}
            onChange={(event) => setRawJson(event.target.value)}
            spellCheck={false}
            aria-label="Question JSON"
          />

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleSave}
              disabled={!parsedState.ok || saving}
            >
              {saving ? 'Saving...' : 'Save to DB'}
            </button>
            {!parsedState.ok ? <span className={styles.errorText}>{parsedState.error}</span> : null}
          </div>
        </div>

        <aside className={styles.previewCard}>
          <p className={styles.eyebrow}>Preview {isArrayPayload ? `(1 of ${question.length})` : ''}</p>
          <h2>{previewQuestion?.questionText || previewQuestion?.question_text || 'No valid question yet'}</h2>

          <dl className={styles.metaList}>
            <div>
              <dt>Type</dt>
              <dd>{previewQuestion?.type || '-'}</dd>
            </div>
            <div>
              <dt>Subject</dt>
              <dd>{subject || '-'}</dd>
            </div>
            <div>
              <dt>Topic</dt>
              <dd>{topic || '-'}</dd>
            </div>
            <div>
              <dt>Skill</dt>
              <dd>{skillId || '-'}</dd>
            </div>
            <div>
              <dt>Template</dt>
              <dd>{templateId || '-'}</dd>
            </div>
            <div>
              <dt>Options</dt>
              <dd>{Array.isArray(previewQuestion?.options) ? previewQuestion.options.length : 0}</dd>
            </div>
            <div>
              <dt>Parts</dt>
              <dd>{Array.isArray(previewQuestion?.parts) ? previewQuestion.parts.length : 0}</dd>
            </div>
          </dl>

          <div className={styles.note}>
            Required fields: <code>type</code>, <code>metadata.subject</code>,{' '}
            <code>metadata.topic</code>, and <code>metadata.skillId</code>.
          </div>

          {status ? (
            <div className={status.type === 'success' ? styles.successBox : styles.errorBox}>
              {status.message}
            </div>
          ) : null}
        </aside>
      </section>
    </main>
  );
}
