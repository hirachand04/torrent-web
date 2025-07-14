import React, { useState, useRef, useEffect } from 'react';
import { X, Play, Pause, Volume2, VolumeX, Maximize, Minimize, SkipBack, SkipForward } from 'lucide-react';
import './MediaPlayer.css';

const MediaPlayer = ({ stream, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showControls, setShowControls] = useState(true);
  
  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setLoading(true);
    const handleCanPlay = () => setLoading(false);
    const handleError = (e) => {
      setError('Failed to load media. The torrent might not be ready or the file format is not supported.');
      setLoading(false);
    };
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleDurationChange = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(err => {
        console.error('Play failed:', err);
        setError('Failed to play media');
      });
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;

    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    const newTime = pos * duration;
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const skip = (seconds) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  };

  const toggleFullscreen = () => {
    const player = playerRef.current;
    if (!player) return;

    if (!document.fullscreenElement) {
      player.requestFullscreen().catch(err => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const formatTime = (time) => {
    if (!time || !isFinite(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  const handleKeyDown = (e) => {
    switch (e.key) {
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowLeft':
        skip(-10);
        break;
      case 'ArrowRight':
        skip(10);
        break;
      case 'ArrowUp':
        e.preventDefault();
        handleVolumeChange({ target: { value: Math.min(1, volume + 0.1) } });
        break;
      case 'ArrowDown':
        e.preventDefault();
        handleVolumeChange({ target: { value: Math.max(0, volume - 0.1) } });
        break;
      case 'm':
        toggleMute();
        break;
      case 'f':
        toggleFullscreen();
        break;
      case 'Escape':
        if (!isFullscreen) onClose();
        break;
      default:
        break;
    }
  };

  return (
    <div 
      className={`media-player-overlay ${isFullscreen ? 'fullscreen' : ''}`}
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      ref={playerRef}
    >
      <div className="media-player">
        <button className="close-button" onClick={onClose}>
          <X />
        </button>

        <div className="media-container">
          {error ? (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={onClose} className="error-close-btn">Close</button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                src={stream.streamUrl}
                className="media-element"
                onClick={togglePlay}
                onLoadStart={() => setLoading(true)}
                onCanPlay={() => setLoading(false)}
                preload="metadata"
              />
              
              {loading && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>Loading stream...</p>
                </div>
              )}
            </>
          )}
        </div>

        {!error && (
          <div className={`controls ${showControls ? 'visible' : 'hidden'}`}>
            <div className="progress-container" onClick={handleSeek}>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="controls-row">
              <div className="controls-left">
                <button onClick={() => skip(-10)} className="control-btn">
                  <SkipBack />
                </button>
                
                <button onClick={togglePlay} className="control-btn play-btn">
                  {isPlaying ? <Pause /> : <Play />}
                </button>
                
                <button onClick={() => skip(10)} className="control-btn">
                  <SkipForward />
                </button>
                
                <div className="volume-controls">
                  <button onClick={toggleMute} className="control-btn">
                    {isMuted || volume === 0 ? <VolumeX /> : <Volume2 />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>
                
                <div className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="controls-right">
                <div className="media-title">{stream.title}</div>
                
                <button onClick={toggleFullscreen} className="control-btn">
                  {isFullscreen ? <Minimize /> : <Maximize />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPlayer;