import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
} catch (e) {
  console.error('Failed to load env:', e);
}

const rawAssets = [
  {
    "name": "sheep",
    "singular": "sheep",
    "plural": "sheeps",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602401769-sheep.webp",
    "firstLetter": "s"
  },
  {
    "name": "rabbit",
    "singular": "rabbit",
    "plural": "rabbits",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602394306-rabbit.webp",
    "firstLetter": "r"
  },
  {
    "name": "pig",
    "singular": "pig",
    "plural": "pigs",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602386415-pig.webp",
    "firstLetter": "p"
  },
  {
    "name": "horse",
    "singular": "horse",
    "plural": "horses",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602379775-horse.webp",
    "firstLetter": "h"
  },
  {
    "name": "goat",
    "singular": "goat",
    "plural": "goats",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602373108-goat.webp",
    "firstLetter": "g"
  },
  {
    "name": "duck",
    "singular": "duck",
    "plural": "ducks",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602365304-duck.webp",
    "firstLetter": "d"
  },
  {
    "name": "donkey",
    "singular": "donkey",
    "plural": "donkeies",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602358235-donkey.webp",
    "firstLetter": "d"
  },
  {
    "name": "cow",
    "singular": "cow",
    "plural": "cows",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602350026-cow.webp",
    "firstLetter": "c"
  },
  {
    "name": "chicken",
    "singular": "chicken",
    "plural": "chickens",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602343002-chicken.webp",
    "firstLetter": "c"
  },
  {
    "name": "buffelo",
    "singular": "buffelo",
    "plural": "buffelos",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783602334616-buffelo.webp",
    "firstLetter": "b"
  },
  {
    "name": "fox",
    "singular": "fox",
    "plural": "foxes",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600826743-10.webp",
    "firstLetter": "f"
  },
  {
    "name": "deer",
    "singular": "deer",
    "plural": "deers",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600826022-9.webp",
    "firstLetter": "d"
  },
  {
    "name": "hippo",
    "singular": "hippo",
    "plural": "hippos",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600825301-8.webp",
    "firstLetter": "h"
  },
  {
    "name": "geraffe",
    "singular": "geraffe",
    "plural": "geraffes",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600824156-6.webp",
    "firstLetter": "g"
  },
  {
    "name": "bear",
    "singular": "bear",
    "plural": "bears",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600823485-5.webp",
    "firstLetter": "b"
  },
  {
    "name": "leopard",
    "singular": "leopard",
    "plural": "leopards",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600822991-4.webp",
    "firstLetter": "l"
  },
  {
    "name": "zebra",
    "singular": "zebra",
    "plural": "zebras",
    "imageUrl": "https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/lkg/animals/1783600822356-3.webp",
    "firstLetter": "z"
  }
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in environment.');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Seeding Image Assets to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    let successCount = 0;
    for (const asset of rawAssets) {
      // Parse key: e.g. "images/lkg/animals/1783602401769-sheep.webp"
      const urlObj = new URL(asset.imageUrl);
      const key = decodeURIComponent(urlObj.pathname.slice(1)); // strip leading slash

      const payload = {
        key: key,
        name: asset.name,
        url: asset.imageUrl,
        linguistics: {
          singular: asset.singular.toLowerCase(),
          plural: asset.plural.toLowerCase(),
          article: ['a', 'e', 'i', 'o', 'u'].includes(asset.firstLetter.toLowerCase()) ? 'an' : 'a'
        },
        classification: {
          category: 'animals',
          tags: ['lkg', 'animals', 'ordinal']
        },
        metadata: {
          updatedAt: new Date()
        }
      };

      await db.collection('image_assets').updateOne(
        { key: key },
        { $set: payload },
        { upsert: true }
      );
      successCount++;
    }

    console.log(`✅ Seeded ${successCount} animal image assets successfully!`);

  } catch (err) {
    console.error('❌ Error seeding image assets:', err);
  } finally {
    await client.close();
  }
}

seed();
