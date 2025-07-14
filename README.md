# TorrentWeb - Universal Torrent Platform

A full-stack torrent search and streaming platform that allows users to search for any type of content including movies, TV series, audio/music, eBooks, software, games, and more.

## Features

🔍 **Universal Search**
- Search across multiple torrent sources (1337x, YTS)
- Support for all content types: movies, TV shows, music, games, books, software
- Real-time search results with detailed information

🎬 **Streaming & Download**
- Stream video and audio files directly in the browser
- Download any torrent file
- Built-in media player with full controls
- Support for popular formats: MP4, MKV, AVI, MP3, WAV, FLAC

🎨 **Modern UI**
- Clean, responsive design
- Mobile-friendly interface
- Category filtering
- Real-time torrent information (seeders, leechers, file size)

## Tech Stack

**Backend:**
- Node.js + Express
- WebTorrent for magnet link handling
- Axios for API requests
- Cheerio for web scraping

**Frontend:**
- React 18
- Modern CSS with gradients and animations
- Lucide React icons
- Responsive design

## Installation

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Setup

1. **Clone or navigate to the project directory:**
   ```bash
   cd torrentweb
   ```

2. **Install backend dependencies:**
   ```bash
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Build the React frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

## Usage

### Development Mode

1. **Start the backend server:**
   ```bash
   npm run dev
   ```
   The server will run on `http://localhost:3001`

2. **In a separate terminal, start the React development server:**
   ```bash
   cd client
   npm start
   ```
   The frontend will run on `http://localhost:3000`

### Production Mode

1. **Build the frontend:**
   ```bash
   cd client
   npm run build
   cd ..
   ```

2. **Start the production server:**
   ```bash
   npm start
   ```
   The application will be available at `http://localhost:3001`

## API Endpoints

### Search
- `GET /api/search?q={query}&category={category}`
  - Search for torrents across multiple sources
  - Returns: Array of torrent results with metadata

### Streaming
- `GET /api/stream?magnet={magnetLink}&file={fileName}`
  - Stream video/audio files from magnet links
  - Supports range requests for seeking

### Download
- `GET /api/download?magnet={magnetLink}&file={fileName}`
  - Download files from magnet links
  - Returns: File stream with appropriate headers

### Torrent Info
- `GET /api/torrent-info?magnet={magnetLink}`
  - Get detailed information about a torrent
  - Returns: File list, sizes, and metadata

### Magnet Links
- `GET /api/magnet?url={detailUrl}`
  - Extract magnet links from torrent detail pages
  - Returns: Magnet link for the torrent

## Features in Detail

### Search Functionality
- **Multi-source search**: Combines results from 1337x and YTS
- **Category filtering**: Filter by movies, TV shows, music, games, books
- **Smart sorting**: Results sorted by seeders for better availability
- **Detailed metadata**: File size, seeders, leechers, uploader info

### Streaming Capabilities
- **WebTorrent integration**: Direct magnet link streaming
- **Format support**: MP4, MKV, AVI, MOV, MP3, WAV, FLAC, M4A
- **Progressive loading**: Start watching while downloading
- **Range requests**: Seeking support for video files

### Media Player
- **Full controls**: Play/pause, seek, volume, fullscreen
- **Keyboard shortcuts**: Space (play/pause), arrows (seek/volume), F (fullscreen)
- **Responsive design**: Works on desktop and mobile
- **Auto-hide controls**: Clean viewing experience

### Download System
- **Direct downloads**: Stream files directly to browser
- **File selection**: Choose specific files from multi-file torrents
- **Progress indication**: Real-time download status

## Security & Legal Notes

⚠️ **Important Disclaimers:**

1. **Legal Compliance**: This platform is for educational purposes. Users are responsible for ensuring they comply with local laws and regulations regarding torrent usage.

2. **Content Responsibility**: The platform does not host any content. It only provides search functionality and streaming capabilities for publicly available torrent files.

3. **Copyright**: Respect copyright laws. Only download and stream content you have the legal right to access.

4. **Security**: The application includes basic security measures, but users should be cautious when downloading files from unknown sources.

## Troubleshooting

### Common Issues

1. **Streaming not working:**
   - Check if the torrent has sufficient seeders
   - Ensure the file format is supported
   - Try a different torrent for the same content

2. **Search returning no results:**
   - Check your internet connection
   - Try different search terms
   - Some torrent sites may be temporarily unavailable

3. **Download fails:**
   - Verify the magnet link is valid
   - Check available disk space
   - Ensure the torrent is still active

### Performance Tips

- **Better streaming**: Choose torrents with higher seeder counts
- **Faster searches**: Use specific keywords rather than generic terms
- **Stable playback**: Allow some buffering time before starting playback

## Contributing

Contributions are welcome! Please feel free to submit issues, feature requests, or pull requests.

## License

MIT License - see LICENSE file for details.

---

**Disclaimer**: This software is provided for educational purposes only. Users are solely responsible for their use of this software and must comply with applicable laws and regulations.