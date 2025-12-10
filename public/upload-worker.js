/**
 * UPLOAD SERVICE WORKER - Background Upload Processing
 * 
 * STATE-OF-THE-ART TECHNIQUES:
 * 
 * 1. BACKGROUND SYNC - Uploads continue even when tab is closed
 *    - Uses Background Sync API
 *    - Retries automatically when online
 * 
 * 2. OFFLINE QUEUE - Queue uploads when offline
 *    - Stored in IndexedDB
 *    - Processed when connection restored
 * 
 * 3. NOTIFICATION PROGRESS - Show upload progress in notifications
 *    - Works even when app is in background
 * 
 * This is how native apps handle uploads - now in the browser.
 */

const CACHE_NAME = '12img-upload-cache-v1'
const UPLOAD_QUEUE_NAME = '12img-upload-queue'

// IndexedDB for upload queue
let db = null

async function openDB() {
  if (db) return db
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('12img-upload-worker', 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result
      if (!database.objectStoreNames.contains('queue')) {
        database.createObjectStore('queue', { keyPath: 'id', autoIncrement: true })
      }
    }
  })
}

async function addToQueue(uploadData) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('queue', 'readwrite')
    const store = transaction.objectStore('queue')
    const request = store.add(uploadData)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function getFromQueue() {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('queue', 'readonly')
    const store = transaction.objectStore('queue')
    const request = store.getAll()
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function removeFromQueue(id) {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction('queue', 'readwrite')
    const store = transaction.objectStore('queue')
    const request = store.delete(id)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()
  })
}

// Install event
self.addEventListener('install', (event) => {
  console.log('[UploadWorker] Installing...')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[UploadWorker] Activating...')
  event.waitUntil(clients.claim())
})

// Handle messages from main thread
self.addEventListener('message', async (event) => {
  const { type, data } = event.data
  
  switch (type) {
    case 'QUEUE_UPLOAD':
      // Add upload to queue
      const id = await addToQueue(data)
      event.ports[0].postMessage({ success: true, id })
      
      // Try to process immediately if online
      if (navigator.onLine) {
        processQueue()
      } else {
        // Register for background sync
        self.registration.sync.register('upload-sync')
      }
      break
      
    case 'GET_QUEUE':
      const queue = await getFromQueue()
      event.ports[0].postMessage({ queue })
      break
      
    case 'CANCEL_UPLOAD':
      await removeFromQueue(data.id)
      event.ports[0].postMessage({ success: true })
      break
  }
})

// Background sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'upload-sync') {
    event.waitUntil(processQueue())
  }
})

// Process upload queue
async function processQueue() {
  const queue = await getFromQueue()
  
  for (const item of queue) {
    try {
      // Notify clients of progress
      notifyClients({
        type: 'UPLOAD_STARTED',
        id: item.id,
        fileName: item.fileName
      })
      
      // Perform upload
      const response = await fetch(item.uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': item.mimeType
        },
        body: item.blob
      })
      
      if (response.ok) {
        // Remove from queue
        await removeFromQueue(item.id)
        
        // Notify success
        notifyClients({
          type: 'UPLOAD_COMPLETE',
          id: item.id,
          fileName: item.fileName
        })
        
        // Show notification if app is in background
        if (Notification.permission === 'granted') {
          self.registration.showNotification('Upload Complete', {
            body: `${item.fileName} uploaded successfully`,
            icon: '/favicon.svg',
            tag: `upload-${item.id}`
          })
        }
      } else {
        throw new Error(`HTTP ${response.status}`)
      }
      
    } catch (error) {
      console.error('[UploadWorker] Upload failed:', error)
      
      // Increment retry count
      item.retries = (item.retries || 0) + 1
      
      if (item.retries < 3) {
        // Will retry on next sync
        notifyClients({
          type: 'UPLOAD_RETRY',
          id: item.id,
          fileName: item.fileName,
          retries: item.retries
        })
      } else {
        // Give up after 3 retries
        await removeFromQueue(item.id)
        
        notifyClients({
          type: 'UPLOAD_FAILED',
          id: item.id,
          fileName: item.fileName,
          error: error.message
        })
        
        if (Notification.permission === 'granted') {
          self.registration.showNotification('Upload Failed', {
            body: `${item.fileName} failed to upload`,
            icon: '/favicon.svg',
            tag: `upload-${item.id}`
          })
        }
      }
    }
  }
}

// Notify all clients
async function notifyClients(message) {
  const allClients = await clients.matchAll({ includeUncontrolled: true })
  for (const client of allClients) {
    client.postMessage(message)
  }
}

// Handle fetch for upload progress tracking
self.addEventListener('fetch', (event) => {
  // Only intercept upload requests
  if (event.request.method === 'PUT' && event.request.url.includes('supabase')) {
    event.respondWith(
      (async () => {
        const response = await fetch(event.request)
        
        // Track upload completion
        if (response.ok) {
          notifyClients({
            type: 'UPLOAD_PROGRESS',
            url: event.request.url,
            status: 'complete'
          })
        }
        
        return response
      })()
    )
  }
})

console.log('[UploadWorker] Service Worker loaded')
