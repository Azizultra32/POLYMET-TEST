"use client"

import type { AudioChunk, OfflineQueueItem } from "@/types/transcript"

const DB_NAME = "armada_audio_db"
const DB_VERSION = 1
const AUDIO_STORE = "audio_chunks"
const QUEUE_STORE = "offline_queue"

let db: IDBDatabase | null = null
let dbInitPromise: Promise<boolean> | null = null

export async function initDB(): Promise<boolean> {
  // If we're already initializing, return that promise
  if (dbInitPromise) return dbInitPromise

  // If we're already initialized, return true
  if (db) return true

  // If we're on the server, return false
  if (typeof window === "undefined") return false

  // Create a new initialization promise
  dbInitPromise = new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = (event) => {
        console.error("IndexedDB error:", event)
        dbInitPromise = null
        reject(new Error("Failed to open IndexedDB"))
      }

      request.onsuccess = (event) => {
        db = (event.target as IDBOpenDBRequest).result

        // Add error handler to log any errors
        db.onerror = (event) => {
          console.error("IndexedDB error:", event)
        }

        dbInitPromise = null
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
      console.error("Error initializing IndexedDB:", error)
      dbInitPromise = null
      resolve(false)
    }
  })

  return dbInitPromise
}

// Convert blob to base64 string
function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      resolve(reader.result as string)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export async function saveAudioChunk(patientId: string, chunkNumber: number, blob: Blob): Promise<void> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  try {
    // First convert the blob to base64 BEFORE starting any transaction
    const base64data = await blobToBase64(blob)

    // Now create a new transaction
    return new Promise((resolve, reject) => {
      try {
        const transaction = db!.transaction([AUDIO_STORE], "readwrite")
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
          console.log(`Successfully saved chunk ${chunkNumber} to IndexedDB`)
          resolve()
        }

        request.onerror = (event) => {
          console.error("Error in put request:", event)
          reject(new Error("Failed to save audio chunk"))
        }

        transaction.oncomplete = () => {
          console.log(`Transaction completed for chunk ${chunkNumber}`)
        }

        transaction.onerror = (event) => {
          console.error("Transaction error:", event)
          reject(new Error("Transaction failed"))
        }

        transaction.onabort = (event) => {
          console.error("Transaction aborted:", event)
          reject(new Error("Transaction aborted"))
        }
      } catch (error) {
        console.error("Error in transaction creation:", error)
        reject(error)
      }
    })
  } catch (error) {
    console.error("Error in saveAudioChunk:", error)
    throw error
  }
}

export async function getAudioChunks(patientId: string): Promise<AudioChunk[]> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([AUDIO_STORE], "readonly")
      const store = transaction.objectStore(AUDIO_STORE)
      const chunks: AudioChunk[] = []

      // Use a cursor to iterate through all chunks for this patient
      const request = store.openCursor()

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result as IDBCursorWithValue

        if (cursor) {
          const chunk = cursor.value as AudioChunk
          if (chunk.patientId === patientId) {
            chunks.push(chunk)
          }
          cursor.continue()
        } else {
          // Sort chunks by chunkNumber
          chunks.sort((a, b) => a.chunkNumber - b.chunkNumber)
          resolve(chunks)
        }
      }

      request.onerror = (event) => {
        console.error("Error getting audio chunks:", event)
        reject(new Error("Failed to get audio chunks"))
      }
    } catch (error) {
      console.error("Error in getAudioChunks:", error)
      reject(error)
    }
  })
}

export async function getAudioChunk(patientId: string, chunkNumber: number): Promise<AudioChunk | null> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([AUDIO_STORE], "readonly")
      const store = transaction.objectStore(AUDIO_STORE)
      const request = store.get(`${patientId}-${chunkNumber}`)

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result as AudioChunk)
        } else {
          resolve(null)
        }
      }

      request.onerror = (event) => {
        console.error("Error getting audio chunk:", event)
        reject(new Error("Failed to get audio chunk"))
      }
    } catch (error) {
      console.error("Error in getAudioChunk:", error)
      reject(error)
    }
  })
}

