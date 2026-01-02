import React, { useEffect, useRef, useState } from 'react';

interface VideoRecorderProps {
  interviewId: string;
  token?: string;
  stopRecording: boolean;
  onRecordingError?: (error: string) => void;
  onVideoUpload?: (url: string) => void;
}

const VideoRecorder: React.FC<VideoRecorderProps> = ({
  interviewId,
  token,
  stopRecording,
  onRecordingError,
  onVideoUpload,
}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);

  useEffect(() => {
    let localStream: MediaStream;

    async function startStream() {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = localStream;

        if (videoRef.current) {
          videoRef.current.srcObject = localStream;
        }

        const mediaRecorder = new MediaRecorder(localStream, {
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
          chunks.current = [];
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error('Could not start media recording', err);
        setHasPermission(false);
        onRecordingError?.(
          'Could not start recording. Please allow camera and microphone access.'
        );
      }
    }

    startStream();

    return () => {
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop();
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (
      stopRecording &&
      mediaRecorderRef.current?.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [stopRecording]);

  const uploadFinalVideo = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('interviewId', interviewId);
      formData.append('video', blob, `interview-${Date.now()}.webm`);

      const response = await fetch(`${baseURL}/upload-final-video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (result?.videoUrl && onVideoUpload) {
        onVideoUpload(result.videoUrl);
      }
    } catch (error) {
      console.error('Failed to upload final video:', error);
    }
  };

  if (!hasPermission) {
    return (
      <p style={{ color: 'red' }}>
        ⚠️ Please allow access to your camera and microphone to record the interview.
      </p>
    );
  }

return (
  <div className="video-wrapper">

    {/* 🔴 Recording Dot */}
    {isRecording && (
      <div className="record-dot"></div>
    )}

    <video
      ref={videoRef}
      autoPlay
      muted
      playsInline
      className="interview-video-feed"
    />
  </div>
);

};

export default VideoRecorder;
