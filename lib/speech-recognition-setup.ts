// This file ensures proper setup for speech recognition

// Import regenerator-runtime to fix "regeneratorRuntime is not defined" error
import "regenerator-runtime/runtime"

// Initialize SpeechRecognition with proper polyfills
export default function setupSpeechRecognition() {
  if (typeof window !== "undefined") {
    // Set up browser polyfills for speech recognition
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    window.SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList
    window.SpeechRecognitionEvent = window.SpeechRecognitionEvent || window.webkitSpeechRecognitionEvent
  }
}
