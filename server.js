const express = require('express');
const cors = require('cors');
const WebTorrent = require('webtorrent');
const axios = require('axios');
const cheerio = require('cheerio');
const mime = require('mime-types');
const path = require('path');
const fs = require('fs');

const app = express();
const client = new WebTorrent();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'client/build')));

// Store active torrents
const activeTorrents = new Map();

// Torrent search function using 1337x scraping
async function search1337x(query, category = '') {
  try {
    const searchUrl = `https://1337x.to/search/${encodeURIComponent(query)}/1/`;
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const results = [];
    
    $('tbody tr').each((i, element) => {
      if (i === 0) return; // Skip header
      
      const $row = $(element);
      const nameCell = $row.find('.name');
      const title = nameCell.find('a:last-child').text().trim();
      const detailLink = nameCell.find('a:last-child').attr('href');
      
      if (title && detailLink) {
        const seeders = parseInt($row.find('.seeds').text()) || 0;
        const leechers = parseInt($row.find('.leeches').text()) || 0;
        const size = $row.find('td:nth-child(5)').text().trim();
        const uploader = $row.find('.user').text().trim();
        const category = $row.find('.icon').attr('title') || 'Unknown';
        
        results.push({
          title,
          size,
          seeders,
          leechers,
          category,
          uploader,
          detailUrl: `https://1337x.to${detailLink}`,
          magnetLink: null // Will be fetched separately
        });
      }
    });
    
    return results.slice(0, 20); // Limit to 20 results
  } catch (error) {
    console.error('1337x search error:', error.message);
    return [];
  }
}

