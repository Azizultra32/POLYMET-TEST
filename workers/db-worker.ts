// This is a Web Worker file that handles IndexedDB operations in the background

// Define types
interface AudioChunk {
  patientId: string
  chunkNumber: number
  blob: string // Store as base64 string
  timestamp: number
}

interface OfflineQueueItem {
  type: "create" | "update" | "delete" | "upload"
  data: any
  id?: string
  timestamp?: number
}

// IndexedDB configuration
const DB_NAME = "armada_audio_db"
const DB_VERSION = 1
const AUDIO_STORE = "audio_chunks"
const QUEUE_STORE = "offline_queue"

let db: IDBDatabase | null = null

// Initialize the database
async function initDB(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("IndexedDB error:", event)
        resolve(false) // Resolve with false instead of rejecting
      }

      request.onsuccess = (event) => {
        db = (event.target as IDBOpenDBRequest).result

        // Add error handler to log any errors
        db.onerror = (event) => {
          console.error("IndexedDB error:", event)
        }

        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result

        // Create audio chunks store
        if (!database.objectStoreNames.contains(AUDIO_STORE)) {
          database.createObjectStore(AUDIO_STORE, { keyPath: "id" })
        }

        // Create offline queue store
        if (!database.objectStoreNames.contains(QUEUE_STORE)) {
          database.createObjectStore(QUEUE_STORE, { keyPath: "id", autoIncrement: true })
        }
      }
    } catch (error) {
      console.error("Error in initDB:", error)
      resolve(false) // Resolve with false instead of rejecting
    }
  })
}

// Convert blob to base64 string
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = () => {
        resolve(reader.result as string)
      }
      reader.onerror = (error) => {
        console.error("Error in blobToBase64:", error)
        reject(error)
      }
      reader.readAsDataURL(blob)
    } catch (error) {
      console.error("Error in blobToBase64:", error)
      reject(error)
    }
  })
}

// Save audio chunk to IndexedDB
async function saveAudioChunk(patientId: string, chunkNumber: number, blob: Blob): Promise<void> {
  if (!db) {
    const initialized = await initDB()
    if (!initialized) {
      throw new Error("Database not initialized")
    }
  }

  try {
    // Convert blob to base64
    const base64data = await blobToBase64(blob)

    return new Promise((resolve, reject) => {
      try {
        if (!db) {
          reject(new Error("Database not available"))
          return
        }

        const transaction = db.transaction([AUDIO_STORE], "readwrite")
        const store = transaction.objectStore(AUDIO_STORE)

        const audioChunk: AudioChunk & { id: string } = {
          id: `${patientId}-${chunkNumber}`,
          patientId,
          chunkNumber,
          blob: base64data,
          timestamp: Date.now(),
        }

        const request = store.put(audioChunk)

        request.onsuccess = () => {
          resolve()
        }

        request.onerror = (event) => {
          console.error("Error in put request:", event)
          reject(new Error("Failed to save audio chunk"))
        }
      } catch (error) {
        console.error("Error in saveAudioChunk transaction:", error)
        reject(error)
      }
    })
  } catch (error) {
    console.error("Error in saveAudioChunk:", error)
    throw error
  }
}

// Save to offline queue
async function saveToOfflineQueue(item: any): Promise<string> {
  if (!db) {
    const initialized = await initDB()
    if (!initialized) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      if (!db) {
        reject(new Error("Database not available"))
        return
      }

      const transaction = db.transaction([QUEUE_STORE], "readwrite")
      const store = transaction.objectStore(QUEUE_STORE)

      // Add timestamp to help with debugging
      const itemWithTimestamp = {
        ...item,
        timestamp: Date.now(),
      }

      const request = store.add(itemWithTimestamp)

      request.onsuccess = () => {
        resolve(request.result as string)
      }

      request.onerror = (event) => {
        console.error("Error in saveToOfflineQueue request:", event)
        reject(new Error("Failed to save to offline queue"))
      }
    } catch (error) {
      console.error("Error in saveToOfflineQueue:", error)
      reject(error)
    }
  })
}

// Handle messages from the main thread
self.onmessage = async (e) => {
  try {
    const { type, data } = e.data

    switch (type) {
      case "init":
        try {
          await initDB()
          self.postMessage({ type: "initialized" })
        } catch (error) {
          console.error("Error initializing DB:", error)
          self.postMessage({
            type: "error",
            data: { message: error instanceof Error ? error.message : "Unknown error initializing DB" },
          })
        }
        break

      case "saveChunk":
        try {
          if (!data || !data.patientId || !data.blob) {
            throw new Error("Invalid data for saveChunk")
          }
          await saveAudioChunk(data.patientId, data.chunkNumber, data.blob)
          self.postMessage({
            type: "chunkSaved",
            data: {
              patientId: data.patientId,
              chunkNumber: data.chunkNumber,
            },
          })
        } catch (error) {
          console.error("Error saving chunk:", error)
          self.postMessage({
            type: "error",
            data: { message: error instanceof Error ? error.message : "Unknown error saving chunk" },
          })
        }
        break

      case "saveToQueue":
        try {
          if (!data) {
            throw new Error("Invalid data for saveToQueue")
          }
          const id = await saveToOfflineQueue(data)
          self.postMessage({
            type: "queueItemSaved",
            data: { id },
          })
        } catch (error) {
          console.error("Error saving to queue:", error)
          self.postMessage({
            type: "error",
            data: { message: error instanceof Error ? error.message : "Unknown error saving to queue" },
          })
        }
        break

      default:
        self.postMessage({
          type: "error",
          data: { message: `Unknown message type: ${type}` },
        })
    }
  } catch (error) {
    console.error("Error in worker onmessage:", error)
    self.postMessage({
      type: "error",
      data: { message: error instanceof Error ? error.message : "Unknown error in worker" },
    })
  }
}

// Export empty object to satisfy TypeScript module requirements
export {}
