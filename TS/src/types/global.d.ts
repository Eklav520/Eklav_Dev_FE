declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
    onNativeAudioReady?: (audioUri: string) => void
  }
}

export {}