export async function saveToOfflineQueue(item: Omit<OfflineQueueItem, "id">): Promise<string> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([QUEUE_STORE], "readwrite")
      const store = transaction.objectStore(QUEUE_STORE)

      // Add timestamp and patientCode to help with debugging and UI
      const itemWithMetadata = {
        ...item,
        timestamp: Date.now(),
        patientCode: item.data?.patient_code || item.data?.updates?.patient_code || "Unknown",
      }

      const request = store.add(itemWithMetadata)

      request.onsuccess = () => {
        resolve(request.result as string)
      }

      request.onerror = (event) => {
        console.error("Error saving to offline queue:", event)
        reject(new Error("Failed to save to offline queue"))
      }

      transaction.onerror = (event) => {
        console.error("Transaction error in saveToOfflineQueue:", event)
        reject(new Error("Transaction failed"))
      }
    } catch (error) {
      console.error("Error in saveToOfflineQueue:", error)
      reject(error)
    }
  })
}

export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([QUEUE_STORE], "readonly")
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        resolve(request.result as OfflineQueueItem[])
      }

      request.onerror = (event) => {
        console.error("Error getting offline queue:", event)
        reject(new Error("Failed to get offline queue"))
      }
    } catch (error) {
      console.error("Error in getOfflineQueue:", error)
      reject(error)
    }
  })
}

export async function removeFromOfflineQueue(id: string): Promise<void> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([QUEUE_STORE], "readwrite")
      const store = transaction.objectStore(QUEUE_STORE)
      const request = store.delete(id)

      request.onsuccess = () => {
        resolve()
      }

      request.onerror = (event) => {
        console.error("Error removing from offline queue:", event)
        reject(new Error("Failed to remove from offline queue"))
      }
    } catch (error) {
      console.error("Error in removeFromOfflineQueue:", error)
      reject(error)
    }
  })
}

export async function clearAudioChunks(patientId: string): Promise<void> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  // Get all chunks for this patient
  const chunks = await getAudioChunks(patientId)

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([AUDIO_STORE], "readwrite")
      const store = transaction.objectStore(AUDIO_STORE)

      // Delete each chunk
      let completed = 0
      let errors = 0

      chunks.forEach((chunk) => {
        const request = store.delete(`${patientId}-${chunk.chunkNumber}`)

        request.onsuccess = () => {
          completed++
          if (completed + errors === chunks.length) {
            if (errors > 0) {
              reject(new Error(`Failed to delete ${errors} chunks`))
            } else {
              resolve()
            }
          }
        }

        request.onerror = () => {
          errors++
          if (completed + errors === chunks.length) {
            reject(new Error(`Failed to delete ${errors} chunks`))
          }
        }
      })

      // If no chunks, resolve immediately
      if (chunks.length === 0) {
        resolve()
      }
    } catch (error) {
      console.error("Error in clearAudioChunks:", error)
      reject(error)
    }
  })
}

export async function closeIndexedDB(): Promise<void> {
  if (db) {
    db.close()
    db = null
  }
}

export async function getAllPatientMids(): Promise<string[]> {
  if (!db) {
    await initDB()
    if (!db) {
      throw new Error("Database not initialized")
    }
  }

  return new Promise((resolve, reject) => {
    try {
      const transaction = db!.transaction([AUDIO_STORE], "readonly")
      const store = transaction.objectStore(AUDIO_STORE)
      const request = store.getAll()

      request.onsuccess = () => {
        const chunks = request.result as AudioChunk[]
        // Extract unique patient IDs
        const patientIds = [...new Set(chunks.map((chunk) => chunk.patientId))]
        resolve(patientIds)
      }

      request.onerror = (event) => {
        console.error("Error getting patient IDs:", event)
        reject(new Error("Failed to get patient IDs"))
      }
    } catch (error) {
      console.error("Error in getAllPatientMids:", error)
      reject(error)
    }
  })
}
