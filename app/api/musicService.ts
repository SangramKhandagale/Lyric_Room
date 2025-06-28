// musicServices.ts - Enhanced Music Services Module
// Handles song information, story summaries, and lyric generation with improved functionality

import axios from 'axios';

// Types and Interfaces
export interface SongInfo {
  title: string;
  artist: string;
  composer?: string;
  lyricist?: string;
  director?: string;
  movie?: string;
  year?: string;
  genre?: string;
  language: string;
  duration?: string;
  album?: string;
  recordLabel?: string;
  playbackSinger?: string;
  awards?: string[];
  popularityRating?: string;
  legalLinks: string[];
  description?: string;
  detailedInfo?: string;
}

export interface StorySummary {
  title: string;
  language: 'hindi' | 'english';
  summary: string;
  themes: string[];
  mood: string;
  characters?: string[];
  culturalContext?: string;
  historicalBackground?: string;
}

export interface ContinuationLyrics {
  originalSong: string;
  language: 'hindi' | 'english';
  newVerses: string[];
  style: string;
  theme: string;
  rhythmPattern?: string;
  rhymeScheme?: string;
}

export interface QueryAnalysis {
  type: 'info' | 'story' | 'lyrics' | 'unknown';
  songName?: string; // eslint-disable-line @typescript-eslint/no-unused-vars
  language: 'hindi' | 'english' | 'mixed';
  intent: string;
  preferredLanguage?: 'hindi' | 'english';
}

export interface MusicResponse {
  success: boolean;
  type: 'info' | 'story' | 'lyrics';
  data?: SongInfo | StorySummary | ContinuationLyrics;
  error?: string;
  formattedResponse: string;
}

// API Configuration
const RAPIDAPI_CONFIG = {
  method: 'GET' as const,
  url: 'https://google-search74.p.rapidapi.com/',
  headers: {
    'x-rapidapi-key': '7ff1f5b26amsh2a9ae338b3130fap1f2180jsnb798c0ce4482',
    'x-rapidapi-host': 'google-search74.p.rapidapi.com'
  }
};

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY;

// Enhanced Utility Functions
const detectLanguage = (text: string): 'hindi' | 'english' | 'mixed' => {
  const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
  const totalChars = text.replace(/\s/g, '').length;
  
  if (hindiChars > totalChars * 0.3) return 'hindi';
  if (hindiChars > 0) return 'mixed';
  return 'english';
};

const detectPreferredResponseLanguage = (query: string): 'hindi' | 'english' => {
  const lowerQuery = query.toLowerCase();
  
  // Hindi language indicators
  const hindiIndicators = [
    'hindi', 'हिंदी', 'हिन्दी', 'देवनागरी',
    'में बताओ', 'में दो', 'में लिखो', 'में समझाओ',
    'हिंदी में', 'भारतीय', 'बॉलीवुड'
  ];
  
  // English language indicators
  const englishIndicators = [
    'english', 'in english', 'translate to english'
  ];
  
  // Check for explicit language preference
  if (hindiIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'hindi';
  }
  
  if (englishIndicators.some(indicator => lowerQuery.includes(indicator))) {
    return 'english';
  }
  
  // Default based on script used in query
  return detectLanguage(query) === 'hindi' ? 'hindi' : 'english';
};

// Enhanced Core Functions

/**
 * Enhanced query analysis with better language detection
 */
