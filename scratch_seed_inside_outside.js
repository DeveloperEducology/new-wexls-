import { getMongoDb, hasMongoConfig } from './src/lib/db/mongo.js';

async function seed() {
  if (!hasMongoConfig()) {
    console.error("MongoDB is not configured.");
    process.exit(1);
  }
  
  const db = await getMongoDb();
  
  // 1. Seed dynamic template
  const templateId = "ukg-positions-inside-outside";
  const template = {
    id: templateId,
    title: "Inside and Outside Hotspot Question",
    subject: "math",
    topic: "ukg-numbers-counting",
    optionsType: "mcq_hotspot", // Flag to skip shuffling and treat as hotspot select
    questionText: "Click the box where the [animal_label] is **[target_pos]**.",
    variables: [
      {
        name: "animal_label",
        type: "list",
        items: ["rabbit", "penguin"]
      },
      {
        name: "animal_url",
        type: "expression",
        "formula": "animal_label == 'rabbit' ? '/images/rabbit.svg' : '/images/penguin.svg'"
      },
      {
        name: "target_pos_val",
        type: "list",
        items: [0, 1]
      },
      {
        name: "target_pos",
        type: "expression",
        "formula": "target_pos_val == 0 ? 'inside' : 'outside'"
      }
    ],
    options: [
      {
        label: "Box A",
        isCorrect: "target_pos_val == 0"
      },
      {
        label: "Box B",
        isCorrect: "target_pos_val == 1"
      }
    ],
    parts: [
      {
        type: "text",
        content: "Click the box where the [animal_label] is **[target_pos]**."
      },
      {
        type: "hotspot_canvas",
        canvasWidth: 600,
        canvasHeight: 300,
        transparent: true,
        backgroundSvg: "<svg viewBox=\"0 0 600 300\" width=\"100%\" height=\"100%\" xmlns=\"http://www.w3.org/2000/svg\"><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"2\" dy=\"2\" stdDeviation=\"3\" flood-opacity=\"0.1\" /></filter></defs><g filter=\"url(#shadow)\"><rect x=\"30\" y=\"20\" width=\"240\" height=\"240\" rx=\"16\" fill=\"#f8fafc\" stroke=\"#e2e8f0\" stroke-width=\"2\" /><rect x=\"70\" y=\"110\" width=\"160\" height=\"110\" rx=\"8\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"4\" stroke-dasharray=\"4 4\" /><image href=\"[animal_url]\" x=\"100\" y=\"125\" width=\"100\" height=\"80\" /><path d=\"M 70,160 L 230,160 L 230,220 L 70,220 Z\" fill=\"#94a3b8\" fill-opacity=\"0.3\" stroke=\"#64748b\" stroke-width=\"4\" /><text x=\"150\" y=\"245\" fill=\"#334155\" font-size=\"16\" font-weight=\"700\" text-anchor=\"middle\">Box A</text></g><g filter=\"url(#shadow)\"><rect x=\"330\" y=\"20\" width=\"240\" height=\"240\" rx=\"16\" fill=\"#f8fafc\" stroke=\"#e2e8f0\" stroke-width=\"2\" /><rect x=\"420\" y=\"110\" width=\"110\" height=\"110\" rx=\"8\" fill=\"none\" stroke=\"#64748b\" stroke-width=\"4\" /><rect x=\"420\" y=\"110\" width=\"110\" height=\"110\" rx=\"8\" fill=\"#cbd5e1\" stroke=\"#64748b\" stroke-width=\"4\" /><image href=\"[animal_url]\" x=\"345\" y=\"125\" width=\"100\" height=\"80\" /><text x=\"450\" y=\"245\" fill=\"#334155\" font-size=\"16\" font-weight=\"700\" text-anchor=\"middle\">Box B</text></g></svg>",
        hotspots: [
          {
            id: "hotspot_box_a",
            label: "Box A",
            optionIndex: 0,
            x: 5,
            y: 6.67,
            width: 40,
            height: 80,
            transparent: true
          },
          {
            id: "hotspot_box_b",
            label: "Box B",
            optionIndex: 1,
            x: 55,
            y: 6.67,
            width: 40,
            height: 80,
            transparent: true
          }
        ]
      }
    ],
    updatedAt: new Date()
  };

  const templatesCol = db.collection('dynamic_templates');
  await templatesCol.updateOne(
    { id: templateId },
    { $set: template },
    { upsert: true }
  );
  console.log(`Seeded dynamic template: ${templateId}`);

  // 2. Link curriculum node
  const curriculumCol = db.collection('curriculum_nodes');
  const skillNode = await curriculumCol.findOne({ skillId: "ukg-positions-inside-outside" });
  
  if (skillNode) {
    await curriculumCol.updateOne(
      { _id: skillNode._id },
      { 
        $set: { 
          engine: "universal-template",
          templateId: templateId,
          questionType: "mcq_hotspot",
          layoutMode: "mcq_hotspot",
          "metadata.layoutMode": "mcq_hotspot",
          "metadata.mixWithGenerator": true,
          "metadata.generatorProbability": 1.0,
          "metadata.generatorFallback": true
        } 
      }
    );
    console.log(`Successfully updated curriculum node for skill 'ukg-positions-inside-outside'`);
  } else {
    // If not found in curriculum collection, insert one
    const newNode = {
      id: "math-ukg-numbers-counting-ukg-positions-inside-outside",
      type: "skill",
      title: "Inside and outside",
      subjectId: "math",
      topicId: "ukg-numbers-counting",
      skillId: "ukg-positions-inside-outside",
      engine: "universal-template",
      templateId: templateId,
      questionType: "mcq_hotspot",
      layoutMode: "mcq_hotspot",
      metadata: {
        layoutMode: "mcq_hotspot",
        grade: "UKG",
        mixWithGenerator: true,
        generatorProbability: 1.0,
        generatorFallback: true
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await curriculumCol.insertOne(newNode);
    console.log(`Created new curriculum node for skill 'ukg-positions-inside-outside'`);
  }

  process.exit(0);
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
