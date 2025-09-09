import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  MessageSquare, 
  Loader2, 
  RefreshCw,
  Bot
} from 'lucide-react';
import aiService from '../../services/aiService';
import { toast } from 'sonner';

const SmartReplySuggestions = ({ ticketId, onSuggestionClick, disabled = false }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load suggestions when component mounts or ticketId changes
  useEffect(() => {
    if (ticketId && !disabled) {
      loadSuggestions();
    }
  }, [ticketId, disabled]);

  const loadSuggestions = async () => {
    if (!ticketId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const suggestions = await aiService.getSmartReplies(ticketId);
      setSuggestions(suggestions);
    } catch (error) {
      console.error('Error loading smart replies:', error);
      setError('Failed to load suggestions');
      toast.error('Failed to load AI suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }
  };

  const handleRefresh = () => {
    loadSuggestions();
  };

  if (disabled) {
    return null;
  }

  return (
    <div className="mb-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Bot className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">AI Suggestions</span>
          </div>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            <Sparkles className="h-3 w-3 mr-1" />
            Smart Replies
          </Badge>
        </div>
        
        <Button
          onClick={handleRefresh}
          variant="ghost"
          size="sm"
          disabled={loading}
          className="h-7 px-2 text-xs text-gray-600 hover:text-gray-900"
        >
          {loading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <RefreshCw className="h-3 w-3" />
          )}
        </Button>
      </div>

      {/* Suggestions */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Generating AI suggestions...</span>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-4">
          <div className="text-center">
            <div className="text-sm text-gray-500 mb-2">{error}</div>
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Try Again
            </Button>
          </div>
        </div>
      ) : suggestions.length > 0 ? (
        <div className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <Button
              key={index}
              onClick={() => handleSuggestionClick(suggestion)}
              variant="outline"
              size="sm"
              className="w-full justify-start text-left h-auto p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200"
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-700 leading-relaxed">
                  {suggestion}
                </span>
              </div>
            </Button>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="text-sm text-gray-500">
            No AI suggestions available
          </div>
        </div>
      )}

      {/* Footer */}
      {suggestions.length > 0 && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Click any suggestion to use it in your reply
        </div>
      )}
    </div>
  );
};

export default SmartReplySuggestions;
