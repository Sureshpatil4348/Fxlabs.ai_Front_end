// News service for FX Labs API integration and AI analysis

// FX Labs API configuration
const FXLABS_API_BASE_URL = "https://api.fxlabs.ai/api/news/analysis";
/**
 * Transform FX Labs API response to match our existing data format
 */
const transformFXLabsData = (apiResponse) => {
  if (!apiResponse.data || !Array.isArray(apiResponse.data)) {
    return [];
  }

  return apiResponse.data.map((item, index) => {
    // Extract currency from the API response
    let currency = item.currency || 'USD';
    
    // Determine impact based on analysis effect and other factors
    let impact = 'medium';
    if (item.analysis && item.analysis.effect) {
      // Base impact on the type of economic data and effect
      if (item.analysis.effect === 'Neutral') {
        impact = 'low';
      } else if (item.analysis.effect === 'Bullish' || item.analysis.effect === 'Bearish') {
        // For Bullish/Bearish, determine impact based on the type of data
        // High impact indicators: Interest rates, CPI, GDP, Employment, FOMC
        // Medium impact indicators: Consumer sentiment, retail sales, manufacturing
        // Low impact indicators: Minor economic releases
        
        const headline = item.headline || '';
        const isHighImpact = headline.includes('Interest Rate') || 
                           headline.includes('CPI') || 
                           headline.includes('GDP') || 
                           headline.includes('Employment') || 
                           headline.includes('Non-Farm') || 
                           headline.includes('FOMC') || 
                           headline.includes('ECB') || 
                           headline.includes('Fed') ||
                           headline.includes('Inflation');
        
        const isLowImpact = headline.includes('Consumer') || 
                           headline.includes('Sentiment') || 
                           headline.includes('Manufacturing') || 
                           headline.includes('Construction') ||
                           headline.includes('Leading Index');
        
        if (isHighImpact) {
          impact = 'high';
        } else if (isLowImpact) {
          impact = 'low';
        } else {
          impact = 'medium';
        }
        
        // Debug logging
        // eslint-disable-next-line no-console
        console.log(`Impact determination for "${headline}":`, {
          effect: item.analysis.effect,
          isHighImpact,
          isLowImpact,
          finalImpact: impact
        });
      }
    }

    // Parse the time string from the API. Supports:
    // - ISO with timezone, e.g., "2025-09-16T21:00:00Z"
    // - Legacy "YYYY.MM.DD HH:mm:ss" (assumed UTC)
    let dateObj = null;
    const timeString = item.time || '';
    let gmtTime = '';

    if (timeString) {
      const asIso = new Date(timeString);
      if (!isNaN(asIso.getTime())) {
        // ISO with timezone
        dateObj = asIso;
      } else {
        try {
          const [datePart, timePart] = timeString.split(' ');
          const [year, month, day] = (datePart || '').split('.');
          const [hour, minute, second] = (timePart || '').split(':');
          // Treat legacy format as UTC to avoid local-time ambiguity
          dateObj = new Date(
            Date.UTC(
              parseInt(year, 10),
              parseInt(month, 10) - 1,
              parseInt(day, 10),
              parseInt(hour, 10),
              parseInt(minute, 10),
              parseInt(second, 10)
            )
          );
        } catch (error) {
          // eslint-disable-next-line no-console
          console.error('Error parsing legacy time:', timeString, error);
          dateObj = null;
        }
      }
    }

    // Use analyzed_at as fallback for date if time parsing fails
    if ((!dateObj || isNaN(dateObj.getTime())) && item.analyzed_at) {
      const analyzed = new Date(item.analyzed_at);
      if (!isNaN(analyzed.getTime())) {
        dateObj = analyzed;
      }
    }

    // Final fallback: now
    if (!dateObj || isNaN(dateObj.getTime())) {
      dateObj = new Date();
    }

    // Create a GMT display string for potential use (not shown directly in UI)
    gmtTime = `${dateObj.toLocaleTimeString('en-GB', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit' })} GMT`;

    return {
      id: index + 1,
      title: item.headline || `FX Analysis ${index + 1}`,
      time: gmtTime,
      forecast: item.forecast || 'N/A',
      previous: item.previous || 'N/A',
      actual: item.actual || 'N/A',
      impact: impact,
      currency: currency,
      date: dateObj.toISOString(),
      // Store the full analysis data for potential use
      analysis: item.analysis || null,
      analyzed_at: item.analyzed_at || null,
      // Store original time string for reference
      originalTime: item.time || null
    };
  });
};

/**
 * Fetch news data from FX Labs API
 */
export const fetchForexFactoryNews = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Fetching news from FX Labs API...');
    // eslint-disable-next-line no-console
    console.log('API URL:', FXLABS_API_BASE_URL);
    
    const response = await fetch(FXLABS_API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    // eslint-disable-next-line no-console
    console.log('Response status:', response.status);
    // eslint-disable-next-line no-console
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    // eslint-disable-next-line no-console
    console.log('FX Labs API response:', data);
    
    // Transform the API response to match our existing format
    const transformedData = transformFXLabsData(data);
    // eslint-disable-next-line no-console
    console.log('Transformed news data:', transformedData);
    
    return transformedData;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching FX Labs news:', error);
    // eslint-disable-next-line no-console
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Return empty array as fallback instead of mock data
    return [];
  }
};

