import React, { useEffect, useRef, useState } from 'react';

interface VideoRecorderProps {
  interviewId: string;
  token?: string;
  stopRecording: boolean;
  onRecordingError?: (error: string) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({ interviewId, token, stopRecording, onRecordingError }) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    async function startStream() {
      try {
        const userMediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(userMediaStream);

        const mediaRecorder = new MediaRecorder(userMediaStream, {
          mimeType: 'video/webm; codecs=vp8,opus',
        });

        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            chunks.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const fullBlob = new Blob(chunks.current, { type: 'video/webm' });
          await uploadFinalVideo(fullBlob);
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Could not start media recording', err);
        setHasPermission(false);
        onRecordingError && onRecordingError('Could not start recording. Please allow camera and microphone access.');
      }
    }

    startStream();

    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
  if (stopRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    // Stop all media tracks to turn off camera and mic
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null); // Clear stream to remove video feed
    }
  }
}, [stopRecording, stream]);


  const uploadFinalVideo = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('interviewId', interviewId);
      formData.append('video', blob, `interview-${Date.now()}.webm`);

      await fetch(`${baseURL}/upload-final-video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
    } catch (error) {
      console.error('Failed to upload final video:', error);
    }
  };

  if (!hasPermission) {
    return <p style={{ color: 'red' }}>⚠️ Please allow access to your camera and microphone to record the interview.</p>;
  }

  return (
    <div>
      {isRecording ? (
        <p>🎥 Recording your interview...</p>
      ) : (
        <p>🛑 Not recording</p>
      )}
      {stream && <video autoPlay muted playsInline ref={video => { if(video) video.srcObject = stream; }} style={{ width: '320px', borderRadius: '8px' }} />}
    </div>
  );
};

export default VideoRecorder;