// Get magnet link from detail page
async function getMagnetLink(detailUrl) {
  try {
    const response = await axios.get(detailUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    const magnetLink = $('a[href^="magnet:"]').attr('href');
    return magnetLink;
  } catch (error) {
    console.error('Error fetching magnet link:', error.message);
    return null;
  }
}

// Alternative search using YTS API for movies
async function searchYTS(query) {
  try {
    const response = await axios.get(`https://yts.mx/api/v2/list_movies.json`, {
      params: {
        query_term: query,
        limit: 20
      },
      timeout: 10000
    });
    
    if (response.data.status === 'ok' && response.data.data.movies) {
      return response.data.data.movies.map(movie => ({
        title: `${movie.title} (${movie.year})`,
        size: movie.torrents?.[0]?.size || 'Unknown',
        seeders: movie.torrents?.[0]?.seeds || 0,
        leechers: movie.torrents?.[0]?.peers || 0,
        category: 'Movies',
        uploader: 'YTS',
        detailUrl: movie.url,
        magnetLink: movie.torrents?.[0]?.url || null,
        quality: movie.torrents?.[0]?.quality || 'Unknown'
      }));
    }
    return [];
  } catch (error) {
    console.error('YTS search error:', error.message);
    return [];
  }
}

// Search endpoint
app.get('/api/search', async (req, res) => {
  const { q: query, category } = req.query;
  
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }
  
  try {
    console.log(`Searching for: ${query}`);
    
    // Search both sources
    const [results1337x, resultsYTS] = await Promise.all([
      search1337x(query, category),
      searchYTS(query)
    ]);
    
    // Combine and deduplicate results
    const allResults = [...results1337x, ...resultsYTS];
    const uniqueResults = allResults.filter((result, index, self) => 
      index === self.findIndex(r => r.title === result.title)
    );
    
    // Sort by seeders (descending)
    uniqueResults.sort((a, b) => b.seeders - a.seeders);
    
    res.json({
      success: true,
      results: uniqueResults,
      total: uniqueResults.length
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Get magnet link endpoint
app.get('/api/magnet', async (req, res) => {
  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }
  
  try {
    const magnetLink = await getMagnetLink(url);
    if (magnetLink) {
      res.json({ success: true, magnetLink });
    } else {
      res.status(404).json({ error: 'Magnet link not found' });
    }
  } catch (error) {
    console.error('Magnet fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch magnet link' });
  }
});

// Stream endpoint
app.get('/api/stream', (req, res) => {
  const { magnet, file } = req.query;
  
  if (!magnet) {
    return res.status(400).json({ error: 'Magnet link is required' });
  }
  
  const torrentId = magnet;
  
  // Check if torrent is already added
  let torrent = client.get(torrentId);
  
  if (!torrent) {
    console.log('Adding new torrent:', magnet.substring(0, 50) + '...');
    torrent = client.add(magnet, { path: './downloads' });
    
    torrent.on('error', (err) => {
      console.error('Torrent error:', err);
      res.status(500).json({ error: 'Torrent error: ' + err.message });
    });
  }
  
  torrent.on('ready', () => {
    console.log('Torrent ready. Files:', torrent.files.map(f => f.name));
    
    let targetFile;
    
    if (file) {
      // Find specific file
      targetFile = torrent.files.find(f => f.name.includes(file) || f.name === file);
    } else {
      // Find largest video/audio file
      const mediaFiles = torrent.files.filter(f => {
        const ext = path.extname(f.name).toLowerCase();
        return ['.mp4', '.mkv', '.avi', '.mov', '.mp3', '.wav', '.flac', '.m4a'].includes(ext);
      });
      targetFile = mediaFiles.sort((a, b) => b.length - a.length)[0];
    }
    
    if (!targetFile) {
      return res.status(404).json({ error: 'No streamable file found' });
    }
    
    console.log('Streaming file:', targetFile.name);
    
    const range = req.headers.range;
    const fileSize = targetFile.length;
    const mimeType = mime.lookup(targetFile.name) || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Accept-Ranges', 'bytes');
    
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);
      
      const stream = targetFile.createReadStream({ start, end });
      stream.pipe(res);
    } else {
      res.setHeader('Content-Length', fileSize);
      const stream = targetFile.createReadStream();
      stream.pipe(res);
    }
  });
  
  // Set timeout for torrent ready
  setTimeout(() => {
    if (!torrent.ready) {
      res.status(408).json({ error: 'Torrent loading timeout' });
    }
  }, 30000);
});

// Download endpoint
app.get('/api/download', (req, res) => {
  const { magnet, file } = req.query;
  
  if (!magnet) {
    return res.status(400).json({ error: 'Magnet link is required' });
  }
  
  const torrent = client.add(magnet, { path: './downloads' });
  
  torrent.on('ready', () => {
    let targetFile;
    
    if (file) {
      targetFile = torrent.files.find(f => f.name.includes(file) || f.name === file);
    } else {
      targetFile = torrent.files.sort((a, b) => b.length - a.length)[0];
    }
    
    if (!targetFile) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.setHeader('Content-Disposition', `attachment; filename="${targetFile.name}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Length', targetFile.length);
    
    const stream = targetFile.createReadStream();
    stream.pipe(res);
  });
  
  torrent.on('error', (err) => {
    res.status(500).json({ error: 'Download error: ' + err.message });
  });
});

// Get torrent info endpoint
app.get('/api/torrent-info', (req, res) => {
  const { magnet } = req.query;
  
  if (!magnet) {
    return res.status(400).json({ error: 'Magnet link is required' });
  }
  
  const torrent = client.add(magnet, { path: './downloads' });
  
  torrent.on('ready', () => {
    const files = torrent.files.map(file => ({
      name: file.name,
      size: file.length,
      type: mime.lookup(file.name) || 'unknown'
    }));
    
    res.json({
      success: true,
      name: torrent.name,
      files,
      totalSize: torrent.length
    });
  });
  
  torrent.on('error', (err) => {
    res.status(500).json({ error: 'Failed to load torrent info' });
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client/build/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 TorrentWeb server running on port ${PORT}`);
  console.log(`📡 WebTorrent client ready`);
});

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  client.destroy(() => {
    process.exit(0);
  });
});