declare global {
  interface Window {
    ReactNativeWebView?: {
      postMessage: (message: string) => void
    }
    onNativeAudioReady?: (audioUri: string) => void
    Razorpay: any
  }
}

export {}
