async function run() {
  const url = "http://localhost:3000/api/admin/questions?subject=english&topic=letter-identification";
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Success: ${data.success}`);
    console.log(`Total questions: ${data.pagination?.total}`);
    console.log(`Returned count: ${data.questions?.length}`);
    for (const q of data.questions || []) {
      console.log(`- ID: ${q.id || q._id}`);
      console.log(`  skillId: ${q.skillId}`);
      console.log(`  type: ${q.type}`);
      console.log(`  status: ${q.status}`);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
