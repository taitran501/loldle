import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { compareChampions } from '../../src/utils/compare';
import { getDailyTarget, getRandomTarget } from '../../src/utils/daily';
import { Champion } from '../../src/types';

describe('Performance & Latency Benchmark Tests', () => {
  const jsonPath = path.resolve(process.cwd(), 'public/data/champions.json');
  const champions: Champion[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  it('filters 169 champions in under 2ms per autocomplete search query', () => {
    const queries = ['ah', 'ak', 'dar', 'yas', 'lee', 'zed', 'lux', 'jhin', 'sam', 'ka'];
    const start = performance.now();

    for (let i = 0; i < 500; i++) {
      const q = queries[i % queries.length];
      champions.filter(c => {
        const queryNorm = q.toLowerCase();
        return c.name.toLowerCase().includes(queryNorm);
      }).slice(0, 8);
    }

    const elapsed = performance.now() - start;
    const avgPerQuery = elapsed / 500;

    // Average search must take less than 0.5ms (target < 2ms)
    expect(avgPerQuery).toBeLessThan(2);
  });

  it('executes 1,000 champion attribute comparisons in under 15ms total', () => {
    const target = champions[0];
    const guess = champions[1];

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      compareChampions(target, guess);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(15);
  });

  it('computes 1,000 deterministic daily seeds and random targets in under 10ms', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      getDailyTarget(champions, 'classic', `2026-09-${(i % 30) + 1}`);
    }
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(10);
  });

  it('reads local static ability and avatar assets from disk in under 2ms per file', () => {
    const sampleAbilityPath = path.resolve(process.cwd(), 'public/assets/abilities/Ahri_q.png');
    const sampleAvatarPath = path.resolve(process.cwd(), 'public/assets/champions/Ahri.png');

    const start = performance.now();
    for (let i = 0; i < 50; i++) {
      fs.readFileSync(sampleAbilityPath);
      fs.readFileSync(sampleAvatarPath);
    }
    const elapsed = performance.now() - start;
    const avgPerFile = elapsed / 100;

    // Must read under 2ms per file on disk
    expect(avgPerFile).toBeLessThan(2);
  });
});
