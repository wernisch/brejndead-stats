import fs from "fs";
import fetch from "node-fetch";

const gameMeta = {
  8649112027: { // Break Bones Tower
    type: "My Game",
    description: "Simple tower game where you jump off to break bones"
  },
  8641794993: { // Kids vs Parents Tower
    type: "My Game",
    description: "Simple tower game with two teams, kids and parents"
  },
  8617745696: { // Draw Troll Tower
    type: "My Game",
    description: "Simple tower game where you can draw on the walls"
  },
  8470216398: { // [🎃] Protect The House From Brainrots
    type: "My Game",
    description: "Game where brainrots try to attack the house and you must shoot them"
  },
  8120277194: { // [UPD]Squid Game Roleplay Tower
    type: "Shareholder",
    description: "Tower game with the theme of Squid Game"
  },
  6431757712: { // Find the Ducks 🐤
    type: "My Game",
    description: "Game where you find ducks"
  },
  7016268111: { // Find the Ducks 2 🐤
    type: "My Game",
    description: "Game where you find more ducks"
  },
  6789766645: { // Find the Doges 🐶
    type: "My Game",
    description: "Game where you find doges"
  },
  6614175388: { // Find the Monkeys 🐵
    type: "My Game",
    description: "Game where you find monkeys"
  },
  6528524000: { // Find the Frogs 🐸
    type: "My Game",
    description: "Game where you find frogs"
  },
  6463581673: { // Find the Teddy Bears 🧸
    type: "My Game",
    description: "Game where you find teddy bears"
  },
  7166097502: { // [UPD] Parkour Rush
    type: "My Game",
    description: "Obby game with advanced parkour system"
  },
  7626153268: { // 🏁 Parkour Obby [W7]
    type: "My Game",
    description: "Obby game with multiple worlds and advanced parkour system"
  },
  7334543566: { // Grow Your Duck! 🐤
    type: "Contribution",
    description: "Game where you're a duck and you eat other ducks"
  },
  6829990681: { // Planets Merge Tycoon
    type: "Contribution",
    description: "Game where you drop and merge planets"
  },
  7263505269: { // Find the Dinos 🦕
    type: "My Game",
    description: "Game where you find dinos"
  },
  7401898945: { // Midnight Stalker [HORROR]
    type: "Shareholder",
    description: "Horror slop"
  },
  7309264740: { // Midnight Groceries [HORROR]
    type: "Shareholder",
    description: "Horror slop"
  },
  7456466538: { // Midnight Easter [HORROR]
    type: "Shareholder",
    description: "Horror slop"
  },
  3071634329: { // Emily [HORROR]
    type: "Shareholder",
    description: "Horror slop"
  },
  4800580998: { // Hell Battlegrounds
    type: "Shareholder",
    description: "Combat battleground game"
  },
  7288212525: { // Emoji Murder
    type: "Shareholder",
    description: "Game where you guess emojis"
  },
  2505069317: { // Gold Mining Tycoon
    type: "My Game",
    description: "Game where you mine gold and advance to new worlds"
  },
  5049176019: { // Slingshot Obby [2 Player Obby]
    type: "Shareholder",
    description: "2 player obby with slingshot mechanic"
  },
  2946951335: { // Squid Game [S3]
    type: "My Game",
    description: "one more game one more game one more game"
  },
  7168683817: { // [Update 4] Crazy Shooter 🔫
    type: "Shareholder",
    description: "Basic FPS game"
  },
  7349366409: { // Blobfish Evolution
    type: "Shareholder",
    description: ""
  },
  8091666772: { // Build a Capybara Army 🍊
    type: "My Game",
    description: "Game where you have your own capybara army"
  },
  8631229462: { // Find the Ducks 3 🐤
    type: "My Game",
    description: "Find even more ducks"
  },
  8385096583: { // Swimming Brainrots 🏊
    type: "My Game",
    description: "Game where you have brainrots swimming in your pools and generate money"
  },
  8294794009: { // 99 Nights in the Bunker🐻 [FURNISH THE BUNKER]
    type: "Contribution",
    description: "Game where you survive in the bunker"
  },
  8886304312: { // Angry Brainrots💥🏹
    type: "Contribution",
    description: "Angry Birds but with brainrots"
  },
  8418842748: { // Brainrot Bridge Battles!
    type: "Contribution",
    description: "Bridge battles with brainrots"
  },
  8908046810: { // My Burger Factory 🍔 [UPD]
    type: "Contribution",
    description: "Game where you make burgers"
  },
  8914680488: { // Run or Die
    type: "Contribution",
    description: "Classic death run game"
  }
};


