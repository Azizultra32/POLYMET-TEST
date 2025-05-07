"use client"

import AudioContext from "./AudioContext"

let audioSource: MediaElementAudioSourceNode | undefined

const AudioPlayer = {
  create(audioElem: HTMLAudioElement) {
    const audioCtx = AudioContext.getAudioContext()
    const analyser = AudioContext.getAnalyser()

    if (!audioCtx || !analyser) return

    if (audioSource === undefined) {
      const source = audioCtx.createMediaElementSource(audioElem)
      source.connect(analyser)
      audioSource = source
    }

    analyser.connect(audioCtx.destination)
  },
}

export default AudioPlayer
