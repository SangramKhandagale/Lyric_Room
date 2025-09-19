"use client"
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence} from 'framer-motion';
import { Search, Music, BookOpen, Mic, Loader2, AlertCircle, Copy, ExternalLink, Award, Disc, Calendar, User, PenTool, Film, Languages, Clock, Disc3, GanttChart, Sun, Moon,  Sparkles, Play, Heart } from 'lucide-react';
import { handleMusicQuery, MusicResponse, SongInfo, StorySummary, ContinuationLyrics } from './api/musicService';

const ModernMusicWebsite = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<MusicResponse | null>(null);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from system preference
  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(prefersDark);
  }, []);
  // Apply theme changes
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const handleSearch = async () => {
    if (!query.trim()) {
      setError('Please enter a song name or music query');
      return;
    }

    setLoading(true);
    setError('');
    setResponse(null);

    try {
      const result = await handleMusicQuery(query);
      setResponse(result);
      if (!result.success) {
        setError(result.error || 'Something went wrong');
      }
    } catch (err) {
      setError('Failed to process your request. Please try again.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  const renderSongInfo = (info: SongInfo) => {
    const isHindi = info.language === 'hindi';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="result-card"
      >
        <div className="card-header">
          <div className="card-icon music-icon">
            <Music className="w-6 h-6" />
          </div>
          <h2 className="card-title">
            {isHindi ? 'गीत की विस्तृत जानकारी' : 'Song Information'}
          </h2>
        </div>
        
        <div className="song-highlight">
          <h3 className="song-title">{info.title}</h3>
          {info.description && (
            <p className="song-description">{info.description}</p>
          )}
        </div>

        <div className="info-grid">
          {[
            
            info.playbackSinger && info.playbackSinger !== info.artist && { icon: Mic, label: isHindi ? 'प्लेबैक सिंगर' : 'Playback Singer', value: info.playbackSinger },
            info.composer && { icon: Music, label: isHindi ? 'संगीत निर्देशक' : 'Music Director', value: info.composer },
            info.lyricist && { icon: PenTool, label: isHindi ? 'गीतकार' : 'Lyricist', value: info.lyricist },
            info.director && { icon: Film, label: isHindi ? 'फिल्म निर्देशक' : 'Film Director', value: info.director },
            info.movie && { icon: Film, label: isHindi ? 'फिल्म' : 'Movie', value: info.movie },
            info.year && { icon: Calendar, label: isHindi ? 'रिलीज़ वर्ष' : 'Release Year', value: info.year },
            info.language && { icon: Languages, label: isHindi ? 'भाषा' : 'Language', value: info.language },
            info.album && { icon: Disc, label: isHindi ? 'एल्बम' : 'Album', value: info.album },
            info.genre && { icon: Disc3, label: isHindi ? 'शैली' : 'Genre', value: info.genre },
            info.duration && { icon: Clock, label: isHindi ? 'अवधि' : 'Duration', value: info.duration },
            info.recordLabel && { icon: GanttChart, label: isHindi ? 'रिकॉर्ड लेबल' : 'Record Label', value: info.recordLabel },
            info.popularityRating && { icon: Award, label: isHindi ? 'लोकप्रियता' : 'Popularity', value: info.popularityRating }
          ].filter(Boolean).map((item, index) => (
            item ? (
              <motion.div
                key={index}
                variants={itemVariants}
                className="info-item"
              >
                <item.icon className="info-icon" />
                <div className="info-content">
                  <span className="info-label">{item.label}</span>
                  <span className="info-value">{item.value}</span>
                </div>
              </motion.div>
            ) : null
          ))}
        </div>

        {info.awards && info.awards.length > 0 && (
          <div className="awards-section">
            <h4 className="section-title">
              <Award className="w-5 h-5" />
              {isHindi ? 'पुरस्कार और सम्मान' : 'Awards & Recognition'}
            </h4>
            <div className="awards-list">
              {info.awards.map((award, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="award-item"
                >
                  <span className="award-bullet">✨</span>
                  <span>{award}</span>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {info.legalLinks && info.legalLinks.length > 0 && (
          <div className="links-section">
            <h4 className="section-title">
              <ExternalLink className="w-5 h-5" />
              {isHindi ? 'गीत सुनने और बोल देखने के लिए' : 'Listen & Find Lyrics'}
            </h4>
            <div className="links-grid">
              {info.legalLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-item"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Play className="w-4 h-4" />
                  {new URL(link).hostname.replace('www.', '')}
                </motion.a>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    );
  };

  const renderStorySummary = (story: StorySummary) => {
    const isHindi = story.language === 'hindi';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="result-card"
      >
        <div className="card-header">
          <div className="card-icon story-icon">
            <BookOpen className="w-6 h-6" />
          </div>
          <h2 className="card-title">
            {isHindi ? 'गीत की कहानी' : 'Musical Story'}
          </h2>
        </div>
        
        <div className="story-highlight">
          <h3 className="story-title">{story.title}</h3>
          <div className="story-content">
            {story.summary.split('\n').map((paragraph, index) => (
              <motion.p 
                key={index} 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                {paragraph}
              </motion.p>
            ))}
          </div>
        </div>

        <div className="story-meta">
          {story.themes && story.themes.length > 0 && (
            <div className="meta-section">
              <h4 className="meta-title">
                {isHindi ? 'मुख्य विषय' : 'Main Themes'}
              </h4>
              <div className="tag-container">
                {story.themes.map((theme, index) => (
                  <motion.span
                    key={index}
                    className="tag theme-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {theme}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
          
          {story.mood && (
            <div className="meta-section">
              <h4 className="meta-title">
                {isHindi ? 'भावनात्मक रंग' : 'Emotional Tone'}
              </h4>
              <span className="tag mood-tag">{story.mood}</span>
            </div>
          )}
          
          {story.characters && story.characters.length > 0 && (
            <div className="meta-section">
              <h4 className="meta-title">
                {isHindi ? 'मुख्य पात्र' : 'Main Characters'}
              </h4>
              <div className="tag-container">
                {story.characters.map((character, index) => (
                  <motion.span
                    key={index}
                    className="tag character-tag"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * index }}
                    whileHover={{ scale: 1.1 }}
                  >
                    {character}
                  </motion.span>
                ))}
              </div>
            </div>
          )}
          
          {story.culturalContext && (
            <div className="meta-section">
              <h4 className="meta-title">
                {isHindi ? 'सांस्कृतिक संदर्भ' : 'Cultural Context'}
              </h4>
              <p className="context-text">{story.culturalContext}</p>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderContinuationLyrics = (lyrics: ContinuationLyrics) => {
    const isHindi = lyrics.language === 'hindi';
    
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="result-card"
      >
        <div className="card-header">
          <div className="card-icon lyrics-icon">
            <Mic className="w-6 h-6" />
          </div>
          <h2 className="card-title">
            {isHindi ? 'नए मौलिक श्लोक' : 'Original Verses'}
          </h2>
        </div>
        
        <div className="lyrics-highlight">
          <h3 className="lyrics-title">
            {isHindi ? 'प्रेरणा स्रोत' : 'Inspired by'} {lyrics.originalSong}
          </h3>
          <p className="lyrics-disclaimer">
            {isHindi ? 'ये पूरी तरह से मौलिक रचनाएं हैं जो मूल गीत से प्रेरित हैं' : 'These are completely original compositions inspired by the original song'}
          </p>
        </div>

        <div className="verses-container">
          {lyrics.newVerses.map((verse, index) => (
            <motion.div
              key={index}
              className="verse-card"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 * index }}
            >
              <div className="verse-header">
                <h4 className="verse-title">
                  {isHindi ? 'श्लोक' : 'Verse'} {index + 1}
                </h4>
                <div className="verse-actions">
                  <motion.button
                    onClick={() => copyToClipboard(verse)}
                    className="action-btn copy-btn"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title={isHindi ? 'कॉपी करें' : 'Copy verse'}
                  >
                    <Copy className="w-4 h-4" />
                  </motion.button>
                  <motion.button
                    className="action-btn favorite-btn"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    title="Add to favorites"
                  >
                    <Heart className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
              <div className="verse-content">
                {verse}
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lyrics-meta">
          <div className="meta-item">
            <span className="meta-label">{isHindi ? 'संगीत शैली' : 'Musical Style'}</span>
            <span className="tag style-tag">{lyrics.style}</span>
          </div>
          
          <div className="meta-item">
            <span className="meta-label">{isHindi ? 'मुख्य विषय' : 'Main Theme'}</span>
            <span className="tag theme-tag">{lyrics.theme}</span>
          </div>
          
          {lyrics.rhythmPattern && (
            <div className="meta-item">
              <span className="meta-label">{isHindi ? 'छंद पैटर्न' : 'Rhythm Pattern'}</span>
              <span className="tag rhythm-tag">{lyrics.rhythmPattern}</span>
            </div>
          )}
          
          {lyrics.rhymeScheme && (
            <div className="meta-item">
              <span className="meta-label">{isHindi ? 'तुकांत योजना' : 'Rhyme Scheme'}</span>
              <span className="tag rhyme-tag">{lyrics.rhymeScheme}</span>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  const renderResponse = () => {
    if (!response) return null;

    if (!response.success) {
      return (
        <motion.div 
          className="error-card"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="error-header">
            <AlertCircle className="w-5 h-5" />
            <span>Error</span>
          </div>
          <p className="error-message">{response.formattedResponse}</p>
        </motion.div>
      );
    }

    switch (response.type) {
      case 'info':
        return renderSongInfo(response.data as SongInfo);
      case 'story':
        return renderStorySummary(response.data as StorySummary);
      case 'lyrics':
        return renderContinuationLyrics(response.data as ContinuationLyrics);
      default:
        return (
          <div className="unknown-card">
            <p>Unknown response type</p>
          </div>
        );
    }
  };

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      {/* Background Elements */}
      <div className="bg-gradient"></div>
      <div className="bg-pattern"></div>
      
      <div className="container">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="header"
        >
          <motion.button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <AnimatePresence mode="wait">
              {darkMode ? (
                <motion.div
                  key="sun"
                  initial={{ opacity: 0, rotate: -180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 180 }}
                >
                  <Sun className="w-6 h-6" />
                </motion.div>
              ) : (
                <motion.div
                  key="moon"
                  initial={{ opacity: 0, rotate: 180 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -180 }}
                >
                  <Moon className="w-6 h-6" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <div className="header-content">
            <motion.div
              className="logo"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <img 
                src="https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop&crop=center" 
                alt="The Lyric Room Logo" 
                className="logo-image"
              />
              <div className="logo-text">
                <h1 className="logo-title">The Lyric Room</h1>
                <p className="logo-subtitle">Where Music Stories Live</p>
              </div>
            </motion.div>

            <motion.p
              className="header-description"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {response?.data?.language === 'hindi'
                ? 'संगीत की कहानियों का डिजिटल घर'
                : 'Discover the untold stories behind your favorite songs'}
            </motion.p>
          </div>
        </motion.header>

        {/* Search Section */}
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="search-section"
        >
          <div className="search-container">
            <div className="search-input-container">
              <Search className="search-icon" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={response?.data?.language === 'hindi'
                  ? 'किसी भी गीत की दुनिया में खोजें...'
                  : 'Search for any song, artist, or musical story...'}
                className="search-input"
                disabled={loading}
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="clear-btn"
                >
                  ×
                </button>
              )}
            </div>
            <motion.button
              onClick={handleSearch}
              disabled={loading || !query.trim()}
              className="search-button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="search"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Sparkles className="w-5 h-5" />
                  </motion.div>
                )}
              </AnimatePresence>
              <span>
                {loading
                  ? (response?.data?.language === 'hindi' ? 'खोज रहे हैं...' : 'Searching...')
                  : (response?.data?.language === 'hindi' ? 'खोजें' : 'Discover')}
              </span>
            </motion.button>
          </div>

          {/* Example queries */}
          <motion.div
            className="examples"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            <p className="examples-text">
              {response?.data?.language === 'hindi' ? 'कुछ उदाहरण:' : 'Try these examples:'}
            </p>
            <div className="examples-grid">
              {[
                response?.data?.language === 'hindi'
                  ? '"लग जा गले" जानकारी'
                  : '"Lag ja gale" information',
                response?.data?.language === 'hindi'
                  ? '"तुम ही हो" कहानी'
                  : '"Tum hi ho" story',
                response?.data?.language === 'hindi'
                  ? '"अभी न जाओ" की तरह बोल लिखें'
                  : 'Write lyrics like "Abhi na jao"'
              ].map((example, index) => (
                <motion.button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="example-button"
                  disabled={loading}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.1 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {example}
                </motion.button>
              ))}
            </div>
          </motion.div>
        </motion.section>

        {/* Error Display */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-card"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="error-header">
                <AlertCircle className="w-5 h-5" />
                <span>Error</span>
              </div>
              <p className="error-message">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading State */}
        <AnimatePresence>
          {loading && (
            <motion.div
              className="loading-container"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="loading-spinner">
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
                <div className="spinner-ring"></div>
              </div>
              <p className="loading-text">
                {response?.data?.language === 'hindi'
                  ? 'संगीत की जादुई दुनिया से जानकारी लाई जा रही है...'
                  : 'Gathering musical stories from the universe...'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results */}
        <AnimatePresence mode="wait">
          {!loading && response && (
            <motion.main
              key="response"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              className="results"
            >
              {renderResponse()}
            </motion.main>
          )}
        </AnimatePresence>

        {/* Footer */}
        <motion.footer
          className="footer"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
        >
          <div className="footer-content">
            <p className="footer-text">
              {response?.data?.language === 'hindi'
                ? 'संगीत का डिजिटल अभयारण्य'
                : 'The Digital Sanctuary of Music'}
            </p>
            <div className="footer-links">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-500" />
              <span>for music lovers</span>
            </div>
          </div>
        </motion.footer>
      </div>
    </div>
  );
};

export default ModernMusicWebsite;
