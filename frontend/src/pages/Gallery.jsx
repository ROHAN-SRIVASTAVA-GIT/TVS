import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axios';
import './Gallery.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getImageStreamUrl = (imageId) => {
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/gallery/${imageId}/stream`;
};

const getVideoStreamUrl = (videoId) => {
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/gallery/video/${videoId}/stream`;
};

const Gallery = () => {
  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchGallery();
    fetchVideos();
  }, []);

  const fetchGallery = async () => {
    try {
      const response = await axiosInstance.get('/gallery');
      let galleryItems = [];
      if (response?.data?.items) {
        galleryItems = response.data.items.filter(item => item.image_url);
      } else if (Array.isArray(response)) {
        galleryItems = response.filter(item => item.image_url);
      } else if (response?.data) {
        galleryItems = Array.isArray(response.data) ? response.data.filter(item => item.image_url) : [];
      }
      setImages(galleryItems);
    } catch (err) {
      console.error('Failed to fetch gallery:', err);
    }
  };

  const fetchVideos = async () => {
    try {
      const response = await axiosInstance.get('/gallery/video');
      let videoItems = [];
      if (response?.data?.items) {
        videoItems = response.data.items;
      } else if (Array.isArray(response)) {
        videoItems = response;
      } else if (response?.data) {
        videoItems = Array.isArray(response.data) ? response.data : [];
      }
      setVideos(videoItems);
    } catch (err) {
      console.error('Failed to fetch videos:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredImages = activeTab === 'all' || activeTab === 'images' ? images : [];
  const filteredVideos = activeTab === 'all' || activeTab === 'videos' ? videos : [];

  return (
    <div className="gallery-container">
      <div className="gallery-header">
        <h1>School Gallery</h1>
        <p>Explore our campus and events</p>
      </div>

      <div className="gallery-tabs">
        <button 
          className={`gallery-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Media
        </button>
        <button 
          className={`gallery-tab ${activeTab === 'images' ? 'active' : ''}`}
          onClick={() => setActiveTab('images')}
        >
          Images
        </button>
        <button 
          className={`gallery-tab ${activeTab === 'videos' ? 'active' : ''}`}
          onClick={() => setActiveTab('videos')}
        >
          Videos ({videos.length})
        </button>
      </div>

      {loading ? (
        <div className="loading">Loading gallery...</div>
      ) : (
        <>
          {(activeTab === 'all' || activeTab === 'images') && filteredImages.length > 0 && (
            <div className="gallery-section">
              <h2 className="section-title">Images</h2>
              <div className="gallery-grid">
                {filteredImages.map((image) => (
                  <div
                    key={`img-${image.id}`}
                    className="gallery-item"
                    onClick={() => setSelectedImage(image)}
                  >
                    <img 
                      src={getImageStreamUrl(image.id)} 
                      alt={image.title} 
                      loading="lazy"
                      onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'; }} 
                    />
                    <div className="gallery-overlay">
                      <h3>{image.title}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(activeTab === 'all' || activeTab === 'videos') && filteredVideos.length > 0 && (
            <div className="gallery-section">
              <h2 className="section-title">Videos</h2>
              <div className="video-gallery-grid">
                {filteredVideos.map((video) => (
                  <div
                    key={`vid-${video.id}`}
                    className="video-gallery-item"
                    onClick={() => setSelectedVideo(video)}
                  >
                    <div className="video-thumbnail">
                      {video.thumbnail ? (
                        <img 
                          src={getMediaUrl(video.thumbnail)} 
                          alt={video.title}
                          loading="lazy"
                        />
                      ) : (
                        <div className="video-placeholder">
                          <span className="play-icon">▶</span>
                        </div>
                      )}
                      <div className="video-play-overlay">
                        <span className="play-button">▶</span>
                      </div>
                    </div>
                    <div className="video-info">
                      <h3>{video.title}</h3>
                      {video.description && <p>{video.description.substring(0, 60)}...</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {filteredImages.length === 0 && filteredVideos.length === 0 && (
            <div className="empty-gallery">
              <p>No media available yet.</p>
            </div>
          )}
        </>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div className="lightbox" onClick={() => setSelectedImage(null)}>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setSelectedImage(null)}>×</span>
            <img 
              src={getImageStreamUrl(selectedImage.id)} 
              alt={selectedImage.title} 
              onError={(e) => { e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext x="50%25" y="50%25" font-size="20" fill="%23999" text-anchor="middle" dy=".3em"%3ENo Image%3C/text%3E%3C/svg%3E'; }} 
            />
            <h3>{selectedImage.title}</h3>
            {selectedImage.description && <p>{selectedImage.description}</p>}
          </div>
        </div>
      )}

      {/* Video Modal */}
      {selectedVideo && (
        <div className="lightbox video-lightbox" onClick={() => setSelectedVideo(null)}>
          <div className="lightbox-content video-lightbox-content" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={() => setSelectedVideo(null)}>×</span>
            <video
              key={selectedVideo.id}
              controls
              autoPlay
              className="video-player"
              preload="metadata"
            >
              <source src={getVideoStreamUrl(selectedVideo.id)} type={selectedVideo.video_mime_type || "video/mp4"} />
              Your browser does not support the video tag.
            </video>
            <div className="video-details">
              <h3>{selectedVideo.title}</h3>
              {selectedVideo.description && <p>{selectedVideo.description}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
