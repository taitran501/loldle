import http from 'http';
import fs from 'fs';
import path from 'path';

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173';
const CONCURRENT_USERS = parseInt(process.env.USERS || process.argv[2] || '50', 10);

// Read champions dataset to pick realistic random champions for each user
const championsData = JSON.parse(fs.readFileSync('public/data/champions.json', 'utf-8'));
const champIds = championsData.map(c => c.id);

const httpAgent = new http.Agent({
  keepAlive: true,
  maxSockets: 100,
});

function fetchUrl(urlPath) {
  return new Promise((resolve) => {
    const start = performance.now();
    const url = `${BASE_URL}${urlPath}`;
    const req = http.get(url, { agent: httpAgent }, (res) => {
      let bytes = 0;
      res.on('data', chunk => {
        bytes += chunk.length;
      });
      res.on('end', () => {
        const duration = performance.now() - start;
        resolve({
          path: urlPath,
          status: res.statusCode,
          duration,
          bytes,
          ok: res.statusCode === 200
        });
      });
    });

    req.on('error', (err) => {
      const duration = performance.now() - start;
      resolve({
        path: urlPath,
        status: 0,
        error: err.message,
        duration,
        bytes: 0,
        ok: false
      });
    });

    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        path: urlPath,
        status: 408,
        error: 'Timeout',
        duration: 10000,
        bytes: 0,
        ok: false
      });
    });
  });
}

// Simulate 1 user gameplay journey
async function simulateUser(userId) {
  const userResults = [];

  // Step 1: User visits app homepage & loads dataset
  userResults.push(await fetchUrl('/'));
  userResults.push(await fetchUrl('/data/champions.json'));

  // Step 2: User plays Classic Mode (guesses 5 random champions)
  for (let i = 0; i < 5; i++) {
    const randomChampId = champIds[Math.floor(Math.random() * champIds.length)];
    userResults.push(await fetchUrl(`/assets/champions/${randomChampId}.png`));
  }

  // Step 3: User switches to Ability Mode & loads ability icon
  const randomChamp = championsData[Math.floor(Math.random() * championsData.length)];
  const randomAbility = randomChamp.abilities[Math.floor(Math.random() * randomChamp.abilities.length)];
  userResults.push(await fetchUrl(randomAbility.iconUrl));

  // User guesses 3 champions in Ability Mode
  for (let i = 0; i < 3; i++) {
    const guessChampId = champIds[Math.floor(Math.random() * champIds.length)];
    userResults.push(await fetchUrl(`/assets/champions/${guessChampId}.png`));
  }

  // Step 4: User plays another round (Unlimited mode preloads next target)
  const nextChamp = championsData[Math.floor(Math.random() * championsData.length)];
  const nextAbility = nextChamp.abilities[0];
  userResults.push(await fetchUrl(`/assets/champions/${nextChamp.id}.png`));
  userResults.push(await fetchUrl(nextAbility.iconUrl));

  return {
    userId,
    results: userResults
  };
}

async function runLoadTest() {
  console.log(`=============================================================`);
  console.log(`  STARTING 50 CONCURRENT USERS STRESS & LOAD TEST`);
  console.log(`  Target Server: ${BASE_URL}`);
  console.log(`  Concurrent Virtual Users: ${CONCURRENT_USERS}`);
  console.log(`=============================================================\n`);

  const overallStart = performance.now();

  // Launch all 50 virtual users concurrently
  const userPromises = [];
  for (let i = 1; i <= CONCURRENT_USERS; i++) {
    userPromises.push(simulateUser(i));
  }

  const allUserSessions = await Promise.all(userPromises);
  const totalDuration = (performance.now() - overallStart) / 1000;

  // Flatten all request metrics
  const allRequests = allUserSessions.flatMap(u => u.results);
  const totalRequests = allRequests.length;
  const successfulRequests = allRequests.filter(r => r.ok).length;
  const failedRequests = allRequests.filter(r => !r.ok);
  const totalBytes = allRequests.reduce((acc, r) => acc + r.bytes, 0);

  const durations = allRequests.map(r => r.duration).sort((a, b) => a - b);
  const minLatency = durations[0];
  const maxLatency = durations[durations.length - 1];
  const avgLatency = durations.reduce((acc, d) => acc + d, 0) / durations.length;
  const p50 = durations[Math.floor(durations.length * 0.50)];
  const p90 = durations[Math.floor(durations.length * 0.90)];
  const p95 = durations[Math.floor(durations.length * 0.95)];
  const p99 = durations[Math.floor(durations.length * 0.99)];

  const rps = totalRequests / totalDuration;
  const throughputMBs = (totalBytes / (1024 * 1024)) / totalDuration;

  console.log(`-------------------------------------------------------------`);
  console.log(`  LOAD TEST REPORT (50 SIMULTANEOUS PLAYERS)`);
  console.log(`-------------------------------------------------------------`);
  console.log(`  Total Simulated Users:    ${CONCURRENT_USERS} users playing simultaneously`);
  console.log(`  Total HTTP Requests:      ${totalRequests}`);
  console.log(`  Success (HTTP 200 OK):    ${successfulRequests} (${((successfulRequests / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`  Failures / Errors:        ${failedRequests.length} (${((failedRequests.length / totalRequests) * 100).toFixed(2)}%)`);
  console.log(`  Total Execution Time:     ${totalDuration.toFixed(2)} seconds`);
  console.log(`  Throughput (RPS):         ${rps.toFixed(1)} requests/sec`);
  console.log(`  Bandwidth:                ${throughputMBs.toFixed(2)} MB/s (Total ${(totalBytes / (1024 * 1024)).toFixed(2)} MB transferred)`);
  console.log(`-------------------------------------------------------------`);
  console.log(`  LATENCY BREAKDOWN (Across all 50 concurrent sessions):`);
  console.log(`  • Minimum Latency:        ${minLatency.toFixed(2)} ms`);
  console.log(`  • Average Latency:        ${avgLatency.toFixed(2)} ms`);
  console.log(`  • Median (P50):           ${p50.toFixed(2)} ms`);
  console.log(`  • 90th Percentile (P90):  ${p90.toFixed(2)} ms`);
  console.log(`  • 95th Percentile (P95):  ${p95.toFixed(2)} ms`);
  console.log(`  • 99th Percentile (P99):  ${p99.toFixed(2)} ms`);
  console.log(`  • Maximum Latency:        ${maxLatency.toFixed(2)} ms`);
  console.log(`=============================================================\n`);

  if (failedRequests.length > 0) {
    console.error(`Sample failed requests:`, failedRequests.slice(0, 5));
    process.exit(1);
  } else {
    console.log(`SUCCESS: 100% of requests from 50 concurrent users completed with ZERO errors!`);
  }
}

runLoadTest();
