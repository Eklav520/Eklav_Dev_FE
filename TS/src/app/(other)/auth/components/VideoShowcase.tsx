import { Container, Carousel } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";

interface Video {
  url: string;
  embedUrl: string;
  title: string;
  description: string;
  stats: string;
  duration: string;
}

const videos: Video[] = [
  {
    url: "https://www.youtube.com/watch?v=yQrXkWJtntc",
    embedUrl: "https://www.youtube.com/embed/yQrXkWJtntc",
    title: "Platform Overview",
    description:
      "Explore how Eklav helps students build industry-ready skills through real-world projects.",
    stats: "2.5K+ views",
    duration: "3:45"
  },
  {
    url: "https://www.youtube.com/watch?v=TXcLHcsEe8g",
    embedUrl: "https://www.youtube.com/embed/TXcLHcsEe8g",
    title: "Learning Experience",
    description:
      "Understand our interactive learning model and hands-on coding structure.",
    stats: "1.8K+ views",
    duration: "4:20"
  },
  {
    url: "https://www.youtube.com/watch?v=DvPi5awkLx4",
    embedUrl: "https://www.youtube.com/embed/DvPi5awkLx4",
    title: "Student Success Stories",
    description:
      "See how our learners transformed their careers with structured training.",
    stats: "3.2K+ views",
    duration: "5:15"
  }
];

