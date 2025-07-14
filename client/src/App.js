import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Download, Play, Film, Music, Book, Monitor, Gamepad2, Archive, Users, Wifi, WifiOff, Loader } from 'lucide-react';
import MediaPlayer from './components/MediaPlayer';
import './App.css';

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentStream, setCurrentStream] = useState(null);
  const [showPlayer, setShowPlayer] = useState(false);

  const categories = [
    { id: 'all', name: 'All', icon: Archive },
    { id: 'movies', name: 'Movies', icon: Film },
    { id: 'tv', name: 'TV Shows', icon: Monitor },
    { id: 'music', name: 'Music', icon: Music },
    { id: 'games', name: 'Games', icon: Gamepad2 },
    { id: 'books', name: 'Books', icon: Book }
  ];

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/search', {
        params: {
          q: query,
          category: selectedCategory !== 'all' ? selectedCategory : ''
        }
      });
      setResults(response.data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getMagnetLink = async (result) => {
    if (result.magnetLink) {
      return result.magnetLink;
    }
    
    try {
      const response = await axios.get('/api/magnet', {
        params: { url: result.detailUrl }
      });
      return response.data.magnetLink;
    } catch (error) {
      console.error('Failed to get magnet link:', error);
      return null;
    }
  };

  const handleStream = async (result) => {
    const magnetLink = await getMagnetLink(result);
    if (!magnetLink) {
      alert('Could not get magnet link for streaming');
      return;
    }
    
    setCurrentStream({
      title: result.title,
      magnetLink,
      streamUrl: `/api/stream?magnet=${encodeURIComponent(magnetLink)}`
    });
    setShowPlayer(true);
  };

  const handleDownload = async (result) => {
    const magnetLink = await getMagnetLink(result);
    if (!magnetLink) {
      alert('Could not get magnet link for download');
      return;
    }
    
    const downloadUrl = `/api/download?magnet=${encodeURIComponent(magnetLink)}`;
    window.open(downloadUrl, '_blank');
  };

  const getCategoryIcon = (category) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('movie') || lowerCategory.includes('film')) return Film;
    if (lowerCategory.includes('tv') || lowerCategory.includes('series')) return Monitor;
    if (lowerCategory.includes('music') || lowerCategory.includes('audio')) return Music;
    if (lowerCategory.includes('game')) return Gamepad2;
    if (lowerCategory.includes('book') || lowerCategory.includes('ebook')) return Book;
    return Archive;
  };

  const isStreamable = (title, category) => {
    const streamableFormats = ['.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.flac', '.m4a'];
    const lowerTitle = title.toLowerCase();
    const lowerCategory = category.toLowerCase();
    
    return streamableFormats.some(format => lowerTitle.includes(format)) ||
           lowerCategory.includes('movie') ||
           lowerCategory.includes('tv') ||
           lowerCategory.includes('music') ||
           lowerCategory.includes('audio');
  };

  return (
    <div className="app">
      <header className="header">
        <div className="container">
          <h1 className="logo">
            <Archive className="logo-icon" />
            TorrentWeb
          </h1>
          <p className="tagline">Universal Torrent Search & Streaming Platform</p>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="search-section">
            <form onSubmit={handleSearch} className="search-form">
              <div className="search-input-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search for movies, TV shows, music, games, books, software..."
                  className="search-input"
                  disabled={loading}
                />
                <button type="submit" className="search-button" disabled={loading || !query.trim()}>
                  {loading ? <Loader className="spinner" /> : 'Search'}
                </button>
              </div>
            </form>

            <div className="category-filters">
              {categories.map(category => {
                const IconComponent = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`category-button ${selectedCategory === category.id ? 'active' : ''}`}
                  >
                    <IconComponent className="category-icon" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {results.length > 0 && (
            <div className="results-section">
              <h2 className="results-title">
                Found {results.length} results for "{query}"
              </h2>
              
              <div className="results-grid">
                {results.map((result, index) => {
                  const CategoryIcon = getCategoryIcon(result.category);
                  const streamable = isStreamable(result.title, result.category);
                  
                  return (
                    <div key={index} className="result-card">
                      <div className="result-header">
                        <CategoryIcon className="result-category-icon" />
                        <span className="result-category">{result.category}</span>
                      </div>
                      
                      <h3 className="result-title">{result.title}</h3>
                      
                      <div className="result-meta">
                        <div className="result-size">
                          <Archive className="meta-icon" />
                          {result.size}
                        </div>
                        
                        <div className="result-peers">
                          <div className="seeders">
                            <Wifi className="meta-icon" />
                            {result.seeders}
                          </div>
                          <div className="leechers">
                            <WifiOff className="meta-icon" />
                            {result.leechers}
                          </div>
                        </div>
                      </div>
                      
                      {result.uploader && (
                        <div className="result-uploader">
                          <Users className="meta-icon" />
                          {result.uploader}
                        </div>
                      )}
                      
                      <div className="result-actions">
                        {streamable && (
                          <button
                            onClick={() => handleStream(result)}
                            className="action-button stream-button"
                          >
                            <Play className="action-icon" />
                            Stream
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDownload(result)}
                          className="action-button download-button"
                        >
                          <Download className="action-icon" />
                          Download
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {loading && (
            <div className="loading-section">
              <Loader className="loading-spinner" />
              <p>Searching torrents...</p>
            </div>
          )}
        </div>
      </main>

      {showPlayer && currentStream && (
        <MediaPlayer
          stream={currentStream}
          onClose={() => {
            setShowPlayer(false);
            setCurrentStream(null);
          }}
        />
      )}
    </div>
  );
}

export default App;