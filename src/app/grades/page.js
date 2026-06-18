import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cookies } from 'next/headers';
import { verifyAccessToken } from '@/lib/authService';
import { getMongoDb } from '@/lib/db/mongo';
import { TOPICS } from '../../lib/constants/topics';
import {
  loadDbTopics,
  mergeTopics,
  buildGradeCurriculum,
  practiceHref,
  countSkills
} from '../../lib/curriculum/gradeHelpers';
import SiteHeader from '../../components/layout/SiteHeader';
import HomeHero from '../../components/home/HomeHero';
import SubjectTabs from '../../components/home/SubjectTabs';

export const dynamic = 'force-dynamic';

function TopicCatalog({ topics = TOPICS }) {
  return (
    <main className="topic-catalog-page">
      <HomeHero />
      <section className="topic-catalog-hero">
        <p>KlassChamp Practice</p>
        <h1>Choose a topic</h1>
      </section>
      <section className="topic-card-list" aria-label="Practice topics">
        {topics.map((topic) => (
          <article className="topic-row-card" key={topic.id} style={{ '--topic-color': topic.color }}>
            <div className="topic-color-bar" />
            <div className="topic-row-copy">
              <h2>{topic.title}</h2>
              <p>
                <span>Includes:</span>{' '}
                {(topic.includes || []).map((item, index) => (
                  <span key={item}>
                    {index > 0 ? <b aria-hidden="true"> | </b> : null}
                    {item}
                  </span>
                ))}
              </p>
            </div>
            <Link className="topic-row-button" href={`/grades?topic=${topic.id}`} style={{ background: topic.color }}>
              See all {countSkills(topic)} skills ›
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}

function TopicSkillsPage({ selectedTopic, topics = TOPICS, skillsMastery = {} }) {
  const selected = topics.find((topic) => topic.id === selectedTopic || topic.topic === selectedTopic) || topics[0];

  return (
    <main className="topic-detail-page">
      <aside className="topic-side-nav" aria-label="Topic navigation">
        {topics.map((topic) => (
          <Link
            key={topic.id}
            href={`/grades?topic=${topic.id}`}
            className={`topic-side-link ${topic.id === selected.id ? 'active' : ''}`}
            style={{ '--topic-color': topic.color }}
          >
            <span />
            {topic.title}
          </Link>
        ))}
      </aside>

      <section className="topic-skill-content" style={{ '--topic-color': selected.color }}>
        <Link className="back-to-topics" href="/grades">‹ All grades</Link>
        <h1>{selected.title}</h1>
        <p className="topic-skill-intro">
          Here is a list of skills for {selected.title.toLowerCase()}. Skills are organized by level, and each link opens in the shared adaptive practice shell.
        </p>
        <div className="skill-columns">
          {selected.groups?.length ? (
            selected.groups.map((group, index) => (
              <section key={group.id || `${group.title}-${index}`} className="skill-column">
                <h2>{group.title}</h2>
                <ol>
                  {group.skills.map(([code, name, skill], idx) => {
                    const mastery = skillsMastery[skill];
                    const score = mastery?.score || 0;
                    const isMastered = mastery?.state === 'Mastered' || score >= 80;

                    return (
                      <li key={`${skill}-${idx}`}>
                        <span>{code}</span>
                        <Link href={practiceHref(selected, skill)}>{name}</Link>
                        {isMastered ? (
                          <span style={{ marginLeft: '8px', fontSize: '1rem', color: '#f59e0b' }} title="Mastered">⭐</span>
                        ) : score > 0 ? (
                          <span style={{
                            marginLeft: '8px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'rgba(99, 102, 241, 0.12)',
                            color: '#4f46e5',
                            padding: '1px 6px',
                            borderRadius: '10px'
                          }} title={`Score: ${score}`}>{score}</span>
                        ) : null}
                        <small aria-hidden="true"> ✎ ⊙</small>
                      </li>
                    );
                  })}
                </ol>
              </section>
            ))
          ) : (
            <p className="topic-skill-intro">
              No skills have been added yet. Create skills in AdminV2 and refresh this page.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

function GradeLevelCurriculumPage({ topics, activeSubject, skillsMastery = {}, selectedGrade = 'all' }) {
  const sortedGrades = buildGradeCurriculum(topics, activeSubject);

  const renderedGrades = selectedGrade && selectedGrade !== 'all'
    ? sortedGrades.filter(([gradeTitle]) => gradeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-') === selectedGrade.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
    : sortedGrades;

  return (
    <main className="ixl-landing-page">
      <HomeHero />
      <SubjectTabs activeSubject={activeSubject} basePath="/grades" sortedGrades={sortedGrades} />

      <div className="curriculum-container">
        <section className="grade-content" style={{ flex: 1, width: '100%', maxWidth: '100%' }}>
          {renderedGrades.length === 0 ? (
            <p className="empty-state">No skills available for this subject or grade yet.</p>
          ) : (
             renderedGrades.map(([gradeTitle, gradeTopics], index) => {
               const isEarlyYears = gradeTitle === 'LKG' || gradeTitle === 'UKG' || gradeTitle === 'Pre-K';
               const prevGrade = index > 0 ? renderedGrades[index - 1][0] : null;
               const prevIsEarlyYears = prevGrade === 'LKG' || prevGrade === 'UKG' || prevGrade === 'Pre-K';
               
               const showPrekHero = isEarlyYears && !prevIsEarlyYears;
               const showPrimaryHero = !isEarlyYears && (index === 0 || prevIsEarlyYears);

               return (
                 <React.Fragment key={gradeTitle}>
                   {showPrekHero && (
                     <div className="inline-hero" style={{ backgroundImage: 'url(/images/prek_landscape.png)' }}>
                       <div className="inline-hero-content">
                         <h2>Kindergarten & Pre-K</h2>
                         <p>Fun, gamified learning environments.</p>
                       </div>
                     </div>
                   )}
                   {showPrimaryHero && (
                     <div className="inline-hero" style={{ backgroundImage: 'url(/images/herog.png)' }}>
                       <div className="inline-hero-content">
                         <h2>Primary Grades</h2>
                         <p>Interactive practice for 1st grade and above.</p>
                       </div>
                     </div>
                   )}
                   <div id={`grade-${gradeTitle.split(' ').join('-')}`} className="grade-section">
                     <h2 className="grade-heading">{gradeTitle.replace(' skills', '')}</h2>
                     <div className="grade-topics-grid">
                       {gradeTopics.map(topic => (
                         <div key={topic.id} className="topic-block" style={{'--theme-color': topic.color}}>
                           <h3 className="topic-subheading">{topic.title}</h3>
                           <div className="skill-pills">
                             {topic.skills.map(([code, name, skill], idx) => {
                               const mastery = skillsMastery[skill];
                               const score = mastery?.score || 0;
                               const isMastered = mastery?.state === 'Mastered' || score >= 80;

                               return (
                                 <Link key={`${skill}-${idx}`} href={practiceHref(topic, skill)} className="skill-pill">
                                   <span className="skill-code">{code}</span>
                                   <span className="skill-name">{name}</span>
                                   {isMastered ? (
                                     <span className="skill-progress-star" style={{ marginLeft: 'auto', fontSize: '1.2rem', color: '#f59e0b' }} title="Mastered">⭐</span>
                                   ) : score > 0 ? (
                                     <span className="skill-progress-score" style={{ 
                                       marginLeft: 'auto', 
                                       fontSize: '0.75rem', 
                                       fontWeight: 800,
                                       background: 'rgba(99, 102, 241, 0.12)',
                                       color: '#4f46e5',
                                       padding: '2px 8px',
                                       borderRadius: '20px'
                                     }} title={`Score: ${score}`}>{score}</span>
                                   ) : null}
                                 </Link>
                               );
                             })}
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 </React.Fragment>
               );
             })
          )}
        </section>
      </div>
    </main>
  );
}

export default async function GradesPage({ searchParams }) {
  const params = await searchParams;
  const selectedTopic = params?.topic;
  const viewMode = params?.view;
  const activeSubject = params?.subject || 'math';
  const selectedGrade = params?.grade || 'all';

  const dbTopics = await loadDbTopics();
  const topics = mergeTopics(TOPICS, dbTopics);

  // Load session and fetch student mastery progress from MongoDB
  let skillsMastery = {};
  try {
    const cookieStore = await cookies();
    const accessCookie = cookieStore.get('klasschamp_access');
    let session = null;
    if (accessCookie) {
      session = verifyAccessToken(accessCookie.value);
    }

    if (session?.userId) {
      const db = await getMongoDb();
      if (db) {
        // Resolve user doc first
        let userDoc = null;
        const { ObjectId } = require('mongodb');
        if (ObjectId.isValid(session.userId)) {
          userDoc = await db.collection('users').findOne({ _id: new ObjectId(session.userId) });
        }
        if (!userDoc) {
          userDoc = await db.collection('users').findOne({ username: session.userId });
        }

        const userIds = [session.userId];
        if (userDoc) {
          userIds.push(userDoc.username);
          userIds.push(String(userDoc._id));

          // Resolve student profile
          const studentDoc = await db.collection('students').findOne({
            $or: [
              { userId: userDoc.username },
              { _id: `stud_${userDoc._id}` }
            ]
          });
          if (studentDoc) {
            userIds.push(studentDoc.userId);
            userIds.push(studentDoc._id);
          }
        }

        const queryIds = [...new Set(userIds.filter(Boolean))];

        const masteries = await db.collection('student_mastery').find({
          userId: { $in: queryIds }
        }).toArray();

        skillsMastery = Object.fromEntries(
          masteries.map(m => [
            m.skillId,
            {
              score: m.score ?? m.smartScore ?? m.masteryScore ?? 0,
              state: m.state || 'Learning'
            }
          ])
        );
      }
    }
  } catch (err) {
    console.error("Error loading student mastery on grades page:", err);
  }

  let content;
  if (selectedTopic) {
    content = <TopicSkillsPage selectedTopic={selectedTopic} topics={topics} skillsMastery={skillsMastery} />;
  } else if (viewMode === 'topics') {
    content = (
      <>
        <div className="view-toggle-header">
          <Link href="/grades" className="back-link">‹ Back to Grade View</Link>
        </div>
        <TopicCatalog topics={topics} />
      </>
    );
  } else {
    content = <GradeLevelCurriculumPage topics={topics} activeSubject={activeSubject} skillsMastery={skillsMastery} selectedGrade={selectedGrade} />;
  }

  return (
    <>
      <SiteHeader />
      {content}
    </>
  );
}