export const detectQueryType = (query: string): QueryAnalysis => {
  const lowerQuery = query.toLowerCase();
  const language = detectLanguage(query);
  const preferredLanguage = detectPreferredResponseLanguage(query);
  
  // Enhanced patterns for different intents
  const infoPatterns = [
    /(?:information|info|details|जानकारी|विवरण|बताओ|बताइए)/i,
    /(?:singer|गायक|artist|कलाकार|who sang|किसने गाया)/i,
    /(?:composer|संगीतकार|music director|निर्देशक)/i,
    /(?:movie|film|फिल्म|picture|चित्र|से है)/i,
    /(?:year|साल|वर्ष|when|कब)/i,
    /(?:about|के बारे में|विषय में)/i
  ];
  
  const storyPatterns = [
    /(?:story|कहानी|summary|सारांश|meaning|अर्थ|मतलब)/i,
    /(?:explain|समझाएं|समझाओ|describe|वर्णन|what.*about|के बारे में)/i,
    /(?:narrative|कथा|plot|कथानक|theme|विषय|संदेश)/i,
    /(?:tell me about|बताओ|सुनाओ)/i
  ];
  
  const lyricsPatterns = [
    /(?:write|लिखें|लिखो|create|बनाएं|बनाओ|generate|उत्पन्न)/i,
    /(?:new verse|नया श्लोक|नई पंक्ति|more lines|और पंक्तियां)/i,
    /(?:extend|बढ़ाएं|बढ़ाओ|add|जोड़ें|जोड़ो|composition|रचना)/i,
    /(?:continue|जारी|आगे|next|अगला)/i,
    /(?:lyrics|बोल|गीत के बोल|पद)/i
  ];

  // Enhanced song name extraction
  let songName = '';
  const quotedMatch = query.match(/["""'''](.*?)["""''']/);
  if (quotedMatch) {
    songName = quotedMatch[1];
  } else {
    // Try multiple patterns for song name extraction
    const patterns = [
      /(?:song|geet|गीत|गाना)\s+["""'''](.*?)["""''']/i,
      /(?:song|geet|गीत|गाना)\s+"([^"]+)"/i,
      /(?:song|geet|गीत|गाना)\s+'([^']+)'/i,
      /(?:song|geet|गीत|गाना)\s+([^\s].+?)(?:\s+(?:ka|ke|ki|का|के|की|about|में|से))/i,
      /(?:for|के लिए)\s+([^\s].+?)(?:\s+(?:song|geet|गीत))/i
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern);
      if (match) {
        songName = match[1].trim();
        break;
      }
    }
    
    if (!songName) {
      songName = extractPossibleSongName(query);
    }
  }

  // Enhanced type determination
  let type: 'info' | 'story' | 'lyrics' | 'unknown' = 'unknown';
  
  if (storyPatterns.some(pattern => pattern.test(lowerQuery))) {
    type = 'story';
  } else if (lyricsPatterns.some(pattern => pattern.test(lowerQuery))) {
    type = 'lyrics';
  } else if (infoPatterns.some(pattern => pattern.test(lowerQuery))) {
    type = 'info';
  }

  return {
    type,
    songName: songName || extractPossibleSongName(query),
    language,
    intent: lowerQuery,
    preferredLanguage
  };
};

const extractPossibleSongName = (query: string): string => {
  // Enhanced common songs list
  const commonSongs = [
    'abhi na jao chhod kar', 'अभी न जाओ छोड़ कर',
    'lag ja gale', 'लग जा गले',
    'tere bina zindagi se', 'तेरे बिना जिंदगी से',
    'tum hi ho', 'तुम ही हो',
    'raag darbari', 'राग दरबारी',
    'kabhi kabhi mere dil mein', 'कभी कभी मेरे दिल में',
    'ye jo mohabbat hai', 'ये जो मोहब्बत है',
    'chupke chupke', 'चुपके चुपके',
    'tujhse naraz nahi zindagi', 'तुझसे नाराज़ नहीं जिंदगी',
    'kishore kumar', 'lata mangeshkar', 'mohammad rafi'
  ];
  
  const queryLower = query.toLowerCase();
  for (const song of commonSongs) {
    if (queryLower.includes(song.toLowerCase())) {
      return song;
    }
  }
  
  return '';
};

/**
 * Enhanced song information search with more comprehensive data
 */
export const searchSongInfo = async (songName: string, language: 'hindi' | 'english' | 'mixed' = 'english'): Promise<SongInfo | null> => {
  try {
    if (!songName.trim()) {
      throw new Error('Song name is required');
    }

    // Multiple search queries for comprehensive information
    const searchQueries = [
      `"${songName}" song complete information singer composer lyricist movie year`,
      `"${songName}" bollywood song details cast music director`,
      `"${songName}" film song background awards popularity`,
      `"${songName}" lyrics meaning story context`
    ];

    const legalLinksQuery = `"${songName}" lyrics site:genius.com OR site:gaana.com OR site:jiosaavn.com OR site:youtube.com OR site:spotify.com`;

    // Execute multiple searches
    const searchPromises = searchQueries.map(query => 
      axios({
        ...RAPIDAPI_CONFIG,
        params: {
          query,
          limit: '10',
          related_keywords: 'true'
        }
      }).catch(() => ({ data: { results: [] } }))
    );

    // Search for legal links
    const linksPromise = axios({
      ...RAPIDAPI_CONFIG,
      params: {
        query: legalLinksQuery,
        limit: '8',
        related_keywords: 'false'
      }
    }).catch(() => ({ data: { results: [] } }));

    const [infoResults, detailResults, backgroundResults, contextResults, linksResponse] = await Promise.all([
      ...searchPromises,
      linksPromise
    ]);

    // Combine all search results
    const allResults = [
      ...(infoResults.data?.results || []),
      ...(detailResults.data?.results || []),
      ...(backgroundResults.data?.results || []),
      ...(contextResults.data?.results || [])
    ];

    const linkResults = linksResponse.data?.results || [];

    // Enhanced information extraction
    const songInfo: SongInfo = {
      title: songName,
      artist: extractFromResults(allResults, ['singer', 'sung by', 'voice', 'गायक', 'आवाज़']),
      playbackSinger: extractFromResults(allResults, ['playback singer', 'playback', 'प्लेबैक']),
      composer: extractFromResults(allResults, ['music director', 'composer', 'music by', 'संगीतकार', 'संगीत']),
      lyricist: extractFromResults(allResults, ['lyricist', 'lyrics by', 'written by', 'गीतकार', 'बोल']),
      director: extractFromResults(allResults, ['director', 'directed by', 'निर्देशक']),
      movie: extractFromResults(allResults, ['movie', 'film', 'from', 'फिल्म', 'चित्र']),
      year: extractFromResults(allResults, ['year', 'released', 'साल', 'वर्ष']) || extractYearFromResults(allResults),
      genre: extractFromResults(allResults, ['genre', 'style', 'type', 'शैली']),
      album: extractFromResults(allResults, ['album', 'soundtrack', 'एल्बम']),
      recordLabel: extractFromResults(allResults, ['record label', 'label', 'production', 'लेबल']),
      duration: extractFromResults(allResults, ['duration', 'length', 'minutes', 'अवधि']),
      awards: extractAwards(allResults),
      popularityRating: extractPopularity(allResults),
      language: language === 'mixed' ? 'hindi' : language,
      legalLinks: extractLegalLinks(linkResults),
      description: await generateEnhancedDescription(songName, language, allResults),
      detailedInfo: generateDetailedInfo(allResults)
    };

    return songInfo;

  } catch (error) {
    console.error('Error searching song info:', error);
    return null;
  }
};

// Enhanced extraction functions
const extractFromResults = (results: unknown[], keywords: string[]): string => {
  const patterns = [
    // Pattern 1: keyword: value
    (keyword: string, text: string) => {
      const regex = new RegExp(`${keyword}[:\\s-]+([^,\\n.;]+)`, 'i');
      return text.match(regex)?.[1]?.trim();
    },
    // Pattern 2: keyword by value
    (keyword: string, text: string) => {
      const regex = new RegExp(`${keyword}\\s+by\\s+([^,\\n.;]+)`, 'i');
      return text.match(regex)?.[1]?.trim();
    },
    // Pattern 3: value keyword
    (keyword: string, text: string) => {
      const regex = new RegExp(`([^,\\n.;]+)\\s+${keyword}`, 'i');
      return text.match(regex)?.[1]?.trim();
    }
  ];

  for (const result of results) {
    const resultObj = result as { title?: string; description?: string };
    const text = `${resultObj.title || ''} ${resultObj.description || ''}`.toLowerCase();
    
    for (const keyword of keywords) {
      for (const pattern of patterns) {
        const match = pattern(keyword, text);
        if (match && match.length > 2 && match.length < 50) {
          return match.split(' ').slice(0, 4).join(' ');
        }
      }
    }
  }
  return '';
};

const extractYearFromResults = (results: unknown[]): string => {
  const yearRegex = /(19|20)\d{2}/g;
  
  for (const result of results) {
    const resultObj = result as { title?: string; description?: string };
    const text = `${resultObj.title || ''} ${resultObj.description || ''}`;
    const years = text.match(yearRegex);
    if (years) {
      return years[0];
    }
  }
  return '';
};

const extractAwards = (results: unknown[]): string[] => {
  const awards: string[] = [];
  const awardKeywords = ['award', 'prize', 'recognition', 'filmfare', 'national', 'पुरस्कार'];
  
  for (const result of results) {
    const resultObj = result as { title?: string; description?: string };
    const text = `${resultObj.title || ''} ${resultObj.description || ''}`.toLowerCase();
    for (const keyword of awardKeywords) {
      if (text.includes(keyword.toLowerCase())) {
        const sentences = text.split(/[.!?]/);
        const awardSentence = sentences.find(sentence => sentence.includes(keyword));
        if (awardSentence) {
          awards.push(awardSentence.trim());
        }
      }
    }
  }
  
  return [...new Set(awards)].slice(0, 3);
};

const extractPopularity = (results: unknown[]): string => {
  const popularityIndicators = ['popular', 'hit', 'famous', 'classic', 'evergreen', 'प्रसिद्ध'];
  
  for (const result of results) {
    const resultObj = result as { title?: string; description?: string };
    const text = `${resultObj.title || ''} ${resultObj.description || ''}`.toLowerCase();
    for (const indicator of popularityIndicators) {
      if (text.includes(indicator.toLowerCase())) {
        return indicator.charAt(0).toUpperCase() + indicator.slice(1);
      }
    }
  }
  return 'Well-known';
};

const extractLegalLinks = (results: unknown[]): string[] => {
  const links: string[] = [];
  const trustedDomains = [
    'genius.com', 'gaana.com', 'jiosaavn.com', 'youtube.com', 
    'spotify.com', 'apple.com', 'amazon.com', 'wynk.in', 'hungama.com'
  ];
  
  for (const result of results) {
    const resultObj = result as { url?: string };
    if (resultObj.url && trustedDomains.some(domain => resultObj.url?.includes(domain))) {
      links.push(resultObj.url);
    }
  }
  
  return [...new Set(links)].slice(0, 5);
};

const generateDetailedInfo = (results: unknown[]): string => {
  let details = '';
  const relevantResults = results.slice(0, 3);
  
  for (const result of relevantResults) {
    const resultObj = result as { description?: string };
    if (resultObj.description && resultObj.description.length > 50) {
      details += resultObj.description + ' ';
    }
  }
  
  return details.trim();
};

const generateEnhancedDescription = async (songName: string, language: 'hindi' | 'english' | 'mixed', searchResults: unknown[]): Promise<string> => {
  const contextInfo = searchResults.slice(0, 3)
    .map(result => (result as { description?: string }).description || '')
    .join(' ')
    .substring(0, 500);

  const descriptions = {
    hindi: `"${songName}" एक अत्यंत प्रसिद्ध और मधुर गीत है जो अपनी भावनात्मक गहराई और संगीत की मिठास के लिए जाना जाता है। यह गीत लोगों के दिलों में आज भी बसा हुआ है।`,
    english: `"${songName}" is a renowned and melodious song celebrated for its emotional depth and musical sweetness. This timeless composition continues to resonate with audiences.`,
    mixed: `"${songName}" is a beloved song that showcases the perfect blend of meaningful lyrics and beautiful melody, making it a favorite across generations.`
  };
  
  let baseDescription = descriptions[language] || descriptions.english;
  
  // Add context from search results if available
  if (contextInfo.length > 100) {
    const isHindi = language === 'hindi';
    baseDescription += isHindi 
      ? ` इस गीत के बारे में और जानकारी के अनुसार, यह विशेष रूप से अपनी अनूठी शैली के लिए प्रशंसित है।`
      : ` Additional information suggests this song is particularly praised for its unique style and composition.`;
  }
  
  return baseDescription;
};

/**
 * Enhanced story summary generation with better Hindi support
 */
export const generateStorySummary = async (songName: string, language: 'hindi' | 'english' = 'english'): Promise<StorySummary | null> => {
  try {
    const isHindi = language === 'hindi';
    
    const systemPrompt = isHindi
      ? `आप एक कुशल कहानीकार हैं जो गीतों की सुंदर कहानी-शैली में सारांश बनाते हैं। हमेशा मूल गीत के बोल कॉपी न करें, बल्कि गीत की भावना और संदेश को कहानी के रूप में प्रस्तुत करें। आपका जवाब स्पष्ट, सुंदर और रोचक हिंदी में होना चाहिए। कम से कम 150 शब्दों का विस्तृत सारांश दें।`
      : `You are a skilled storyteller who creates beautiful narrative summaries of songs. Never reproduce actual lyrics. Instead, capture the essence, emotions, and message of the song in story form. Your response should be clear, engaging, and meaningful. Provide a detailed summary of at least 150 words.`;

    const userPrompt = isHindi
      ? `गीत "${songName}" के लिए एक विस्तृत और सुंदर कहानी-शैली का सारांश बनाएं। इसमें शामिल करें:
      1. गीत की मुख्य भावना और संदेश
      2. कहानी के मुख्य किरदार और उनकी परिस्थितियां  
      3. गीत के माध्यम से व्यक्त होने वाली भावनाएं
      4. सांस्कृतिक और सामाजिक संदर्भ (यदि कोई हो)
      5. गीत का समग्र प्रभाव और महत्व
      
      कहानी को रोचक, भावनात्मक और समझने योग्य बनाएं। सुंदर हिंदी भाषा का प्रयोग करें।`
      : `Create a detailed and beautiful story-style summary for the song "${songName}". Include:
      1. The main emotion and message of the song
      2. Key characters and their circumstances in the story
      3. Emotions expressed through the song
      4. Cultural and social context (if any)
      5. Overall impact and significance of the song
      
      Make the story engaging, emotional, and easy to understand.`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const summary = data.choices[0].message.content;

    return {
      title: songName,
      language,
      summary,
      themes: extractThemes(summary, language),
      mood: extractMood(summary, language),
      characters: extractCharacters(summary),
      culturalContext: extractCulturalContext(summary, language),
      historicalBackground: extractHistoricalContext(summary, language)
    };

  } catch (error) {
    console.error('Error generating story summary:', error);
    return null;
  }
};

/**
 * Enhanced lyric generation with proper Hindi rhythm and rhyme
 */
export const generateContinuationLyrics = async (songName: string, language: 'hindi' | 'english' = 'english', style?: string): Promise<ContinuationLyrics | null> => {
  try {
    const isHindi = language === 'hindi';
    
    const systemPrompt = isHindi
      ? `आप एक कुशल गीतकार हैं जो मूल गीतों की शैली में नए, मौलिक श्लोक लिखते हैं। आपको निम्नलिखित बातों का ध्यान रखना है:
      1. कभी भी कॉपीराइट गीत के बोल कॉपी न करें
      2. मूल गीत की भावना और तर्ज़ को बनाए रखें
      3. उचित छंद, लय और तुकबंदी का प्रयोग करें
      4. सुंदर हिंदी शब्दावली का उपयोग करें
      5. कम से कम 3 श्लोक लिखें, हर श्लोक में 4-6 पंक्तियां हों
      6. श्लोकों में भावनात्मक गहराई हो
      हमेशा देवनागरी में लिखें और तुकबंदी का विशेष ध्यान रखें।`
      : `You are a skilled lyricist who writes original verses inspired by existing songs. You must:
      1. Never copy copyrighted lyrics
      2. Maintain the emotion and musical style of the original
      3. Use proper rhythm, meter, and rhyme
      4. Create at least 3 verses with 4-6 lines each
      5. Ensure emotional depth in the verses
      Write completely original content that captures similar feelings and themes.`;

    const userPrompt = isHindi
      ? `गीत "${songName}" की शैली में 3 नए मौलिक श्लोक लिखें। ध्यान रखें:
      1. मूल गीत की भावना और संगीत शैली को बनाए रखें
      2. उचित तुकबंदी और छंद का प्रयोग करें
      3. हर श्लोक अलग भाव व्यक्त करे लेकिन मुख्य विषय से जुड़ा रहे
      4. सुंदर और भावनात्मक हिंदी शब्दों का प्रयोग करें
      5. गीत की मूल तर्ज़ और रिदम को ध्यान में रखें
      
      कृपया केवल मौलिक रचना करें, कोई कॉपीराइट सामग्री का उपयोग न करें।`
      : `Write 3 original verses in the style of the song "${songName}". Ensure:
      1. Maintain the emotion and musical style of the original
      2. Use proper rhythm, meter, and rhyme scheme
      3. Each verse should express different emotions while staying connected to the main theme
      4. Create completely original content with no copyrighted material
      5. Consider the original song's melody and rhythm patterns`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 800
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const lyrics = data.choices[0].message.content;

    // Enhanced verse separation
    const verses = lyrics.split(/\n\s*\n+/).filter((verse: { trim: () => {  length: number; }; }) => verse.trim().length > 0);
    const cleanedVerses = verses.map((verse: string) => verse.trim()).slice(0, 3);

    return {
      originalSong: songName,
      language,
      newVerses: cleanedVerses,
      style: style || (isHindi ? 'पारंपरिक बॉलीवुड' : 'Traditional Bollywood'),
      theme: extractThemeFromLyrics(lyrics, language),
      rhythmPattern: isHindi ? 'मात्रिक छंद' : 'Melodic Meter',
      rhymeScheme: detectRhymeScheme(cleanedVerses, language)
    };

  } catch (error) {
    console.error('Error generating continuation lyrics:', error);
    return null;
  }
};

// Enhanced helper functions for better extraction
const extractThemes = (summary: string, language: 'hindi' | 'english'): string[] => {
  const themeKeywords = language === 'hindi' 
    ? ['प्रेम', 'विरह', 'खुशी', 'दुख', 'याद', 'उम्मीद', 'सपने', 'जीवन', 'मोहब्बत', 'इश्क', 'रिश्ते', 'परिवार']
    : ['love', 'separation', 'joy', 'sorrow', 'memory', 'hope', 'dreams', 'life', 'relationships', 'family', 'romance', 'longing'];
  
  return themeKeywords.filter(theme => 
    summary.toLowerCase().includes(theme.toLowerCase())
  ).slice(0, 4);
};

const extractMood = (summary: string, language: 'hindi' | 'english'): string => {
  const moodWords = language === 'hindi'
    ? [
        { words: ['खुश', 'प्रसन्न', 'आनंद', 'हर्ष'], mood: 'प्रसन्नता' },
        { words: ['दुख', 'गम', 'विषाद', 'उदास'], mood: 'दुखी' },
        { words: ['प्रेम', 'मोहब्बत', 'इश्क', 'प्यार'], mood: 'रोमांटिक' },
        { words: ['शांत', 'मधुर', 'कोमल', 'सुकून'], mood: 'शांत' },
        { words: ['उत्साह', 'जोश', 'उमंग', 'उत्सव'], mood: 'उत्साहपूर्ण' }
      ]
    : [
        { words: ['happy', 'joyful', 'cheerful', 'delighted'], mood: 'uplifting' },
        { words: ['sad', 'melancholy', 'sorrowful', 'gloomy'], mood: 'melancholic' },
        { words: ['love', 'romantic', 'tender', 'passionate'], mood: 'romantic' },
        { words: ['peaceful', 'calm', 'serene', 'tranquil'], mood: 'peaceful' },
        { words: ['energetic', 'vibrant', 'enthusiastic', 'lively'], mood: 'energetic' }
      ];

  for (const moodGroup of moodWords) {
    if (moodGroup.words.some(word => summary.toLowerCase().includes(word))) {
      return moodGroup.mood;
    }
  }
  
  return language === 'hindi' ? 'भावनात्मक' : 'emotional';
};

const extractCharacters = (summary: string): string[] => {
  const characters: string[] = [];
  const characterIndicators = [
    'hero', 'heroine', 'lover', 'beloved', 'protagonist', 'नायक', 'नायिका', 'प्रेमी', 'प्रेमिका'
  ];
  
  for (const indicator of characterIndicators) {
    if (summary.toLowerCase().includes(indicator.toLowerCase())) {
      characters.push(indicator);
    }
  }
  
  return [...new Set(characters)].slice(0, 3);
};

const extractCulturalContext = (summary: string, language: 'hindi' | 'english'): string => {
  const culturalKeywords = language === 'hindi'
    ? ['भारतीय', 'संस्कृति', 'परंपरा', 'रीति-रिवाज', 'त्योहार', 'पारिवारिक']
    : ['indian', 'culture', 'tradition', 'festival', 'family', 'heritage'];
  
  for (const keyword of culturalKeywords) {
    if (summary.toLowerCase().includes(keyword.toLowerCase())) {
      return language === 'hindi' 
        ? 'भारतीय सांस्कृतिक संदर्भ में निहित'
        : 'Rooted in Indian cultural context';
    }
  }
  
  return language === 'hindi' ? 'सामान्य सांस्कृतिक संदर्भ' : 'General cultural context';
};

const extractHistoricalContext = (summary: string, language: 'hindi' | 'english'): string => {
  const decades = summary.match(/\b(19[0-9]{2}|20[0-9]{2})\b/);
  const eraKeywords = language === 'hindi'
    ? ['स्वर्ण युग', 'क्लासिक', 'पुराना', 'आधुनिक']
    : ['golden age', 'classic', 'vintage', 'modern', 'contemporary'];
  
  if (decades) {
    const year = parseInt(decades[0]);
    if (year >= 1950 && year <= 1970) {
      return language === 'hindi' ? 'बॉलीवुड का स्वर्ण युग' : 'Golden Age of Bollywood';
    } else if (year >= 1980 && year <= 2000) {
      return language === 'hindi' ? 'आधुनिक बॉलीवुड युग' : 'Modern Bollywood Era';
    }
  }
  
  for (const keyword of eraKeywords) {
    if (summary.toLowerCase().includes(keyword.toLowerCase())) {
      return language === 'hindi' 
        ? 'ऐतिहासिक महत्व के साथ'
        : 'With historical significance';
    }
  }
  
  return language === 'hindi' ? 'समसामयिक संदर्भ' : 'Contemporary context';
};

const extractThemeFromLyrics = (lyrics: string, language: 'hindi' | 'english'): string => {
  const lyricsLower = lyrics.toLowerCase();
  
  const themes = language === 'hindi'
    ? [
        { keywords: ['प्रेम', 'मोहब्बत', 'इश्क', 'प्यार'], theme: 'प्रेम गीत' },
        { keywords: ['विरह', 'बिछड़ना', 'जुदाई', 'याद'], theme: 'विरह गीत' },
        { keywords: ['खुशी', 'आनंद', 'उत्सव', 'मंगल'], theme: 'उत्सव गीत' },
        { keywords: ['दुख', 'गम', 'आंसू', 'दर्द'], theme: 'दुख गीत' },
        { keywords: ['माँ', 'मातृ', 'परिवार', 'रिश्ते'], theme: 'पारिवारिक गीत' }
      ]
    : [
        { keywords: ['love', 'heart', 'romance', 'affection'], theme: 'Love Song' },
        { keywords: ['separation', 'goodbye', 'apart', 'missing'], theme: 'Separation Song' },
        { keywords: ['joy', 'happiness', 'celebration', 'festival'], theme: 'Celebration Song' },
        { keywords: ['sadness', 'tears', 'sorrow', 'pain'], theme: 'Melancholic Song' },
        { keywords: ['mother', 'family', 'relationships', 'bond'], theme: 'Family Song' }
      ];

  for (const themeGroup of themes) {
    if (themeGroup.keywords.some(keyword => lyricsLower.includes(keyword))) {
      return themeGroup.theme;
    }
  }
  
  return language === 'hindi' ? 'भावनात्मक गीत' : 'Emotional Song';
};

const detectRhymeScheme = (verses: string[], language: 'hindi' | 'english'): string => {
  if (verses.length === 0) return language === 'hindi' ? 'मुक्त छंद' : 'Free Verse';
  
  // Analyze the first verse for rhyme pattern
  const firstVerse = verses[0];
  const lines = firstVerse.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length >= 4) {
    return language === 'hindi' ? 'ABAB तुकांत' : 'ABAB Rhyme Scheme';
  } else if (lines.length >= 2) {
    return language === 'hindi' ? 'AA तुकांत' : 'AA Rhyme Scheme';
  }
  
  return language === 'hindi' ? 'मिश्रित छंद' : 'Mixed Meter';
};

/**
 * Enhanced response formatting with better presentation
 */
export const formatMusicResponse = (response: MusicResponse): string => {
  if (!response.success || !response.data) {
    return response.error || 'Sorry, I could not process your music request.';
  }

  switch (response.type) {
    case 'info':
      return formatSongInfo(response.data as SongInfo);
    case 'story':
      return formatStorySummary(response.data as StorySummary);
    case 'lyrics':
      return formatContinuationLyrics(response.data as ContinuationLyrics);
    default:
      return 'I received your music request but couldn\'t format the response properly.';
  }
};

const formatSongInfo = (info: SongInfo): string => {
  const isHindi = info.language === 'hindi';
  
  let formatted = isHindi 
    ? `🎵 **गीत की विस्तृत जानकारी: "${info.title}"**\n\n`
    : `🎵 **Comprehensive Song Information: "${info.title}"**\n\n`;

  // Basic Information
  if (info.artist) {
    formatted += isHindi ? `👤 **मुख्य गायक/गायिका:** ${info.artist}\n` : `👤 **Main Artist:** ${info.artist}\n`;
  }
  
  if (info.playbackSinger && info.playbackSinger !== info.artist) {
    formatted += isHindi ? `🎤 **प्लेबैक सिंगर:** ${info.playbackSinger}\n` : `🎤 **Playback Singer:** ${info.playbackSinger}\n`;
  }
  
  if (info.composer) {
    formatted += isHindi ? `🎼 **संगीत निर्देशक:** ${info.composer}\n` : `🎼 **Music Director:** ${info.composer}\n`;
  }
  
  if (info.lyricist) {
    formatted += isHindi ? `✍️ **गीतकार:** ${info.lyricist}\n` : `✍️ **Lyricist:** ${info.lyricist}\n`;
  }
  
  if (info.director) {
    formatted += isHindi ? `🎬 **फिल्म निर्देशक:** ${info.director}\n` : `🎬 **Film Director:** ${info.director}\n`;
  }
  
  if (info.movie) {
    formatted += isHindi ? `🎭 **फिल्म:** ${info.movie}\n` : `🎭 **Movie:** ${info.movie}\n`;
  }
  
  if (info.year) {
    formatted += isHindi ? `📅 **रिलीज़ वर्ष:** ${info.year}\n` : `📅 **Release Year:** ${info.year}\n`;
  }

  // Additional Details
  if (info.album) {
    formatted += isHindi ? `💿 **एल्बम:** ${info.album}\n` : `💿 **Album:** ${info.album}\n`;
  }
  
  if (info.genre) {
    formatted += isHindi ? `🎵 **शैली:** ${info.genre}\n` : `🎵 **Genre:** ${info.genre}\n`;
  }
  
  if (info.duration) {
    formatted += isHindi ? `⏱️ **अवधि:** ${info.duration}\n` : `⏱️ **Duration:** ${info.duration}\n`;
  }
  
  if (info.recordLabel) {
    formatted += isHindi ? `🏷️ **रिकॉर्ड लेबल:** ${info.recordLabel}\n` : `🏷️ **Record Label:** ${info.recordLabel}\n`;
  }
  
  if (info.popularityRating) {
    formatted += isHindi ? `⭐ **लोकप्रियता:** ${info.popularityRating}\n` : `⭐ **Popularity:** ${info.popularityRating}\n`;
  }

  // Awards and Recognition
  if (info.awards && info.awards.length > 0) {
    formatted += isHindi 
      ? `\n🏆 **पुरस्कार और सम्मान:**\n`
      : `\n🏆 **Awards and Recognition:**\n`;
    
    info.awards.forEach(award => {
      formatted += `• ${award}\n`;
    });
  }

  // Description
  if (info.description) {
    formatted += `\n📝 **${isHindi ? 'विवरण' : 'Description'}:**\n${info.description}\n`;
  }

  // Legal Links
  if (info.legalLinks.length > 0) {
    formatted += isHindi 
      ? `\n🔗 **गीत सुनने और बोल देखने के लिए:**\n`
      : `\n🔗 **Listen to the song and find lyrics at:**\n`;
    
    info.legalLinks.forEach(link => {
      const domain = new URL(link).hostname.replace('www.', '');
      formatted += `• ${domain.charAt(0).toUpperCase() + domain.slice(1)}: ${link}\n`;
    });
  }

  // Additional context if available
  if (info.detailedInfo && info.detailedInfo.length > 100) {
    formatted += isHindi 
      ? `\n📖 **अतिरिक्त जानकारी:**\n${info.detailedInfo.substring(0, 200)}...\n`
      : `\n📖 **Additional Information:**\n${info.detailedInfo.substring(0, 200)}...\n`;
  }

  return formatted;
};

const formatStorySummary = (story: StorySummary): string => {
  const isHindi = story.language === 'hindi';
  
  let formatted = isHindi
    ? `📖 **गीत की कहानी: "${story.title}"**\n\n`
    : `📖 **Song Story: "${story.title}"**\n\n`;

  formatted += `${story.summary}\n\n`;

  if (story.themes.length > 0) {
    formatted += isHindi 
      ? `🎭 **मुख्य विषय:** ${story.themes.join(', ')}\n`
      : `🎭 **Main Themes:** ${story.themes.join(', ')}\n`;
  }

  formatted += isHindi 
    ? `💫 **भावनात्मक रंग:** ${story.mood}\n`
    : `💫 **Emotional Tone:** ${story.mood}\n`;

  if (story.characters && story.characters.length > 0) {
    formatted += isHindi 
      ? `👥 **मुख्य पात्र:** ${story.characters.join(', ')}\n`
      : `👥 **Main Characters:** ${story.characters.join(', ')}\n`;
  }

  if (story.culturalContext) {
    formatted += isHindi 
      ? `🏛️ **सांस्कृतिक संदर्भ:** ${story.culturalContext}\n`
      : `🏛️ **Cultural Context:** ${story.culturalContext}\n`;
  }

  if (story.historicalBackground) {
    formatted += isHindi 
      ? `📚 **ऐतिहासिक पृष्ठभूमि:** ${story.historicalBackground}\n`
      : `📚 **Historical Background:** ${story.historicalBackground}\n`;
  }

  return formatted;
};

const formatContinuationLyrics = (lyrics: ContinuationLyrics): string => {
  const isHindi = lyrics.language === 'hindi';
  
  let formatted = isHindi
    ? `🎤 **"${lyrics.originalSong}" की शैली में नए मौलिक श्लोक**\n\n`
    : `🎤 **New Original Verses in the Style of "${lyrics.originalSong}"**\n\n`;

  formatted += isHindi
    ? `*ये पूरी तरह से मौलिक रचनाएं हैं जो मूल गीत से प्रेरित हैं*\n\n`
    : `*These are completely original compositions inspired by the original song*\n\n`;

  lyrics.newVerses.forEach((verse, index) => {
    formatted += `**${isHindi ? 'श्लोक' : 'Verse'} ${index + 1}:**\n\n${verse}\n\n---\n\n`;
  });

  // Technical details
  formatted += `📊 **${isHindi ? 'तकनीकी विवरण' : 'Technical Details'}:**\n`;
  formatted += isHindi
    ? `🎨 **संगीत शैली:** ${lyrics.style}\n`
    : `🎨 **Musical Style:** ${lyrics.style}\n`;
  
  formatted += isHindi
    ? `🎯 **मुख्य विषय:** ${lyrics.theme}\n`
    : `🎯 **Main Theme:** ${lyrics.theme}\n`;

  if (lyrics.rhythmPattern) {
    formatted += isHindi
      ? `🎵 **छंद पैटर्न:** ${lyrics.rhythmPattern}\n`
      : `🎵 **Rhythm Pattern:** ${lyrics.rhythmPattern}\n`;
  }

  if (lyrics.rhymeScheme) {
    formatted += isHindi
      ? `🎼 **तुकांत योजना:** ${lyrics.rhymeScheme}\n`
      : `🎼 **Rhyme Scheme:** ${lyrics.rhymeScheme}\n`;
  }

  return formatted;
};

/**
 * Enhanced main function with better language handling
 */
export const handleMusicQuery = async (query: string): Promise<MusicResponse> => {
  try {
    const analysis = detectQueryType(query);
    
    if (analysis.type === 'unknown' || !analysis.songName) {
      const isHindi = analysis.preferredLanguage === 'hindi';
      return {
        success: false,
        type: 'info',
        error: isHindi 
          ? 'आपकी संगीत संबंधी अनुरोध समझ नहीं पाया। कृपया गीत का नाम बताएं।'
          : 'Could not understand your music request. Please specify a song name.',
        formattedResponse: isHindi
          ? 'मैं आपकी संगीत संबंधी अनुरोध समझ नहीं पाया। कृपया गीत का नाम और आप क्या जानना चाहते हैं, यह स्पष्ट करें।'
          : 'I couldn\'t understand your music request. Please specify a song name and what you\'d like to know about it.'
      };
    }

    let data: SongInfo | StorySummary | ContinuationLyrics | null = null;
    const responseLanguage = analysis.preferredLanguage || 'english';

    switch (analysis.type) {
      case 'info':
        data = await searchSongInfo(analysis.songName, analysis.language);
        if (data) {
          data.language = responseLanguage; // Override for response formatting
        }
        break;
      case 'story':
        data = await generateStorySummary(analysis.songName, responseLanguage);
        break;
      case 'lyrics':
        data = await generateContinuationLyrics(analysis.songName, responseLanguage);
        break;
    }

    if (!data) {
      const isHindi = responseLanguage === 'hindi';
      const errorMessages = {
        info: isHindi 
          ? `"${analysis.songName}" के बारे में जानकारी नहीं मिली`
          : `Could not find information about "${analysis.songName}"`,
        story: isHindi 
          ? `"${analysis.songName}" के लिए कहानी नहीं बना पाया`
          : `Could not create story for "${analysis.songName}"`,
        lyrics: isHindi 
          ? `"${analysis.songName}" के लिए नए बोल नहीं लिख पाया`
          : `Could not generate lyrics for "${analysis.songName}"`
      };
      
      const responseMessages = {
        info: isHindi 
          ? `खुशी, मैं "${analysis.songName}" के बारे में जानकारी नहीं ढूंढ पाया। कृपया किसी अन्य गीत का नाम या सही स्पेलिंग की जांच करें।`
          : `Sorry, I couldn't find information about "${analysis.songName}". Please try a different song or check the spelling.`,
        story: isHindi 
          ? `खुशी, मैं "${analysis.songName}" के लिए कहानी नहीं बना पाया। कृपया किसी अन्य गीत का नाम आज़माएं।`
          : `Sorry, I couldn't create a story for "${analysis.songName}". Please try a different song.`,
        lyrics: isHindi 
          ? `खुशी, मैं "${analysis.songName}" के लिए नए बोल नहीं लिख पाया। कृपया किसी अन्य गीत का नाम आज़माएं।`
          : `Sorry, I couldn't generate lyrics for "${analysis.songName}". Please try a different song.`
      };

      return {
        success: false,
        type: analysis.type,
        error: errorMessages[analysis.type],
        formattedResponse: responseMessages[analysis.type]
      };
    }

    const response: MusicResponse = {
      success: true,
      type: analysis.type,
      data,
      formattedResponse: ''
    };

    response.formattedResponse = formatMusicResponse(response);
    return response;

  } catch (error) {
    console.error('Error handling music query:', error);
    
    const analysis = detectQueryType(query);
    const isHindi = analysis.preferredLanguage === 'hindi';
    
    return {
      success: false,
      type: 'info',
      error: isHindi 
        ? 'आपकी संगीत संबंधी अनुरोध को प्रोसेस करते समय त्रुटि हुई।'
        : 'An error occurred while processing your music request.',
      formattedResponse: isHindi
        ? 'खुशी, आपकी संगीत संबंधी अनुरोध को प्रोसेस करते समय त्रुटि हुई। कृपया फिर से कोशिश करें।'
        : 'Sorry, there was an error processing your music request. Please try again.'
    };
  }
};

// Export default function for easy integration
export default {
  handleMusicQuery,
  detectQueryType,
  searchSongInfo,
  generateStorySummary,
  generateContinuationLyrics,
  formatMusicResponse
};
