async function run() {
  const url = "http://localhost:3000/api/admin/stats";
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Success:", data.success);
    if (data.success) {
      console.log("Subjects list:", data.subjects);
      console.log("Topics list:", data.topics);
    }
  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
