import { 
  Newspaper, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw,
  Brain,
  Target,
  X
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import useBaseMarketStore from '../store/useBaseMarketStore';
import { formatNewsLocalDateTime, getImpactColor, formatCurrency, getEventTiming } from '../utils/formatters';

// Secure HTML sanitization function to prevent XSS attacks
const sanitizeHtml = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // First escape all HTML entities to prevent XSS
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Then safely apply only our whitelisted transformations
  return escaped
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br />');
};

// Countdown Timer Component
const CountdownTimer = ({ newsItem, className = "" }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const { dateObj } = formatNewsLocalDateTime({ 
        dateIso: newsItem.date, 
        originalTime: newsItem.originalTime 
      });
      
      const now = new Date();
      const eventTime = dateObj;
      const timeDiff = eventTime.getTime() - now.getTime();
      
      if (timeDiff <= 0) {
        setIsExpired(true);
        setTimeLeft(null);
        return;
      }
      
      setIsExpired(false);
      
      // Calculate time components
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      
      // Format based on time remaining
      let formattedTime;
      if (days > 0) {
        formattedTime = `${days}d ${hours}h ${minutes}m`;
      } else if (hours > 0) {
        formattedTime = `${hours}h ${minutes}m ${seconds}s`;
      } else if (minutes > 0) {
        formattedTime = `${minutes}m ${seconds}s`;
      } else {
        formattedTime = `${seconds}s`;
      }
      
      setTimeLeft(formattedTime);
    };

    // Update immediately
    updateTimer();
    
    // Update every second
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [newsItem.date, newsItem.originalTime]);

  if (isExpired) {
    return (
      <span className={`text-xs font-medium text-gray-600 ${className}`}>
        Started
      </span>
    );
  }

  if (!timeLeft) {
    return (
      <span className={`text-xs font-medium text-gray-600 ${className}`}>
        Calculating...
      </span>
    );
  }

  return (
    <span className={`text-xs font-medium text-orange-600 ${className}`}>
      {timeLeft}
    </span>
  );
};

