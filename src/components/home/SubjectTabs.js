'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function SubjectTabs({ activeSubject, basePath = "/grades", sortedGrades = [] }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const subjects = [
    { id: 'math', label: '🧮 Math' },
    { id: 'english', label: '📚 English' },
    { id: 'science', label: '🔬 Science' },
    { id: 'social', label: '🌍 GK & Social' },
  ];

  const currentGrade = searchParams.get('grade') || 'all';

  const handleDropdownChange = (e) => {
    const nextGrade = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (nextGrade === 'all') {
      params.delete('grade');
    } else {
      params.set('grade', nextGrade);
    }
    router.push(`${basePath}?${params.toString()}`);
  };

  return (
    <div className="subject-tabs-container">
      <div className="subject-tabs">
        {subjects.map((sub) => {
          // Maintain active grade filter when switching subjects
          const params = new URLSearchParams();
          params.set('subject', sub.id);
          if (currentGrade !== 'all') {
            params.set('grade', currentGrade);
          }
          return (
            <Link 
              key={sub.id} 
              href={`${basePath}?${params.toString()}`}
              className={`subject-tab ${activeSubject === sub.id ? 'active' : ''}`}
            >
              {sub.label}
            </Link>
          );
        })}
      </div>
      <div className="tab-actions-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {sortedGrades.length > 0 && (
          <select 
            className="grade-filter-dropdown" 
            value={currentGrade} 
            onChange={handleDropdownChange}
          >
            <option value="all">All Grades</option>
            {sortedGrades.map(([gradeTitle]) => {
              const value = gradeTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
              return (
                <option key={value} value={value}>
                  {gradeTitle.replace(' skills', '')}
                </option>
              );
            })}
          </select>
        )}
        <Link href={`${basePath}?view=topics`} className="subject-tab view-toggle">
          📂 View by Topic
        </Link>
      </div>
    </div>
  );
}
