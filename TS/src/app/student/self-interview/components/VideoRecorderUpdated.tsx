// VideoRecorderUpdated.tsx - Fixed version
import React, { useEffect, useRef, useState } from 'react';

interface VideoRecorderUpdatedProps {
  interviewId: string;
  token?: string;
  stopRecording: boolean;
  onVideoUpload?: (url: string) => void;
  onRecordingError?: (error: string) => void;
  onVideoElementReady?: (video: HTMLVideoElement) => void;
}

const VideoRecorderUpdated: React.FC<VideoRecorderUpdatedProps> = ({
  interviewId,
  token,
  stopRecording: shouldStopRecording,
  onVideoUpload,
  onRecordingError,
  onVideoElementReady,
}) => {
  const baseURL = import.meta.env.VITE_API_BASE_URL;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [hasPermission, setHasPermission] = useState(true);
  const [error, setError] = useState<string>('');
  const questionCountRef = useRef(0);

  // Initialize stream only once
  const initStream = async () => {
    try {
      console.log('Initializing video stream...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      streamRef.current = stream;
      
      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        videoRef.current.play().catch(e => console.warn('Video play error:', e));
        onVideoElementReady?.(videoRef.current);
      }

      // Setup media recorder
      const options = { 
        mimeType: 'video/webm; codecs=vp8,opus',
        audioBitsPerSecond: 128000,
        videoBitsPerSecond: 2500000
      };

      let mediaRecorder;
      if (MediaRecorder.isTypeSupported('video/webm; codecs=vp8,opus')) {
        mediaRecorder = new MediaRecorder(stream, options);
      } else {
        mediaRecorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped, uploading...');
        if (chunksRef.current.length > 0) {
          const blob = new Blob(chunksRef.current, { type: 'video/webm' });
          await uploadVideo(blob);
          chunksRef.current = [];
        }
      };

      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
        setError('Recording error occurred');
      };

      // Start recording immediately
      startRecordingSession();

    } catch (err) {
      console.error('Failed to initialize stream:', err);
      setHasPermission(false);
      setError('Camera/microphone access denied');
      onRecordingError?.('Camera/microphone access denied');
    }
  };

  const startRecordingSession = () => {
    if (!mediaRecorderRef.current || isRecording) return;
    
    try {
      if (mediaRecorderRef.current.state === 'inactive') {
        mediaRecorderRef.current.start(1000); // Timeslice of 1 second
        setIsRecording(true);
        console.log('Recording started');
      }
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  };

  const stopRecordingSession = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    
    try {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        setIsRecording(false);
        console.log('Recording stopped');
      }
    } catch (err) {
      console.error('Failed to stop recording:', err);
    }
  };

  const uploadVideo = async (blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append('interviewId', interviewId);
      formData.append('questionIndex', questionCountRef.current.toString());
      formData.append('video', blob, `interview-${interviewId}-q${questionCountRef.current}.webm`);

      const response = await fetch(`${baseURL}/upload-video`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Video uploaded:', result);

      if (result.videoUrl && onVideoUpload) {
        onVideoUpload(result.videoUrl);
      }

      questionCountRef.current += 1;

      // Immediately start recording for next question
      setTimeout(() => {
        if (streamRef.current && mediaRecorderRef.current) {
          startRecordingSession();
        }
      }, 100);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload video');
    }
  };

  const cleanup = () => {
    console.log('Cleaning up video recorder...');
    stopRecordingSession();
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    mediaRecorderRef.current = null;
  };

  // Initialize on mount
  useEffect(() => {
    initStream();
    
    return () => {
      cleanup();
    };
  }, []);

  // Handle shouldStopRecording prop changes
  useEffect(() => {
    console.log('stopRecording prop changed:', shouldStopRecording);
    
    if (shouldStopRecording && isRecording) {
      stopRecordingSession();
    } else if (!shouldStopRecording && !isRecording && streamRef.current) {
      // Start recording again if stream exists
      setTimeout(() => {
        startRecordingSession();
      }, 300);
    }
  }, [shouldStopRecording]);

  if (!hasPermission) {
    return (
      <div className="video-fallback">
        <div className="camera-icon">📷</div>
        <p>Camera access required</p>
        <button 
          onClick={() => window.location.reload()}
          className="btn btn-sm btn-primary"
        >
          Reload & Grant Access
        </button>
      </div>
    );
  }

  return (
    <div className="video-container">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="video-feed"
      />
      
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          <span>Recording...</span>
        </div>
      )}
      
      {error && (
        <div className="error-overlay">
          <small>{error}</small>
        </div>
      )}
    </div>
  );
};

export default VideoRecorderUpdated;