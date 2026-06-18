import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
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

function TopicSkillsPage({ selectedTopic, topics = TOPICS }) {
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
                  {group.skills.map(([code, name, skill], idx) => (
                    <li key={`${skill}-${idx}`}>
                      <span>{code}</span>
                      <Link href={practiceHref(selected, skill)}>{name}</Link>
                      <small aria-hidden="true"> ✎ ⊙</small>
                    </li>
                  ))}
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

function GradeLevelCurriculumPage({ topics, activeSubject }) {
  const sortedGrades = buildGradeCurriculum(topics, activeSubject);

  return (
    <main className="ixl-landing-page">
      <HomeHero />
      <SubjectTabs activeSubject={activeSubject} basePath="/grades" />

      <div className="curriculum-container">
        <aside className="grade-sidebar">
          <h3>Grades</h3>
          {sortedGrades.map(([gradeTitle]) => (
            <a key={gradeTitle} href={`#grade-${gradeTitle.split(' ').join('-')}`} className="grade-link">
              {gradeTitle.replace(' skills', '')}
            </a>
          ))}
        </aside>

        <section className="grade-content">
          {sortedGrades.length === 0 ? (
            <p className="empty-state">No skills available for this subject yet.</p>
          ) : (
             sortedGrades.map(([gradeTitle, gradeTopics], index) => {
               const isEarlyYears = gradeTitle === 'LKG' || gradeTitle === 'UKG' || gradeTitle === 'Pre-K';
               const prevGrade = index > 0 ? sortedGrades[index - 1][0] : null;
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
                             {topic.skills.map(([code, name, skill], idx) => (
                               <Link key={`${skill}-${idx}`} href={practiceHref(topic, skill)} className="skill-pill">
                                 <span className="skill-code">{code}</span>
                                 <span className="skill-name">{name}</span>
                               </Link>
                             ))}
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

  const dbTopics = await loadDbTopics();
  const topics = mergeTopics(TOPICS, dbTopics);

  let content;
  if (selectedTopic) {
    content = <TopicSkillsPage selectedTopic={selectedTopic} topics={topics} />;
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
    content = <GradeLevelCurriculumPage topics={topics} activeSubject={activeSubject} />;
  }

  return (
    <>
      <SiteHeader />
      {content}
    </>
  );
}
