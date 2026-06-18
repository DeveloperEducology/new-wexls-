async function run() {
  const url = "http://localhost:3000/api/admin/curriculum?tree=true";
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    console.log(`Status: ${res.status}`);
    const data = await res.json();
    console.log(`Success: ${data.success}`);
    
    // Find the letter-identification nodes
    const children = data.chapters || data.nodes || [];
    console.log("Root level items:", children.length);
    
    // Let's search inside the curriculum tree for the skill IDs
    function findSkillInTree(node, skillId) {
      if (node.id === skillId || node.skillId === skillId) {
        return node;
      }
      if (node.children) {
        for (const child of node.children) {
          const found = findSkillInTree(child, skillId);
          if (found) return found;
        }
      }
      return null;
    }

    const begSkill = findSkillInTree(data, "letter-identification-find-phonic-sound-beginning");
    console.log("Beginning skill in curriculum tree:", begSkill ? "FOUND!" : "NOT FOUND");
    if (begSkill) {
      console.log(JSON.stringify(begSkill, null, 2));
    }

    const endSkill = findSkillInTree(data, "letter-identification-find-phonic-sound-ending");
    console.log("Ending skill in curriculum tree:", endSkill ? "FOUND!" : "NOT FOUND");
    if (endSkill) {
      console.log(JSON.stringify(endSkill, null, 2));
    }

  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
