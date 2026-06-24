// Taste-overlap math between two people's top-lists. Each side is a Spotify range
// slice: { tracks: [{name, artists, uri, image}], artists: [{name, image}] }.

function trackKey(t) {
  return (t.uri || `${t.name}|${(t.artists || []).join(',')}`).toLowerCase()
}
function artistKey(a) {
  return (a.name || '').toLowerCase()
}

export function compareTaste(mine, theirs) {
  const myTracks = new Map((mine?.tracks || []).map((t) => [trackKey(t), t]))
  const theirTracks = new Map((theirs?.tracks || []).map((t) => [trackKey(t), t]))
  const myArtists = new Map((mine?.artists || []).map((a) => [artistKey(a), a]))
  const theirArtists = new Map((theirs?.artists || []).map((a) => [artistKey(a), a]))

  const sharedTracks = [...myTracks.keys()].filter((k) => theirTracks.has(k)).map((k) => myTracks.get(k))
  const sharedArtists = [...myArtists.keys()].filter((k) => theirArtists.has(k)).map((k) => myArtists.get(k))

  // Jaccard over artists (steadier than tracks) for the headline overlap percentage.
  const union = new Set([...myArtists.keys(), ...theirArtists.keys()])
  const overlapPct = union.size ? Math.round((sharedArtists.length / union.size) * 100) : 0

  return { overlapPct, sharedArtists, sharedTracks }
}