/**
 * Poll for fresh news data (used for automatic updates)
 */
export const pollForNews = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Polling for fresh news data...');
    const news = await fetchForexFactoryNews();
    return news;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error polling for news:', error);
    return [];
  }
};

/**
 * Analyze news using FX Labs API data
 * This function now uses the pre-analyzed data from the API
 */
export const analyzeNewsWithAI = async (newsItem) => {
  try {
    // If we have analysis data from the API, use it
    if (newsItem.analysis) {
      const analysis = newsItem.analysis;

      // Impacted currency: strictly use backend-provided currency
      const impactedCurrency = (newsItem.currency || '').toUpperCase();

      // Build suggested pairs from system list that include the impacted currency
      let suggestedPairs = [];
      try {
        const rsiModule = await import('../store/useRSITrackerStore');
        const systemPairs = rsiModule.default.getState().settings.autoSubscribeSymbols || [];
        const cleaned = systemPairs
          .map((sym) => sym.replace(/m$/i, '').toUpperCase())
          .filter((sym) => sym.length >= 6);
        const filtered = cleaned.filter((sym) => {
          const base = sym.slice(0, 3);
          const quote = sym.slice(3, 6);
          return base === impactedCurrency || quote === impactedCurrency;
        });
        suggestedPairs = [...new Set(filtered)];
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Falling back: unable to read system pairs for suggestions', e);
        // Reasonable defaults if system list unavailable
        if (impactedCurrency) {
          suggestedPairs = ['EURUSD', 'GBPUSD', 'USDJPY'].filter((p) => p.includes(impactedCurrency));
        } else {
          suggestedPairs = ['EURUSD'];
        }
      }

      return {
        effect: analysis.effect || 'Neutral',
        impactedCurrencies: impactedCurrency ? [impactedCurrency] : [],
        suggestedPairs,
        explanation: analysis.full_analysis || 'Analysis available from FX Labs API.'
      };
    }

    // Fallback analysis if no API data is available
    return {
      effect: 'Neutral',
      impactedCurrencies: newsItem.currency ? [newsItem.currency] : [],
      suggestedPairs: (newsItem.currency ? ['EURUSD', 'GBPUSD', 'USDJPY'].filter((p) => p.includes(newsItem.currency)) : ['EURUSD']),
      explanation: 'Analysis unavailable. Please monitor market conditions manually.'
    };

  } catch (error) {
    console.error('Error analyzing news with AI:', error);
    
    // Return fallback analysis
    return {
      effect: 'Neutral',
      impactedCurrencies: [newsItem.currency],
      suggestedPairs: ['EURUSD'],
      explanation: 'Analysis unavailable. Please monitor market conditions manually.'
    };
  }
};



/**
 * Get upcoming news events (next 24 hours)
 */
export const getUpcomingNews = async () => {
  try {
    const allNews = await fetchForexFactoryNews();
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    
    return allNews.filter(news => {
      const newsDate = new Date(news.date);
      return newsDate > now && newsDate <= next24Hours && news.actual === 'N/A';
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching upcoming news:', error);
    return [];
  }
};

/**
 * Get high impact news only
 */
export const getHighImpactNews = async () => {
  try {
    const allNews = await fetchForexFactoryNews();
    return allNews.filter(news => news.impact === 'high');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching high impact news:', error);
    return [];
  }
};

/**
 * Subscribe to real-time news updates
 * This will fetch fresh data from the FX Labs API every 5 minutes
 */
export const subscribeToNewsUpdates = (callback) => {
  // Fetch fresh data from FX Labs API every 5 minutes
  const interval = setInterval(async () => {
    try {
      const news = await fetchForexFactoryNews();
      callback(news);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error in news subscription:', error);
    }
  }, 5 * 60 * 1000); // Update every 5 minutes

  // Return cleanup function
  return () => clearInterval(interval);
};

/**
 * Get news metadata (count, last updated, next update)
 */
export const getNewsMetadata = async () => {
  try {
    const response = await fetch(FXLABS_API_BASE_URL);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    return {
      newsCount: data.news_count || 0,
      lastUpdated: data.last_updated || null,
      nextUpdate: data.next_update || null,
      isUpdating: data.is_updating || false
    };
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error fetching news metadata:', error);
    return {
      newsCount: 0,
      lastUpdated: null,
      nextUpdate: null,
      isUpdating: false
    };
  }
};

/**
 * Test function to check if the API endpoint is accessible
 */
export const testAPIEndpoint = async () => {
  try {
    // eslint-disable-next-line no-console
    console.log('Testing API endpoint accessibility...');
    const response = await fetch(FXLABS_API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    // eslint-disable-next-line no-console
    console.log('Test response status:', response.status);
    // eslint-disable-next-line no-console
    console.log('Test response ok:', response.ok);
    
    if (response.ok) {
      const data = await response.json();
      return { success: true, data };
    } else {
      return { success: false, status: response.status, statusText: response.statusText };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const newsService = {
  fetchForexFactoryNews,
  analyzeNewsWithAI,
  getUpcomingNews,
  getHighImpactNews,
  subscribeToNewsUpdates,
  getNewsMetadata,
  pollForNews,
  testAPIEndpoint
};

export default newsService;
