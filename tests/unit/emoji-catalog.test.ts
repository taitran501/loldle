import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const ranges = ['a-d', 'e-h', 'i-l', 'm-p', 'q-t', 'u-z'];
const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' });
const catalog = ranges.flatMap(range => JSON.parse(
  fs.readFileSync(path.resolve(process.cwd(), `scripts/emoji-research/emoji-catalog-${range}.json`), 'utf8')
));

describe('source-backed Emoji catalog', () => {
  it('contains complete verified provenance for every catalog record', () => {
    expect(catalog.length).toBeGreaterThanOrEqual(50);
    const keys = new Set<string>();

    for (const record of catalog) {
      expect(record.status).toBe('approved');
      expect(keys.has(record.championKey)).toBe(false);
      keys.add(record.championKey);

      expect(record.clues.length).toBeGreaterThanOrEqual(4);
      expect(record.clues.length).toBeLessThanOrEqual(6);
      expect(record.clues.every((clue: string) => [...segmenter.segment(clue)].length === 1)).toBe(true);
      expect(record.source.url).toMatch(/^https:\/\//);
      expect(record.source.puzzleDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.source.accessedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(record.verification.sourceMatched).toBe(true);
      expect(record.verification.reviewedBy).toBeTruthy();
      expect(record.verification.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });

  it('keeps source order and repeated clues intact', () => {
    const blitzcrank = catalog.find(record => record.championKey === 'blitzcrank');
    expect(blitzcrank?.clues).toEqual(['🥊', '🪢', '🪢', '🤖']);
  });

  it('contains the reviewed source fixtures', () => {
    const byKey = new Map(catalog.map(record => [record.championKey, record]));
    expect(byKey.get('sylas')?.clues).toEqual(['©', '⛓️', '😤', '💨']);
    expect(byKey.get('lux')?.clues).toEqual(['🌟', '✨', '🔦', '🙂']);
    expect(byKey.get('orianna')?.clues).toEqual(['⚙️', '🔮', '♻️', '👩', '🤖']);
    expect(byKey.get('talon')?.clues).toEqual(['🗡️', '🩸', '🏙️', '🌒', '👤']);
    expect(byKey.get('rumble')?.clues).toEqual(['🔥', '🤖', '⚙️', '😡', '🚀']);
    expect(byKey.get('ivern')?.clues).toEqual(['🌳', '😊', '🍄', '🌼', '🤝']);
  });

});
