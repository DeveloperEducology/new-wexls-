async function run() {
  const payload = {
    role: 'student',
    username: 'kabir_p',
    pin: '1234',
    schoolCode: 'KC-DPS',
    classCode: 'UKG-A'
  };
  
  console.log("Testing POST to /api/auth/login for kabir_p...");
  try {
    const res = await fetch("http://localhost:3000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Login request failed:", err.message);
  }
}

run();
