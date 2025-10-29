declare module 'react-native-speech-to-text' {
  interface SpeechConfig {
    type?: 'onDevice' | 'network';
    language?: string;
    timeout?: number;
    continuous?: boolean;
    partialResults?: boolean;
  }

  interface SpeechToTextStatic {
    isRecognitionAvailable(): Promise<boolean>;
    startSpeech(config: SpeechConfig): Promise<void>;
    finishSpeech(): Promise<void>;
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onSpeechResults?: (results: string[]) => void;
    onSpeechPartialResults?: (results: string[]) => void;
    onSpeechError?: (error: any) => void;
  }

  const SpeechToText: SpeechToTextStatic;
  export default SpeechToText;
}
