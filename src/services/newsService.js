// News service for ForexFactory API integration and AI analysis

// Perplexity AI configuration
const PERPLEXITY_API_KEY = "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";

// Mock data for development (replace with real API calls in production)
const mockNewsData = [
  {
    id: 1,
    title: 'FOMC Statement',
    time: '18:00 GMT',
    forecast: '5.25%',
    previous: '5.25%',
    actual: '5.50%',
    impact: 'high',
    currency: 'USD',
    date: new Date().toISOString()
  },
  {
    id: 2,
    title: 'ECB Interest Rate Decision',
    time: '12:45 GMT',
    forecast: '4.50%',
    previous: '4.50%',
    actual: null, // Upcoming
    impact: 'high',
    currency: 'EUR',
    date: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now
  },
  {
    id: 3,
    title: 'UK GDP Growth Rate QoQ',
    time: '09:30 GMT',
    forecast: '0.2%',
    previous: '0.1%',
    actual: '0.3%',
    impact: 'medium',
    currency: 'GBP',
    date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString() // 4 hours ago
  },
  {
    id: 4,
    title: 'Japanese CPI YoY',
    time: '23:30 GMT',
    forecast: '2.8%',
    previous: '2.7%',
    actual: null, // Upcoming
    impact: 'medium',
    currency: 'JPY',
    date: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
  },
  {
    id: 5,
    title: 'Australian Employment Change',
    time: '00:30 GMT',
    forecast: '25.0K',
    previous: '64.1K',
    actual: '35.6K',
    impact: 'high',
    currency: 'AUD',
    date: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() // 1 hour ago
  }
];

/**
 * Fetch news data from ForexFactory API
 * In development, returns mock data. In production, would call real API.
 */
export const fetchForexFactoryNews = async () => {
  try {
    // For development, return mock data
    if (process.env.NODE_ENV === 'development') {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return mockNewsData;
    }

    // Production API call (commented out for now)
    /*
    const response = await apiClient.get(FOREX_FACTORY_BASE_URL);
    
    // Transform ForexFactory data to our format
    const transformedData = response.data.map((item, index) => ({
      id: index + 1,
      title: item.title,
      time: item.time,
      forecast: item.forecast,
      previous: item.previous,
      actual: item.actual,
      impact: item.impact,
      currency: item.currency,
      date: item.date
    }));
    
    return transformedData;
    */

    return mockNewsData;
  } catch (error) {
    console.error('Error fetching ForexFactory news:', error);
    // Return mock data as fallback
    return mockNewsData;
  }
};



/**
 * Analyze news using Perplexity AI
 * In development, returns mock analysis. In production, would call real API.
 */
export const analyzeNewsWithAI = async (newsItem) => {
  try {
    // For development, return mock analysis
    if (process.env.NODE_ENV === 'development' || !PERPLEXITY_API_KEY) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock analysis based on news data
      let effect = 'Neutral';
      let explanation = `${newsItem.currency} analysis pending.`;
      let suggestedPairs = ['EURUSD'];
      
      if (newsItem.actual !== null && newsItem.forecast !== null) {
        const actualNum = parseFloat(newsItem.actual);
        const forecastNum = parseFloat(newsItem.forecast);
        
        if (!isNaN(actualNum) && !isNaN(forecastNum)) {
          if (actualNum > forecastNum) {
            effect = 'Bullish';
            explanation = `${newsItem.currency} likely to strengthen as actual data (${newsItem.actual}) exceeded forecast (${newsItem.forecast}). This positive surprise suggests economic resilience.`;
          } else if (actualNum < forecastNum) {
            effect = 'Bearish';
            explanation = `${newsItem.currency} likely to weaken as actual data (${newsItem.actual}) fell short of forecast (${newsItem.forecast}). This disappointment may pressure the currency.`;
          } else {
            effect = 'Neutral';
            explanation = `${newsItem.currency} impact limited as actual data matched forecast. Market reaction likely to be muted unless other factors emerge.`;
          }
        }
      } else if (newsItem.actual === null) {
        effect = 'Neutral';
        explanation = `Awaiting ${newsItem.title} release. High impact expected on ${newsItem.currency} pairs. Monitor for deviation from forecast of ${newsItem.forecast}.`;
      }

      // Generate suggested pairs based on currency
      switch (newsItem.currency) {
        case 'USD':
          suggestedPairs = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD'];
          break;
        case 'EUR':
          suggestedPairs = ['EURUSD', 'EURGBP', 'EURJPY', 'EURAUD'];
          break;
        case 'GBP':
          suggestedPairs = ['GBPUSD', 'EURGBP', 'GBPJPY', 'GBPAUD'];
          break;
        case 'JPY':
          suggestedPairs = ['USDJPY', 'EURJPY', 'GBPJPY', 'AUDJPY'];
          break;
        case 'AUD':
          suggestedPairs = ['AUDUSD', 'EURAUD', 'GBPAUD', 'AUDJPY'];
          break;
        default:
          suggestedPairs = ['EURUSD', 'GBPUSD'];
      }

      return {
        effect,
        impactedCurrencies: [newsItem.currency],
        suggestedPairs,
        explanation
      };
    }

    // Production API call (commented out for now)
    /*
    
    const response = await apiClient.post(
      PERPLEXITY_API_URL,
      {
        model: 'llama-3.1-sonar-small-128k-online',
        messages: [
          {
            role: 'system',
            content: 'You are a professional forex analyst providing concise market analysis.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.2
      },
      {
        headers: {
          'Authorization': `Bearer ${PERPLEXITY_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse the AI response and extract structured data
    const aiResponse = response.data.choices[0].message.content;
    
    // This would need more sophisticated parsing in production
    // For now, return a structured response based on the AI output
    return parseAIResponse(aiResponse, newsItem);
    */

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
      return newsDate > now && newsDate <= next24Hours && news.actual === null;
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
 * Subscribe to real-time news updates (WebSocket)
 * This would connect to a real-time news feed in production
 */
export const subscribeToNewsUpdates = (callback) => {
  // Mock real-time updates for development
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

const newsService = {
  fetchForexFactoryNews,
  analyzeNewsWithAI,
  getUpcomingNews,
  getHighImpactNews,
  subscribeToNewsUpdates
};

export default newsService;
