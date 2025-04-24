import { defineStore } from 'pinia'

export const useAudioStore = defineStore('audio', {
  state: () => ({
    currentPlayingId: null
  }),
  actions: {
    setCurrentPlaying(id) {
      this.currentPlayingId = id
    },
    clearCurrentPlaying() {
      this.currentPlayingId = null
    }
  }
}) 