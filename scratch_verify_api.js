async function testSkill(skillId) {
  const url = `http://localhost:3000/api/practice?subject=math&topic=ukg-numbers-counting&skill=${skillId}&difficulty=adaptive&correctStreak=0&practiceLevel=1&levelStreak=0&lastResult=none&remediationActive=false&remediationStep=0&seed=12345`;
  
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error(`Error: Received status ${res.status}`);
      const text = await res.text();
      console.error(text);
      return;
    }
    const data = await res.json();
    console.log(`Success:`, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Fetch failed for ${skillId}:`, err.message);
  }
}

async function main() {
  console.log("--- Testing represent-numbers-up-to-3 ---");
  await testSkill("ukg-numbers-counting-represent-numbers-up-to-3");
}

main().catch(console.error);