const gameIds = Object.keys(gameMeta).map(Number);

const proxyUrl = "https://workers-playground-white-credit-775c.bloxyhdd.workers.dev/?url=";
const BATCH_SIZE = 75;
const REQUEST_TIMEOUT_MS = 20000;
const MAX_ATTEMPTS = 4;

const wait = (ms) => new Promise(r => setTimeout(r, ms));

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function backoffMs(attempt) {
  const base = Math.min(4000, 250 * Math.pow(2, attempt - 1));
  return base / 2 + Math.random() * base / 2;
}

function parseRetryAfter(v) {
  if (!v) return null;
  const s = Number(v);
  if (!Number.isNaN(s)) return Math.max(0, s * 1000);
  const d = Date.parse(v);
  if (!Number.isNaN(d)) return Math.max(0, d - Date.now());
  return null;
}

function wrap(url) {
  return proxyUrl ? proxyUrl + encodeURIComponent(url) : url;
}

async function fetchWithRetry(url, init = {}) {
  let lastErr, res;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
      res = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: { ...(init.headers || {}), Origin: "null" }
      });
      clearTimeout(timer);

      if (res.status === 429 && attempt < MAX_ATTEMPTS) {
        const ra = parseRetryAfter(res.headers.get("Retry-After"));
        await wait(ra ?? backoffMs(attempt));
        continue;
      }
      if (res.status >= 500 && res.status < 600 && attempt < MAX_ATTEMPTS) {
        await wait(backoffMs(attempt));
        continue;
      }
      return res;
    } catch (e) {
      lastErr = e;
      if (attempt === MAX_ATTEMPTS) break;
      await wait(backoffMs(attempt));
    }
  }
  throw lastErr || new Error(`Failed to fetch ${url}`);
}

async function fetchGamesBatch(ids) {
  const url = wrap(`https://games.roblox.com/v1/games?universeIds=${ids.join(",")}`);
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`games ${res.status}`);
  const data = await res.json();
  const map = new Map();
  for (const g of data?.data || []) map.set(g.id, g);
  return map;
}

async function fetchVotesBatch(ids) {
  const url = wrap(`https://games.roblox.com/v1/games/votes?universeIds=${ids.join(",")}`);
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`votes ${res.status}`);
  const data = await res.json();
  const map = new Map();
  for (const v of data?.data || []) {
    const up = v.upVotes || 0;
    const down = v.downVotes || 0;
    const total = up + down;
    const likeRatio = total > 0 ? Math.round((up / total) * 100) : 0;
    map.set(v.id, likeRatio);
  }
  return map;
}

async function fetchIconsBatch(ids) {
  const url = wrap(
    `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${ids.join(",")}&size=768x432&format=Png&isCircular=false`
  );
  const res = await fetchWithRetry(url);
  if (!res.ok) throw new Error(`thumbs ${res.status}`);
  const data = await res.json();
  const map = new Map();
  for (const row of data?.data || []) {
    const uni = row.universeId ?? row.targetId;
    const img = row?.thumbnails?.[0]?.imageUrl ?? "";
    map.set(uni, img);
  }
  return map;
}

(async () => {
  const allGames = [];
  const batches = chunk(gameIds, BATCH_SIZE);

  for (const ids of batches) {
    try {
      const [gamesMap, votesMap, iconsMap] = await Promise.all([
        fetchGamesBatch(ids),
        fetchVotesBatch(ids),
        fetchIconsBatch(ids)
      ]);

      for (const id of ids) {
        const game = gamesMap.get(id);
        if (!game) continue;

        const meta = gameMeta[id] || {};

        allGames.push({
          id: game.id,
          rootPlaceId: game.rootPlaceId,
          name: game.name,
          playing: game.playing || 0,
          visits: game.visits || 0,
          likeRatio: votesMap.get(id) ?? 0,
          icon: iconsMap.get(id) ?? "",
          type: meta.type || "Contribution",
          description: meta.description || ""
        });
      }

      await wait(300);
    } catch (err) {
      console.error(`Batch failed for ids [${ids.join(",")}]:`, err);
    }
  }

  allGames.sort((a, b) => b.playing - a.playing);

  fs.mkdirSync("public", { recursive: true });
  fs.writeFileSync("public/games.json", JSON.stringify({ games: allGames }, null, 2));
})();
