// VoiceAnswer.tsx
import React from 'react';
import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';

type VoiceAnswerProps = {
  onSubmit: (answer: string) => void;
};

const VoiceAnswer: React.FC<VoiceAnswerProps> = ({ onSubmit }) => {
  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>🎤 Your browser does not support voice input.</span>;
  }

  const handleStart = () => {
    resetTranscript();
    SpeechRecognition.startListening({ continuous: true });
  };

  const handleStop = () => {
    SpeechRecognition.stopListening();
  };

  const handleSubmit = () => {
    handleStop();
    onSubmit(transcript);
  };

  return (
    <div className="p-3 border rounded">
      <h5>🎙 Voice Answer</h5>
      <p>{listening ? 'Listening...' : 'Click mic to start speaking.'}</p>

      <div className="d-flex gap-2 mb-2">
        <button onClick={handleStart} className="btn btn-success">Start</button>
        <button onClick={handleStop} className="btn btn-warning">Stop</button>
        <button onClick={handleSubmit} className="btn btn-primary">Submit</button>
      </div>

      <textarea
        className="form-control"
        value={transcript}
        readOnly
        rows={4}
      />
    </div>
  );
};

export default VoiceAnswer;
