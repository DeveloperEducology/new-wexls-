import Link from 'next/link';

export default function SubjectTabs({ activeSubject, basePath = "/grades" }) {
  const subjects = [
    { id: 'math', label: '🧮 Math' },
    { id: 'english', label: '📚 English' },
    { id: 'science', label: '🔬 Science' },
    { id: 'social', label: '🌍 GK & Social' },
  ];

  return (
    <div className="subject-tabs-container">
      <div className="subject-tabs">
        {subjects.map((sub) => (
          <Link 
            key={sub.id} 
            href={`${basePath}?subject=${sub.id}`}
            className={`subject-tab ${activeSubject === sub.id ? 'active' : ''}`}
          >
            {sub.label}
          </Link>
        ))}
      </div>
      <Link href={`${basePath}?view=topics`} className="subject-tab view-toggle">
        📂 View by Topic
      </Link>
    </div>
  );
}
