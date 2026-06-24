import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareTaste } from '../src/lib/compare.js'

const MINE = {
  tracks: [
    { name: 'Shared Song', artists: ['X'], uri: 'a' },
    { name: 'Mine Only', artists: ['Y'], uri: 'b' },
  ],
  artists: [{ name: 'X' }, { name: 'Y' }, { name: 'Z' }],
}
const THEIRS = {
  tracks: [
    { name: 'Shared Song', artists: ['X'], uri: 'a' },
    { name: 'Their Only', artists: ['W'], uri: 'c' },
  ],
  artists: [{ name: 'X' }, { name: 'W' }],
}

test('finds shared tracks and artists', () => {
  const r = compareTaste(MINE, THEIRS)
  assert.equal(r.sharedTracks.length, 1)
  assert.equal(r.sharedTracks[0].uri, 'a')
  assert.equal(r.sharedArtists.length, 1)
  assert.equal(r.sharedArtists[0].name, 'X')
})

test('overlap is Jaccard over artists, rounded to a percent', () => {
  // shared artists = {X} = 1; union = {X,Y,Z,W} = 4 -> 25%
  assert.equal(compareTaste(MINE, THEIRS).overlapPct, 25)
})

test('artist match is case-insensitive', () => {
  const r = compareTaste({ artists: [{ name: 'Boygenius' }] }, { artists: [{ name: 'boygenius' }] })
  assert.equal(r.overlapPct, 100)
})

test('empty inputs are safe', () => {
  const r = compareTaste(null, undefined)
  assert.deepEqual(r, { overlapPct: 0, sharedArtists: [], sharedTracks: [] })
})
