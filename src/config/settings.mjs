export const settings = Object.freeze({
  application: {
    name: "LLM-speech-local-DEMO",
    version: "0.1.0"
  },

  audio: {
    sampleRate: 16000,
    channels: 1,
    format: "S16_LE",
    maxRecordingSeconds: 15
  },

speech: {
  language: "fi",
  model: "small",
  executable: "whisper-cli",
  modelPath: "./whisper.cpp/models/ggml-small.bin"
},

  privacy: {
    persistConversations: false,
    persistAudio: false
  }
});