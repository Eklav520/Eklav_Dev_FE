declare module 'react-speech-recognition' {
  export interface UseSpeechRecognitionOptions {
    commands?: any[];
    transcribing?: boolean;
  }

  export interface UseSpeechRecognitionResult {
    transcript: string;
    interimTranscript: string;
    finalTranscript: string;
    listening: boolean;
    resetTranscript: () => void;
    browserSupportsSpeechRecognition: boolean;
    isMicrophoneAvailable: boolean;
  }

  export function useSpeechRecognition(
    options?: UseSpeechRecognitionOptions
  ): UseSpeechRecognitionResult;

  const SpeechRecognition: {
    startListening: (options?: any) => void;
    stopListening: () => void;
    abortListening: () => void;
    browserSupportsSpeechRecognition: boolean;
  };

  export default SpeechRecognition;
}
