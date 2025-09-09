import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';
import { supportService } from '../../services/supportService';

const TicketRatingDialog = ({ ticket, isOpen, onClose, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    setSubmitting(true);
    try {
      const response = await supportService.rateTicket(ticket.id, {
        rating,
        feedback
      });

      if (response.success) {
        toast.success('Thank you for your feedback!');
        onRatingSubmitted && onRatingSubmitted(rating, feedback);
        onClose();
      } else {
        toast.error(response.error || 'Failed to submit rating');
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const getRatingText = (rating) => {
    switch (rating) {
      case 1: return 'Very Poor';
      case 2: return 'Poor';
      case 3: return 'Fair';
      case 4: return 'Good';
      case 5: return 'Excellent';
      default: return 'Select Rating';
    }
  };

  const getRatingColor = (rating) => {
    switch (rating) {
      case 1: return 'text-red-500';
      case 2: return 'text-orange-500';
      case 3: return 'text-yellow-500';
      case 4: return 'text-blue-500';
      case 5: return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-semibold">
            How was your support experience?
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Ticket Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 truncate">
                  {ticket?.subject}
                </h4>
                <p className="text-sm text-gray-500">
                  Ticket #{ticket?.ticket_number}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={`text-xs ${
                ticket?.status === 'closed' ? 'bg-gray-100 text-gray-700' : 'bg-green-100 text-green-700'
              }`}>
                {ticket?.status === 'closed' ? 'Closed' : 'Resolved'}
              </Badge>
              {ticket?.assigned_admin && (
                <span className="text-xs text-gray-600">
                  by {ticket.assigned_admin.full_name || ticket.assigned_admin.username}
                </span>
              )}
            </div>
          </div>

          {/* Star Rating */}
          <div className="text-center">
            <div className="flex justify-center items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="transition-all duration-200 transform hover:scale-110"
                >
                  <Star
                    className={`h-8 w-8 ${
                      star <= (hoveredStar || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className={`text-sm font-medium ${getRatingColor(rating)}`}>
              {getRatingText(rating)}
            </p>
          </div>

          {/* Feedback Text */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Additional feedback (optional)
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us about your experience with our support team..."
              className="min-h-[80px] resize-none"
              maxLength={500}
            />
            <p className="text-xs text-gray-500 text-right">
              {feedback.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
              disabled={submitting}
            >
              Skip
            </Button>
            <Button
              onClick={handleSubmitRating}
              disabled={rating === 0 || submitting}
              className="flex-1"
            >
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </Button>
          </div>

          {/* Quick Rating Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRating(5)}
              className="flex-1 text-green-600 border-green-200 hover:bg-green-50"
            >
              <ThumbsUp className="h-4 w-4 mr-1" />
              Great!
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRating(1)}
              className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
            >
              <ThumbsDown className="h-4 w-4 mr-1" />
              Poor
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TicketRatingDialog;
