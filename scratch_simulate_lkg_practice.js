async function run() {
  const submitBody = {
    studentId: "ryan_p",
    userId: "ryan_p",
    question: {
      id: "lkg-shapes-name-shape-q1",
      type: "mcq",
      questionText: "What shape is this?",
      correctAnswerIndex: 0,
      options: [{ id: "opt0", label: "Circle" }, { id: "opt1", label: "Square" }],
      metadata: {
        subject: "math",
        topic: "lkg",
        skillId: "lkg-shapes-name-shape",
        streakThreshold: 5
      }
    },
    userAnswer: 0, // Correct
    seed: "test-seed-1",
    subject: "math",
    topic: "lkg",
    skillId: "lkg-shapes-name-shape",
    difficulty: "adaptive",
    practiceLevel: 1,
    smartScoreBefore: 0,
    startedAt: Date.now() - 1000
  };
  
  console.log("Submitting practice progress...");
  try {
    const res = await fetch("http://localhost:3000/api/adaptive/submit-and-next", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submitBody)
    });
    const data = await res.json();
    console.log("Submit Response:", JSON.stringify(data, null, 2));
    
    console.log("\nQuerying dashboard stats for ryan_p (LKG)...");
    const dashRes = await fetch("http://localhost:3000/api/dashboard/student?userId=ryan_p&grade=LKG");
    const dashData = await dashRes.json();
    console.log("Skills Mastery in Dashboard:", JSON.stringify(dashData.skillsMastery, null, 2));
  } catch (err) {
    console.error("Simulation failed:", err.message);
  }
}

run();
