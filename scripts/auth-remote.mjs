// Remote authorization helper for when the Spotify account owner (Marwa) is not
// at this machine. Two steps:
//
//   1. npm run auth:link
//      Prints an authorization URL. Send it to Marwa. She logs in to Spotify,
//      clicks Agree, and lands on a dead http://127.0.0.1:8888/callback page
//      (expected: nothing is listening on her machine). She copies the FULL URL
//      from her address bar and sends it back.
//
//   2. npm run auth:code "<the full URL she sent back>"
//      Exchanges the code for tokens and writes the refresh token to
//      .refresh_token (gitignored). Run this quickly: Spotify authorization
//      codes expire after a few minutes.
//
// Requires SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET in env or .env, and the
// redirect URI http://127.0.0.1:8888/callback registered in the Spotify app.
import fs from 'node:fs'
import { exchangeCode, SCOPES } from './lib/spotify.js'

function loadDotEnv() {
  try {
    const txt = fs.readFileSync(new URL('../.env', import.meta.url), 'utf8')
    for (const line of txt.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  } catch {
    /* no .env, fine */
  }
}

loadDotEnv()

const clientId = process.env.SPOTIFY_CLIENT_ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
const redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://127.0.0.1:8888/callback'
const STATE = 'xonos-marwa-remote'

if (!clientId || !clientSecret) {
  console.error('Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET (env or .env file).')
  process.exit(1)
}

const [mode, arg] = process.argv.slice(2)

if (mode === 'link') {
  const authUrl =
    'https://accounts.spotify.com/authorize?' +
    new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      scope: SCOPES.join(' '),
      redirect_uri: redirectUri,
      state: STATE,
      show_dialog: 'true',
    }).toString()
  console.log('Send this link to Marwa. She logs in, clicks Agree, then sends back')
  console.log('the full URL of the broken page she lands on:\n')
  console.log(authUrl)
} else if (mode === 'code') {
  if (!arg) {
    console.error('Usage: npm run auth:code "<full redirect URL or code>"')
    process.exit(1)
  }
  let code = arg
  if (arg.includes('://')) {
    const url = new URL(arg)
    code = url.searchParams.get('code')
    const gotState = url.searchParams.get('state')
    if (!code) {
      console.error('No ?code= found in that URL. Make sure she copied the full address bar.')
      process.exit(1)
    }
    if (gotState !== STATE) {
      console.error('State mismatch: that URL did not come from an auth:link of this app.')
      process.exit(1)
    }
  }
  try {
    const tokens = await exchangeCode({ clientId, clientSecret, code, redirectUri })
    fs.writeFileSync(new URL('../.refresh_token', import.meta.url), tokens.refresh_token)
    console.log('Authorized. Refresh token written to .refresh_token (gitignored).')
    console.log('Scopes granted:', tokens.scope)
    console.log('\nNext: gh secret set SPOTIFY_REFRESH_TOKEN < .refresh_token')
  } catch (e) {
    console.error(e.message)
    console.error('\nIf the code expired (codes last only a few minutes), run npm run auth:link again.')
    process.exit(1)
  }
} else {
  console.error('Usage: npm run auth:link  |  npm run auth:code "<url>"')
  process.exit(1)
}
