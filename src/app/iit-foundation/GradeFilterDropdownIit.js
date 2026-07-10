'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function GradeFilterDropdownIit({ grades, selectedGrade }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (e) => {
    const val = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if (val === 'all') {
      params.delete('grade');
    } else {
      params.set('grade', val);
    }
    router.push(`/iit-foundation?${params.toString()}`);
  };

  return (
    <select 
      className="grade-filter-dropdown" 
      value={selectedGrade || 'all'} 
      onChange={handleChange}
    >
      <option value="all">All Grades</option>
      {grades.map(g => (
        <option key={g.id} value={g.id}>
          {g.title}
        </option>
      ))}
    </select>
  );
}
