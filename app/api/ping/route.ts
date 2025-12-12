/**
 * Lightweight ping endpoint for connection warming
 * 
 * Used by the upload engine to prime HTTP connections before heavy upload.
 * This establishes TCP connections and TLS handshakes early,
 * reducing latency for the first actual upload requests.
 */

export async function HEAD() {
  return new Response(null, { 
    status: 204,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    }
  })
}

export async function GET() {
  return new Response('pong', { 
    status: 200,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Content-Type': 'text/plain',
    }
  })
}
