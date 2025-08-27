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
        console.log(`Impact determination for "${headline}":`, {
          effect: item.analysis.effect,
          isHighImpact,
          isLowImpact,
          finalImpact: impact
        });
      }
    }

    // Parse the time string from the API (format: "2025.08.27 17:30:00")
    let date = new Date();
    let timeString = item.time || '';
    let gmtTime = '';
    
    if (timeString) {
      try {
        // Parse the time string format "2025.08.27 17:30:00"
        const [datePart, timePart] = timeString.split(' ');
        const [year, month, day] = datePart.split('.');
        const [hour, minute, second] = timePart.split(':');
        
        // Create date object (month is 0-indexed in JavaScript)
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
        
        // Format time for display
        gmtTime = `${hour}:${minute} GMT`;
      } catch (error) {
        console.error('Error parsing time:', timeString, error);
        date = new Date();
        gmtTime = 'N/A';
      }
    }

    // Use analyzed_at as fallback for date if time parsing fails
    if (date.toString() === 'Invalid Date' && item.analyzed_at) {
      date = new Date(item.analyzed_at);
      gmtTime = date.toLocaleTimeString('en-GB', { timeZone: 'GMT' });
    }

    return {
      id: index + 1,
      title: item.headline || `FX Analysis ${index + 1}`,
      time: gmtTime,
      forecast: item.forecast || 'N/A',
      previous: item.previous || 'N/A',
      actual: item.actual || 'N/A',
      impact: impact,
      currency: currency,
      date: date.toISOString(),
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
    console.log('Fetching news from FX Labs API...');
    console.log('API URL:', FXLABS_API_BASE_URL);
    
    const response = await fetch(FXLABS_API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      mode: 'cors',
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('FX Labs API response:', data);
    
    // Transform the API response to match our existing format
    const transformedData = transformFXLabsData(data);
    console.log('Transformed news data:', transformedData);
    
    return transformedData;
  } catch (error) {
    console.error('Error fetching FX Labs news:', error);
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
    console.log('Polling for fresh news data...');
    const news = await fetchForexFactoryNews();
    return news;
  } catch (error) {
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
      
      // Extract suggested pairs from the analysis
      let suggestedPairs = ['EURUSD', 'GBPUSD', 'USDJPY'];
      if (analysis.currency_pairs && analysis.currency_pairs !== 'Major pairs') {
        // Parse currency pairs if they're specified
        if (analysis.currency_pairs.includes('EUR/USD')) suggestedPairs = ['EURUSD'];
        else if (analysis.currency_pairs.includes('GBP/USD')) suggestedPairs = ['GBPUSD'];
        else if (analysis.currency_pairs.includes('USD/JPY')) suggestedPairs = ['USDJPY'];
        else if (analysis.currency_pairs.includes('AUD/USD')) suggestedPairs = ['AUDUSD'];
        else if (analysis.currency_pairs.includes('USD/CAD')) suggestedPairs = ['USDCAD'];
        else if (analysis.currency_pairs.includes('EUR/GBP')) suggestedPairs = ['EURGBP'];
        else if (analysis.currency_pairs.includes('EUR/CHF')) suggestedPairs = ['EURCHF'];
        else if (analysis.currency_pairs.includes('CHF/JPY')) suggestedPairs = ['CHFJPY'];
        else if (analysis.currency_pairs.includes('AUD/JPY')) suggestedPairs = ['AUDJPY'];
        else if (analysis.currency_pairs.includes('NOK/USD')) suggestedPairs = ['NOKUSD'];
        else if (analysis.currency_pairs.includes('USD/RUB')) suggestedPairs = ['USDRUB'];
      }

      // Extract impacted currencies from the analysis text
      let impactedCurrencies = [newsItem.currency];
      if (analysis.currencies_impacted && analysis.currencies_impacted !== 'Multiple') {
        // Try to extract specific currencies from the analysis
        const currencyMatch = analysis.currencies_impacted.match(/(USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD|NOK|RUB|MXN)/g);
        if (currencyMatch) {
          impactedCurrencies = [...new Set(currencyMatch)];
        }
      }

      // Also try to extract currencies from the full analysis text
      if (analysis.full_analysis) {
        const currencyPattern = /(USD|EUR|GBP|JPY|AUD|CAD|CHF|NZD|NOK|RUB|MXN)/g;
        const foundCurrencies = analysis.full_analysis.match(currencyPattern);
        if (foundCurrencies) {
          const uniqueCurrencies = [...new Set(foundCurrencies)];
          // Merge with existing currencies, avoiding duplicates
          impactedCurrencies = [...new Set([...impactedCurrencies, ...uniqueCurrencies])];
        }
      }

      // Extract specific currency pairs mentioned in the analysis
      if (analysis.full_analysis) {
        const pairPattern = /([A-Z]{3}\/[A-Z]{3})/g;
        const foundPairs = analysis.full_analysis.match(pairPattern);
        if (foundPairs) {
          const uniquePairs = [...new Set(foundPairs)];
          // Convert to our format (remove slashes)
          const convertedPairs = uniquePairs.map(pair => pair.replace('/', ''));
          suggestedPairs = [...new Set([...suggestedPairs, ...convertedPairs])];
        }
      }

      return {
        effect: analysis.effect || 'Neutral',
        impactedCurrencies: impactedCurrencies,
        suggestedPairs: suggestedPairs,
        explanation: analysis.full_analysis || 'Analysis available from FX Labs API.'
      };
    }

    // Fallback analysis if no API data is available
    return {
      effect: 'Neutral',
      impactedCurrencies: [newsItem.currency],
      suggestedPairs: ['EURUSD'],
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
    console.log('Testing API endpoint accessibility...');
    const response = await fetch(FXLABS_API_BASE_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });
    
    console.log('Test response status:', response.status);
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
