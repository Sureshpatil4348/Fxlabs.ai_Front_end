import React, { useState, useEffect } from 'react';
import useBaseMarketStore from '../store/useBaseMarketStore';
import { formatNewsLocalDateTime, getImpactColor, formatCurrency } from '../utils/formatters';
import { 
  Newspaper, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw,
  Brain,
  Target,
  Info,
  X
} from 'lucide-react';

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
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6">
          {/* Economic Data */}
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

          {/* AI Analysis */}
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

                {/* Impacted Currencies */}
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

                {/* Suggested Pairs */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-700 font-medium mb-3 flex items-center space-x-2">
                    <Target className="w-4 h-4 text-primary-600" />
                    <span>Suggested Pairs to Watch</span>
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

                {/* Full Analysis */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-gray-700 font-medium mb-3">Detailed Analysis</div>
                  <div 
                    className="text-gray-700 leading-relaxed"
                    dangerouslySetInnerHTML={{
                      __html: analysis.explanation
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\n/g, '<br />')
                    }}
                  />
                </div>
              </div>
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
  
  // Determine if actual vs forecast shows positive/negative surprise
  let surprise = null;
  if (news.actual !== 'N/A' && news.forecast !== 'N/A' && news.actual !== null && news.forecast !== null) {
    const actualNum = parseFloat(news.actual);
    const forecastNum = parseFloat(news.forecast);
    if (!isNaN(actualNum) && !isNaN(forecastNum)) {
      surprise = actualNum > forecastNum ? 'positive' : actualNum < forecastNum ? 'negative' : 'neutral';
    }
  }

  // Check if this is an upcoming event (no actual data yet)
  const isUpcomingEvent = news.actual === 'N/A' || news.actual === null;

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      isUpcomingEvent ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{currencyInfo.flag}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(news.impact)}`}>
              {news.impact?.toUpperCase() || 'MEDIUM'}
            </span>
            {isUpcomingEvent && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                UPCOMING
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
            {isUpcomingEvent && (
              <div className="text-yellow-600 font-medium">
                Starting soon
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => onShowDetails(news, analysis)}
          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-md transition-colors"
          title="View Details"
        >
          <Info className="w-4 h-4" />
        </button>
      </div>

      {/* Data Values */}
      <div className="grid grid-cols-3 gap-3 mb-3 text-xs">
        <div className="text-center p-2 bg-gray-50 rounded">
          <div className="text-gray-600 mb-1">Previous</div>
          <div className="font-bold">{news.previous || '--'}</div>
        </div>
        <div className="text-center p-2 bg-blue-50 rounded">
          <div className="text-gray-600 mb-1">Forecast</div>
          <div className="font-bold">{news.forecast || '--'}</div>
        </div>
        <div className={`text-center p-2 rounded ${
          surprise === 'positive' ? 'bg-success-50 text-success-700' :
          surprise === 'negative' ? 'bg-danger-50 text-danger-700' :
          'bg-gray-50'
        }`}>
          <div className="text-gray-600 mb-1">Actual</div>
          <div className="font-bold">
            {news.actual !== 'N/A' && news.actual !== null ? news.actual : isUpcomingEvent ? 'TBA' : '--'}
          </div>
        </div>
      </div>

      {/* Quick Analysis Preview */}
      {analysis && (
        <div className="border-t pt-3">
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
  
  const [filter, setFilter] = useState('upcoming');
  const [selectedNews, setSelectedNews] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiAvailable, setApiAvailable] = useState(true);

  // Initialize news data when component mounts
  useEffect(() => {
    // Fetch news data immediately when component mounts
    console.log('AINewsAnalysis component mounted, fetching initial news data...');
    
    // Only fetch if we don't already have news data
    if (newsData.length === 0) {
      fetchNews();
    }
    
    // Set up polling every 10 minutes (600,000 ms)
    const interval = setInterval(() => {
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

  const handleShowDetails = (news, analysis) => {
    setSelectedNews(news);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedNews(null);
  };

  // Filter news based on selected filter
  const filteredNews = newsData.filter(news => {
    switch (filter) {
      case 'upcoming':
        return news.actual === 'N/A' || news.actual === null;
      case 'released':
        return news.actual !== 'N/A' && news.actual !== null;
      case 'upcoming':
        return news.actual === 'N/A' || news.actual === null;
      case 'released':
        return news.actual !== 'N/A' && news.actual !== null;
      default:
        return true;
    }
  });

  // Sort news: upcoming first, then by impact
  const sortedNews = filteredNews.sort((a, b) => {
    // Upcoming news first
    const aIsUpcoming = a.actual === 'N/A' || a.actual === null;
    const bIsUpcoming = b.actual === 'N/A' || b.actual === null;
    
    if (aIsUpcoming && !bIsUpcoming) return -1;
    if (bIsUpcoming && !aIsUpcoming) return 1;
    
    // Then by impact
    const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return (impactOrder[b.impact] || 2) - (impactOrder[a.impact] || 2);
  });

  const filters = [
    { id: 'upcoming', label: 'Upcoming', count: newsData.filter(n => n.actual === 'N/A' || n.actual === null).length },
    { id: 'released', label: 'Released', count: newsData.filter(n => n.actual !== 'N/A' && n.actual !== null).length },
    { id: 'all', label: 'All News', count: newsData.length }
  ];

  return (
    <div className="card z-9 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
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
      <div className="flex space-x-1 mb-6 p-1 bg-gray-100 rounded-lg">
        {filters.map((filterOption) => (
          <button
            key={filterOption.id}
            onClick={() => setFilter(filterOption.id)}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-md text-sm font-medium transition-colors ${
              filter === filterOption.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {filterOption.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              filter === filterOption.id ? 'bg-gray-100 text-gray-700' : 'bg-gray-200 text-gray-600'
            }`}>
              {filterOption.count}
            </span>
          </button>
        ))}
      </div>

      {/* News Feed */}
      <div className="space-y-4 overflow-y-auto max-h-[565px]">
        
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
              {filter === 'all' 
                ? 'No news data available at the moment.'
                : `No ${filter} news found.`}
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
  );
};

export default AINewsAnalysis;
