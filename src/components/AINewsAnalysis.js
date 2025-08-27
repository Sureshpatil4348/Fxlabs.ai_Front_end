import React, { useState } from 'react';
import useBaseMarketStore from '../store/useBaseMarketStore';
import { formatNewsTime, getImpactColor, formatCurrency } from '../utils/formatters';
import { 
  Newspaper, 
  Clock, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  RefreshCw, 
  ChevronDown, 
  ChevronRight,
  Brain,
  Target
} from 'lucide-react';

const NewsCard = ({ news, analysis, isUpcoming }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { time, timezone } = formatNewsTime(news.time);
  const currencyInfo = formatCurrency(news.currency);
  
  // Determine if actual vs forecast shows positive/negative surprise
  let surprise = null;
  if (news.actual !== null && news.forecast !== null) {
    const actualNum = parseFloat(news.actual);
    const forecastNum = parseFloat(news.forecast);
    if (!isNaN(actualNum) && !isNaN(forecastNum)) {
      surprise = actualNum > forecastNum ? 'positive' : actualNum < forecastNum ? 'negative' : 'neutral';
    }
  }

  return (
    <div className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
      isUpcoming ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'
    }`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-lg">{currencyInfo.flag}</span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getImpactColor(news.impact)}`}>
              {news.impact?.toUpperCase() || 'MEDIUM'}
            </span>
            {isUpcoming && (
              <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 font-medium">
                UPCOMING
              </span>
            )}
          </div>
          
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {news.title}
          </h3>
          
          <div className="flex items-center space-x-4 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>{time} {timezone}</span>
            </div>
            {isUpcoming && (
              <div className="text-yellow-600 font-medium">
                {/* In a real implementation, this would show countdown */}
                Starting soon
              </div>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
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
            {news.actual !== null ? news.actual : isUpcoming ? 'TBA' : '--'}
          </div>
        </div>
      </div>

      {/* AI Analysis */}
      {analysis && (
        <div className="border-t pt-3">
          <div className="flex items-center space-x-2 mb-2">
            <Brain className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-medium text-gray-900">AI Analysis</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Expected Effect:</span>
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
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Impacted Currencies:</span>
              <div className="flex items-center space-x-1">
                {analysis.impactedCurrencies.map(currency => {
                  const info = formatCurrency(currency);
                  return (
                    <span key={currency} className="text-xs flex items-center space-x-1">
                      <span>{info.flag}</span>
                      <span>{currency}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Details */}
      {isExpanded && analysis && (
        <div className="border-t pt-3 mt-3">
          <div className="space-y-3">
            {/* Suggested Pairs */}
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Target className="w-4 h-4 text-primary-600" />
                <span className="text-sm font-medium text-gray-900">Suggested Pairs to Watch</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {analysis.suggestedPairs.map(pair => (
                  <span 
                    key={pair}
                    className="text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded-full"
                  >
                    {pair}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Explanation */}
            <div>
              <div className="text-sm font-medium text-gray-900 mb-1">Analysis</div>
              <p className="text-xs text-gray-600 leading-relaxed">
                {analysis.explanation}
              </p>
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
  
  const [filter, setFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchNews();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Filter news based on selected filter
  const filteredNews = newsData.filter(news => {
    switch (filter) {
      case 'high':
        return news.impact === 'high';
      case 'upcoming':
        return news.actual === null;
      case 'released':
        return news.actual !== null;
      default:
        return true;
    }
  });

  // Sort news: upcoming first, then by impact
  const sortedNews = filteredNews.sort((a, b) => {
    // Upcoming news first
    if (a.actual === null && b.actual !== null) return -1;
    if (b.actual === null && a.actual !== null) return 1;
    
    // Then by impact
    const impactOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    return (impactOrder[b.impact] || 2) - (impactOrder[a.impact] || 2);
  });

  const filters = [
    { id: 'all', label: 'All News', count: newsData.length },
    { id: 'high', label: 'High Impact', count: newsData.filter(n => n.impact === 'high').length },
    { id: 'upcoming', label: 'Upcoming', count: newsData.filter(n => n.actual === null).length },
    { id: 'released', label: 'Released', count: newsData.filter(n => n.actual !== null).length }
  ];

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Newspaper className="w-5 h-5 text-primary-600" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI News Analysis</h2>
            <p className="text-sm text-gray-500">AI-powered forex news insights</p>
          </div>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing || newsLoading}
          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
          title="Refresh News"
        >
          <RefreshCw className={`w-4 h-4 ${(isRefreshing || newsLoading) ? 'animate-spin' : ''}`} />
        </button>
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
      <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
        {sortedNews.length > 0 ? (
          sortedNews.map((news) => (
            <NewsCard
              key={news.id}
              news={news}
              analysis={aiAnalysis.get(news.id)}
              isUpcoming={news.actual === null}
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

      {/* Footer Info */}
      {sortedNews.length > 0 && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Brain className="w-4 h-4 text-primary-600" />
              <span className="text-gray-600">
                Analysis powered by AI • Updates every 5 minutes
              </span>
            </div>
            <div className="text-gray-500">
              {sortedNews.length} news item{sortedNews.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AINewsAnalysis;