const VideoShowcase = () => {
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting && isVideoPlaying) {
            // Pause video when not in view
            pauseVideo(activeVideoIndex);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (videoRefs.current[activeVideoIndex]) {
      observer.observe(videoRefs.current[activeVideoIndex]!);
    }

    return () => observer.disconnect();
  }, [activeVideoIndex, isVideoPlaying]);

  const pauseVideo = (index: number) => {
    if (videoRefs.current[index]) {
      const iframe = videoRefs.current[index];
      iframe?.contentWindow?.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
      setIsVideoPlaying(false);
    }
  };

  const playVideo = (index: number) => {
    if (videoRefs.current[index]) {
      const iframe = videoRefs.current[index];
      iframe?.contentWindow?.postMessage('{"event":"command","func":"playVideo","args":""}', '*');
      setIsVideoPlaying(true);
    }
  };

  const handleVideoSelect = (index: number) => {
    // Pause current video if playing
    if (isVideoPlaying && activeVideoIndex !== index) {
      pauseVideo(activeVideoIndex);
    }
    
    setActiveVideoIndex(index);
    setHasUserInteracted(true);
    
    // Play the selected video only after user interaction
    setTimeout(() => {
      playVideo(index);
    }, 100);
  };

  const handleCarouselChange = (index: number) => {
    // Pause video when carousel changes automatically
    pauseVideo(activeVideoIndex);
    setActiveVideoIndex(index);
    setIsVideoPlaying(false);
  };

  // Function to get YouTube video ID from URL
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  return (
    <section className="video-section w-100">
      <style>{`
        .video-section {
          width: 100%;
          text-align: center;
          position: relative;
          z-index: 2;
        }

        .section-title {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 25px;
          background: linear-gradient(135deg, #fff 0%, #ff9800 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .video-wrapper {
          width: 100%;
          max-width: 700px;
          margin: 0 auto;
        }

        .video-container {
          position: relative;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 15px 30px rgba(0,0,0,0.4);
        }

        .video-wrapper iframe {
          border-radius: 16px;
        }

        .video-stats {
          display: flex;
          gap: 20px;
          justify-content: center;
          color: #ff9800;
          font-size: 13px;
          margin-top: 10px;
        }

        .video-stats span {
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .video-title {
          font-size: 20px;
          font-weight: 600;
          margin: 15px 0 5px;
          color: white;
        }

        .video-description {
          color: #9aa4b2;
          font-size: 14px;
          line-height: 1.5;
          max-width: 600px;
          margin: 0 auto;
        }

        /* Custom Carousel Styling */
        .carousel {
          position: relative;
          width: 100%;
        }

        .carousel-control-prev,
        .carousel-control-next {
          width: 36px;
          height: 36px;
          background: rgba(255,152,0,0.2);
          border-radius: 50%;
          top: 40%;
          transform: translateY(-50%);
          opacity: 0.7;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255,152,0,0.3);
        }

        .carousel-control-prev {
          left: 5px;
        }

        .carousel-control-next {
          right: 5px;
        }

        .carousel-control-prev:hover,
        .carousel-control-next:hover {
          background: rgba(255,152,0,0.4);
        }

        .carousel-indicators {
          margin-bottom: -25px;
        }

        .carousel-indicators [data-bs-target] {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #9aa4b2;
          border: none;
          margin: 0 4px;
        }

        .carousel-indicators .active {
          background-color: #ff9800;
          transform: scale(1.2);
        }

        /* Video thumbnails */
        .video-thumbnails {
          display: flex;
          justify-content: center;
          gap: 10px;
          margin-top: 35px;
          flex-wrap: wrap;
        }

        .video-thumb {
          width: 90px;
          height: 50px;
          border-radius: 6px;
          background: linear-gradient(135deg, #2a2f38, #1e2228);
          cursor: pointer;
          position: relative;
          overflow: hidden;
          border: 2px solid transparent;
          transition: all 0.3s ease;
          background-size: cover;
          background-position: center;
        }

        .video-thumb.active {
          border-color: #ff9800;
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(255,152,0,0.3);
        }

        .video-thumb::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.4);
          transition: background 0.3s ease;
        }

        .video-thumb:hover::before {
          background: rgba(0,0,0,0.2);
        }

        .video-thumb.active::before {
          background: rgba(255,152,0,0.2);
        }

        .video-thumb i {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: white;
          font-size: 18px;
          opacity: 0.9;
          z-index: 2;
        }

        .video-thumb .duration {
          position: absolute;
          bottom: 3px;
          right: 3px;
          background: rgba(0,0,0,0.7);
          color: white;
          font-size: 9px;
          padding: 1px 3px;
          border-radius: 2px;
          z-index: 2;
        }

        @media (max-width: 991px) {
          .video-section {
            margin-bottom: 30px;
          }
          
          .video-wrapper {
            max-width: 100%;
          }
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 24px;
          }

          .video-title {
            font-size: 18px;
          }

          .video-description {
            font-size: 13px;
            padding: 0 10px;
          }

          .carousel-control-prev,
          .carousel-control-next {
            display: none;
          }

          .video-thumb {
            width: 80px;
            height: 45px;
          }
        }
      `}</style>

      {/* Add YouTube iframe API */}
      <script src="https://www.youtube.com/iframe_api" />

      <Container fluid className="px-3 px-xl-4">
        <h2 className="section-title">See Eklav in Action</h2>
        
        <Carousel 
          indicators 
          controls 
          interval={null} // Disable auto-slide
          activeIndex={activeVideoIndex}
          onSelect={handleCarouselChange}
          pause="hover"
          className="video-carousel"
          wrap={false}
        >
          {videos.map((video, index) => (
            <Carousel.Item key={index}>
              <div className="video-wrapper">
                <div className="video-container">
                  <div className="ratio ratio-16x9">
                    <iframe
                      ref={el => videoRefs.current[index] = el}
                      src={`${video.embedUrl}?enablejsapi=1&autoplay=0&rel=0&modestbranding=1&controls=1`}
                      title={video.title}
                      allowFullScreen
                      frameBorder="0"
                      loading="lazy"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                </div>

                <h3 className="video-title">{video.title}</h3>
                <p className="video-description">
                  {video.description}
                </p>
                <div className="video-stats">
                  <span>
                    <i className="bi bi-eye"></i> {video.stats}
                  </span>
                  <span>
                    <i className="bi bi-clock"></i> {video.duration}
                  </span>
                </div>
              </div>
            </Carousel.Item>
          ))}
        </Carousel>

        {/* Video thumbnails */}
        <div className="video-thumbnails">
          {videos.map((video, index) => {
            const videoId = getYouTubeId(video.url);
            return (
              <div
                key={index}
                className={`video-thumb ${index === activeVideoIndex ? 'active' : ''}`}
                onClick={() => handleVideoSelect(index)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && handleVideoSelect(index)}
                style={{
                  backgroundImage: videoId ? `url(https://img.youtube.com/vi/${videoId}/mqdefault.jpg)` : 'none'
                }}
              >
                <i className="bi bi-play-circle-fill"></i>
                <span className="duration">{video.duration}</span>
              </div>
            );
          })}
        </div>
      </Container>
    </section>
  );
};

export default VideoShowcase;