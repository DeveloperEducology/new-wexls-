async function run() {
  const url = "http://localhost:3000/api/admin/curriculum?tree=true";
  console.log(`Fetching: ${url}`);
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log("Success:", data.success);
    if (!data.success) {
      console.error(data.error);
      return;
    }

    console.log("Total flat nodes in response:", data.nodes?.length);
    
    // Filter flat nodes matching letter-identification
    const matchingNodes = data.nodes?.filter(n => 
      n.subjectId === 'english' && 
      (n.topicId === 'letter-identification' || n.id?.includes('letter-identification'))
    );
    
    console.log(`\nFound ${matchingNodes?.length} matching nodes in flat list:`);
    for (const n of matchingNodes || []) {
      console.log(`- ID: ${n.id}, type: ${n.type}, parentId: ${n.parentId}, title: "${n.title}"`);
    }

    // Let's also inspect the tree hierarchy for English
    const engTree = data.tree?.find(t => t.id === 'english');
    if (engTree) {
      console.log("\n--- English tree structure ---");
      function printTree(node, depth = 0) {
        console.log(" ".repeat(depth * 2) + `- [${node.type}] ${node.id} (${node.title})`);
        if (node.children) {
          for (const c of node.children) {
            printTree(c, depth + 1);
          }
        }
      }
      printTree(engTree);
    } else {
      console.log("\nEnglish not found in tree root, roots are:", data.tree?.map(t => t.id));
    }

  } catch (err) {
    console.error("Fetch failed:", err.message);
  }
}
run();
