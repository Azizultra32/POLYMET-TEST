declare global {
  interface Window {
    microphoneStream: MediaStream
    persistentStream: MediaStream
  }
}

export {}