const NewsModal = ({ news, analysis, isOpen, onClose }) => {
  if (!isOpen) return null;

  const { time, date } = formatNewsLocalDateTime({ dateIso: news.date, originalTime: news.originalTime });
  const currencyInfo = formatCurrency(news.currency);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between py-2 px-6 border-b">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{currencyInfo.flag}</span>
            <div className="flex flex-row items-center w-full justify-between">
              <h2 className="text-lg font-semibold text-gray-900">{news.title.split('(')[0]}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center space-x-2 mt-1 px-6">
          <Clock className="w-3 h-3 text-gray-500" />
          <span className="text-xs text-gray-600">{date} {time}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getImpactColor(news.impact)}`}>
            {news.impact?.toUpperCase() || 'MEDIUM'}
          </span>
          {getEventTiming(news).isUpcoming && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3 text-orange-500" />
              <CountdownTimer newsItem={news} />
            </div>
          )}
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* AI Analysis - Moved to top */}
          {analysis && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Brain className="w-5 h-5 text-primary-600" />
                <span>AI Analysis</span>
              </h3>
              
              <div className="space-y-4">
                {/* Effect */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700 font-medium">Expected Effect:</span>
                  <div className="flex items-center space-x-2">
                    {analysis.effect === 'Bullish' ? (
                      <TrendingUp className="w-5 h-5 text-success-600" />
                    ) : analysis.effect === 'Bearish' ? (
                      <TrendingDown className="w-5 h-5 text-danger-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-gray-600" />
                    )}
                    <span className={`text-lg font-semibold ${
                      analysis.effect === 'Bullish' ? 'text-success-600' :
                      analysis.effect === 'Bearish' ? 'text-danger-600' :
                      'text-gray-600'
                    }`}>
                      {analysis.effect}
                    </span>
                  </div>
                </div>

                {/* Suggested Pairs - Moved to second position in AI Analysis */}
                {analysis.suggestedPairs && analysis.suggestedPairs.length > 0 && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-gray-700 font-medium mb-3 flex items-center space-x-2">
                      <Target className="w-4 h-4 text-primary-600" />
                      <span>Suggested Pairs to Watch:</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {analysis.suggestedPairs.map(pair => (
                        <span 
                          key={pair}
                          className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium"
                        >
                          {pair}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Impacted Currencies - Moved to third position */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-700 font-medium mb-3">Impacted Currencies:</div>
                  <div className="flex flex-wrap gap-2">
                    {analysis.impactedCurrencies.map(currency => {
                      const info = formatCurrency(currency);
                      return (
                        <span key={currency} className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border">
                          <span className="text-lg">{info.flag}</span>
                          <span className="font-medium">{currency}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* Economic Data - Moved to third position */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Economic Data</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-2 bg-gray-50 rounded-lg">
                <div className="text-gray-600 mb-2">Previous</div>
                <div className="text-lg font-bold text-gray-900">{news.previous || '--'}</div>
              </div>
              <div className="text-center p-2 bg-blue-50 rounded-lg">
                <div className="text-gray-600 mb-2">Forecast</div>
                <div className="text-lg font-bold text-blue-900">{news.forecast || '--'}</div>
              </div>
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-gray-600 mb-2">Actual</div>
                <div className="text-lg font-bold text-green-900">
                  {news.actual !== 'N/A' && news.actual !== null ? news.actual : 'TBA'}
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Analysis - Moved to bottom */}
          {analysis && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Detailed Analysis</h3>
              <div 
                className="text-gray-700 leading-relaxed p-4 bg-gray-50 rounded-lg"
                dangerouslySetInnerHTML={{
                  __html: sanitizeHtml(analysis.explanation)
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const NewsCard = ({ news, analysis, onShowDetails }) => {
  const { time, date } = formatNewsLocalDateTime({ dateIso: news.date, originalTime: news.originalTime });
  const currencyInfo = formatCurrency(news.currency);
  
  // Get event timing information
  const eventTiming = getEventTiming(news);
  
  // Determine if this is an upcoming event (no actual data yet)
  const isUpcomingEvent = eventTiming.isUpcoming;

  // Determine if actual vs forecast shows positive/negative surprise
  let _surprise = null;
  if (news.actual !== 'N/A' && news.forecast !== 'N/A' && news.actual !== null && news.forecast !== null) {
    const actualNum = parseFloat(news.actual);
    const forecastNum = parseFloat(news.forecast);
    if (!isNaN(actualNum) && !isNaN(forecastNum)) {
      _surprise = actualNum > forecastNum ? 'positive' : actualNum < forecastNum ? 'negative' : 'neutral';
    }
  }

  // Border and background classes based on analysis effect and timing
  const effect = analysis?.effect;
  const borderClass =
    effect === 'Bullish' ? 'border-success-600 border-2' :
    effect === 'Bearish' ? 'border-danger-600 border-2' :
    eventTiming.isStartingSoon ? 'border-orange-300' :
    (isUpcomingEvent ? 'border-yellow-300' : 'border-gray-200');
  const backgroundClass = 
    effect === 'Bullish' ? 'bg-success-50' :
    effect === 'Bearish' ? 'bg-danger-50' :
    eventTiming.isStartingSoon ? 'bg-orange-50' :
    (isUpcomingEvent ? 'bg-yellow-50' : 'bg-white');

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onShowDetails(news)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { onShowDetails(news); } }}
      className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md cursor-pointer ${borderClass} ${backgroundClass}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{currencyInfo.flag}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(news.impact)}`}>
              {news.impact?.toUpperCase() || 'MEDIUM'}
            </span>
            {eventTiming.isUpcoming && (
              <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                eventTiming.isStartingSoon ? 'bg-orange-100 text-orange-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {eventTiming.isStartingSoon ? 'STARTING SOON' : 'UPCOMING'}
              </span>
            )}
            {eventTiming.isPast && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
                RELEASED
              </span>
            )}
          </div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {news.title.split('(')[0]}
          </h3>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{date} {time}</span>
            </div>
            {eventTiming.isUpcoming && (
              <div className="flex items-center space-x-1">
                <Clock className="w-3 h-3 text-orange-500" />
                <CountdownTimer newsItem={news} />
              </div>
            )}
            {eventTiming.isPast && (
              <div className="text-gray-600 font-medium">
                {eventTiming.timingText}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Suggested Pairs to Watch */}
      {analysis && analysis.suggestedPairs && analysis.suggestedPairs.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-semibold text-gray-900">Suggested Pairs to Watch</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {analysis.suggestedPairs.map(pair => (
              <span 
                key={pair}
                className="px-3 py-2 bg-primary-100 text-primary-700 rounded-lg font-medium text-xs"
              >
                {pair}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Quick Analysis Preview */}
      {analysis && (
        <div className="border-t pt-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-primary-600" />
              <span className="text-xs text-gray-600">AI Analysis</span>
            </div>
            <div className="flex items-center space-x-1">
              {analysis.effect === 'Bullish' ? (
                <TrendingUp className="w-3 h-3 text-success-600" />
              ) : analysis.effect === 'Bearish' ? (
                <TrendingDown className="w-3 h-3 text-danger-600" />
              ) : (
                <AlertCircle className="w-3 h-3 text-gray-600" />
              )}
              <span className={`text-xs font-medium ${
                analysis.effect === 'Bullish' ? 'text-success-600' :
                analysis.effect === 'Bearish' ? 'text-danger-600' :
                'text-gray-600'
              }`}>
                {analysis.effect}
              </span>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
};

const AINewsAnalysis = () => {
  const { 
    newsData, 
    aiAnalysis, 
    newsLoading, 
    fetchNews 
  } = useBaseMarketStore();
  
  // Get tab state from base market store
  const { tabState, updateNewsFilter, loadTabState } = useBaseMarketStore();
  
  const [newsFilter, setNewsFilter] = useState(tabState.news?.filter || 'upcoming');
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Load tab state on component mount
  useEffect(() => {
    loadTabState();
  }, [loadTabState]);

  // Update newsFilter when tabState changes
  useEffect(() => {
    if (tabState.news?.filter) {
      setNewsFilter(tabState.news.filter);
    }
  }, [tabState.news?.filter]);

  // Restrict to high-impact news globally
  const highImpactNews = newsData.filter((n) => n.impact === 'high');
  // const highImpactNews = newsData; Test for all news


  // Initialize news data when component mounts
  useEffect(() => {
    // Fetch news data immediately when component mounts
    // eslint-disable-next-line no-console
    console.log('AINewsAnalysis component mounted, fetching initial news data...');
    
    // Only fetch if we don't already have news data
    if (newsData.length === 0) {
      fetchNews();
    }
    
    // Set up polling every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
      // eslint-disable-next-line no-console
      console.log('Polling for fresh news data...');
      fetchNews();
    }, 10 * 60 * 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [fetchNews, newsData.length]);

  // Check API availability once on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const newsService = await import('../services/newsService');
        const result = await newsService.testAPIEndpoint();
        if (isMounted) setApiAvailable(!!result?.success);
      } catch (e) {
        if (isMounted) setApiAvailable(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleShowDetails = (news) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  // Filter news based on selected tab (applied on high-impact set)
  const filteredNews = highImpactNews.filter(news => {
    const eventTiming = getEventTiming(news);
    switch (newsFilter) {
      case 'upcoming':
        return eventTiming.isUpcoming;
      case 'released':
        return eventTiming.isPast || (news.actual !== 'N/A' && news.actual !== null);
      default:
        return true;
    }
  });

  // Sort news: starting soon first, then upcoming, then by impact
  const sortedNews = filteredNews.sort((a, b) => {
    const timingA = getEventTiming(a);
    const timingB = getEventTiming(b);
    
    // Starting soon events first
    if (timingA.isStartingSoon && !timingB.isStartingSoon) return -1;
    if (timingB.isStartingSoon && !timingA.isStartingSoon) return 1;
    
    // Then upcoming events
    if (timingA.isUpcoming && !timingB.isUpcoming) return -1;
    if (timingB.isUpcoming && !timingA.isUpcoming) return 1;
    
    // Then by impact
    const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return (impactOrder[b.impact] || 2) - (impactOrder[a.impact] || 2);
  });

  const filters = [
    { id: 'upcoming', label: 'Upcoming', count: highImpactNews.filter(n => getEventTiming(n).isUpcoming).length },
    { id: 'released', label: 'Released', count: highImpactNews.filter(n => getEventTiming(n).isPast || (n.actual !== 'N/A' && n.actual !== null)).length },
    { id: 'all', label: 'All', count: highImpactNews.length }
  ];

  // Handle news filter change with persistence
  const handleFilterChange = async (filter) => {
    setNewsFilter(filter);
    try {
      await updateNewsFilter(filter);
    } catch (error) {
      console.error('Failed to update news filter:', error);
      // Revert on error
      setNewsFilter(newsFilter);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 px-4 pt-4 pb-2 z-10 relative h-full flex flex-col">
      {/* Fixed Header Section */}
      <div className="flex-shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-primary-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI News Analysis</h2>
            <p className="text-sm text-gray-500">AI-powered forex news insights</p>
          </div>
        </div>
        {!apiAvailable && (
          <div className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">
            API unavailable. Showing cached or no data.
          </div>
        )}
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-3 p-1 bg-gray-100 rounded-lg">
        {filters.map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => handleFilterChange(filterOption.id)}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              newsFilter === filterOption.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filterOption.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              newsFilter === filterOption.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {filterOption.count}
            </span>
          </button>
        ))}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-2">
        {/* News Feed */}
        <div className="space-y-3">
        
        {sortedNews.length > 0 ? (
          sortedNews.map((news) => (
            <NewsCard
              key={news.id}
              news={news}
              analysis={aiAnalysis.get(news.id)}
              onShowDetails={handleShowDetails}
            />
          ))
        ) : newsLoading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Loading news data...</p>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No news available
            </h3>
            <p className="text-gray-500 text-sm">
              {newsFilter === 'all' 
                ? 'No news data available at the moment.'
                : `No ${newsFilter} news found.`}
            </p>
          </div>
        )}
        </div>

        {/* News Modal */}
        {selectedNews && (
          <NewsModal
            news={selectedNews}
            analysis={aiAnalysis.get(selectedNews.id)}
            isOpen={isModalOpen}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </div>
  );
};

export default AINewsAnalysis;