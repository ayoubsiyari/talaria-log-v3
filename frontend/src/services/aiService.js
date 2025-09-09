import api from '../config/api';

class AIService {
  /**
   * Get smart reply suggestions for a ticket
   * @param {number} ticketId - The ticket ID
   * @returns {Promise<Array>} Array of suggestion strings
   */
  async getSmartReplies(ticketId) {
    try {
      const response = await api.get(`/support/ai/smart-replies/${ticketId}`);
      
      if (response.data.success) {
        return response.data.suggestions;
      } else {
        throw new Error(response.data.error || 'Failed to get smart replies');
      }
    } catch (error) {
      console.error('Error getting smart replies:', error);
      // Return default suggestions if AI service fails
      return [
        "Thank you for contacting us. I'm here to help you resolve this issue.",
        "I understand your concern. Let me assist you with finding a solution.",
        "Thank you for reaching out. I'll do my best to help you with this matter."
      ];
    }
  }

  /**
   * Analyze sentiment of a message
   * @param {string} message - The message to analyze
   * @returns {Promise<Object>} Sentiment analysis result
   */
  async analyzeSentiment(message) {
    try {
      const response = await api.post('/support/ai/analyze-sentiment', {
        message: message
      });
      
      if (response.data.success) {
        return response.data.sentiment;
      } else {
        throw new Error(response.data.error || 'Failed to analyze sentiment');
      }
    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      // Return default sentiment if AI service fails
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        urgency: 'low',
        keywords: []
      };
    }
  }

  /**
   * Generate summary of a ticket conversation
   * @param {number} ticketId - The ticket ID
   * @returns {Promise<string>} Summary text
   */
  async summarizeTicket(ticketId) {
    try {
      const response = await api.get(`/support/ai/summarize-ticket/${ticketId}`);
      
      if (response.data.success) {
        return response.data.summary;
      } else {
        throw new Error(response.data.error || 'Failed to generate summary');
      }
    } catch (error) {
      console.error('Error summarizing ticket:', error);
      return 'Unable to generate summary at this time.';
    }
  }

  /**
   * Get sentiment color and icon based on sentiment analysis
   * @param {Object} sentiment - Sentiment analysis result
   * @returns {Object} Color and icon information
   */
  getSentimentDisplay(sentiment) {
    const sentimentData = {
      positive: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '😊',
        label: 'Positive'
      },
      negative: {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '😞',
        label: 'Negative'
      },
      angry: {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        icon: '😠',
        label: 'Angry'
      },
      frustrated: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '😤',
        label: 'Frustrated'
      },
      neutral: {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '😐',
        label: 'Neutral'
      }
    };

    return sentimentData[sentiment.sentiment] || sentimentData.neutral;
  }

  /**
   * Get urgency display information
   * @param {string} urgency - Urgency level
   * @returns {Object} Urgency display information
   */
  getUrgencyDisplay(urgency) {
    const urgencyData = {
      critical: {
        color: 'text-red-700',
        bgColor: 'bg-red-100',
        borderColor: 'border-red-300',
        icon: '🚨',
        label: 'Critical'
      },
      high: {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '⚠️',
        label: 'High'
      },
      medium: {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: '⚡',
        label: 'Medium'
      },
      low: {
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '📝',
        label: 'Low'
      }
    };

    return urgencyData[urgency] || urgencyData.low;
  }
}

export default new AIService();
