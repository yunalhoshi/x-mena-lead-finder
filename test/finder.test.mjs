import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildQuery, collect, toCsv } from '../finder.mjs';

test('query', () => {
  assert.equal(buildQuery(['cs2', 'rainbow six'], 'ar'), '(cs2 OR "rainbow six") lang:ar -is:retweet -is:reply');
});

test('collect filters by followers, counts posts, extracts contacts', () => {
  const page = {
    data: [{ id: '1', author_id: 'a' }, { id: '2', author_id: 'a' }, { id: '3', author_id: 'b' }, { id: '4', author_id: 'c' }],
    includes: { users: [
      { id: 'a', username: 'alpha', name: 'Alpha', public_metrics: { followers_count: 5000 }, description: 'biz: alpha@example.com' },
      { id: 'b', username: 'beta', name: 'Beta', public_metrics: { followers_count: 50 } },
      { id: 'c', username: 'gamma', name: 'Gamma', public_metrics: { followers_count: 9000 }, location: 'Riyadh' },
    ] },
  };
  const rows = collect([page], { min: 1000, max: 100000 });
  assert.deepEqual(rows.map((r) => r.handle), ['alpha', 'gamma']);
  assert.equal(rows[0].matching_posts, 2);
  assert.equal(rows[0].contacts, 'alpha@example.com');
  assert.match(toCsv(rows), /^handle,name,url,followers/);
});
