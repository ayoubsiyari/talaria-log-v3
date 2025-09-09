import os
import json
import requests
from typing import List, Dict, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.openai_api_key = os.getenv('OPENAI_API_KEY')
        self.openai_base_url = os.getenv('OPENAI_BASE_URL', 'https://api.openai.com/v1')
        
    def generate_smart_replies(self, ticket_subject: str, conversation_history: List[Dict], 
                              ticket_category: str = None, user_sentiment: str = None) -> List[str]:
        """
        Generate smart reply suggestions based on ticket context
        """
        try:
            if not self.openai_api_key:
                logger.warning("OpenAI API key not configured, returning default suggestions")
                return self._get_default_suggestions(ticket_category)
            
            # Prepare conversation context
            context = self._prepare_conversation_context(ticket_subject, conversation_history)
            
            # Create prompt for AI
            prompt = self._create_smart_reply_prompt(context, ticket_category, user_sentiment)
            
            # Call OpenAI API
            response = self._call_openai_api(prompt)
            
            if response and 'choices' in response:
                suggestions_text = response['choices'][0]['message']['content']
                suggestions = self._parse_suggestions(suggestions_text)
                return suggestions[:5]  # Return max 5 suggestions
            else:
                logger.error("Failed to get valid response from OpenAI")
                return self._get_default_suggestions(ticket_category)
                
        except Exception as e:
            logger.error(f"Error generating smart replies: {str(e)}")
            return self._get_default_suggestions(ticket_category)
    
    def analyze_sentiment(self, message: str) -> Dict:
        """
        Analyze sentiment of a message
        """
        try:
            if not self.openai_api_key:
                return {"sentiment": "neutral", "confidence": 0.5, "urgency": "low"}
            
            prompt = f"""
            Analyze the sentiment and urgency of this customer support message:
            "{message}"
            
            Return a JSON response with:
            - sentiment: "positive", "negative", "neutral", "angry", "frustrated"
            - confidence: float between 0 and 1
            - urgency: "low", "medium", "high", "critical"
            - keywords: list of important words that indicate sentiment
            """
            
            response = self._call_openai_api(prompt)
            
            if response and 'choices' in response:
                content = response['choices'][0]['message']['content']
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return {"sentiment": "neutral", "confidence": 0.5, "urgency": "low"}
            else:
                return {"sentiment": "neutral", "confidence": 0.5, "urgency": "low"}
                
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {str(e)}")
            return {"sentiment": "neutral", "confidence": 0.5, "urgency": "low"}
    
    def summarize_ticket(self, conversation_history: List[Dict]) -> str:
        """
        Generate a summary of the ticket conversation
        """
        try:
            if not self.openai_api_key:
                return "AI summarization not available"
            
            # Prepare conversation text
            conversation_text = self._format_conversation_for_summary(conversation_history)
            
            prompt = f"""
            Summarize this customer support conversation in 2-3 sentences:
            
            {conversation_text}
            
            Focus on:
            - Main issue/problem
            - Current status
            - Key actions taken
            """
            
            response = self._call_openai_api(prompt)
            
            if response and 'choices' in response:
                return response['choices'][0]['message']['content'].strip()
            else:
                return "Unable to generate summary"
                
        except Exception as e:
            logger.error(f"Error summarizing ticket: {str(e)}")
            return "Unable to generate summary"
    
    def _call_openai_api(self, prompt: str) -> Optional[Dict]:
        """Make API call to OpenAI"""
        try:
            headers = {
                'Authorization': f'Bearer {self.openai_api_key}',
                'Content-Type': 'application/json'
            }
            
            data = {
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a helpful customer support assistant. Provide concise, professional, and helpful responses.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': 500,
                'temperature': 0.7
            }
            
            response = requests.post(
                f'{self.openai_base_url}/chat/completions',
                headers=headers,
                json=data,
                timeout=10
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"OpenAI API error: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            logger.error(f"Error calling OpenAI API: {str(e)}")
            return None
    
    def _prepare_conversation_context(self, subject: str, history: List[Dict]) -> str:
        """Prepare conversation context for AI analysis"""
        context = f"Ticket Subject: {subject}\n\nConversation History:\n"
        
        for msg in history[-10:]:  # Last 10 messages
            role = "Customer" if not msg.get('is_admin_reply') else "Support Agent"
            content = msg.get('message', '')
            context += f"{role}: {content}\n"
        
        return context
    
    def _create_smart_reply_prompt(self, context: str, category: str, sentiment: str) -> str:
        """Create prompt for smart reply generation"""
        prompt = f"""
        Based on this customer support conversation, generate 5 helpful reply suggestions for the support agent.
        
        Context:
        {context}
        
        Category: {category or 'General'}
        Customer Sentiment: {sentiment or 'neutral'}
        
        Requirements:
        - Be professional and helpful
        - Address the customer's concern
        - Keep responses concise (1-2 sentences)
        - Vary the tone and approach
        - Include both immediate solutions and follow-up options
        
        Return only the suggestions, one per line, starting with "- "
        """
        return prompt
    
    def _parse_suggestions(self, suggestions_text: str) -> List[str]:
        """Parse AI response into list of suggestions"""
        suggestions = []
        lines = suggestions_text.strip().split('\n')
        
        for line in lines:
            line = line.strip()
            if line.startswith('- '):
                suggestions.append(line[2:])
            elif line.startswith('• '):
                suggestions.append(line[2:])
            elif line and not line.startswith('#') and len(line) > 10:
                suggestions.append(line)
        
        return suggestions[:5]  # Return max 5 suggestions
    
    def _get_default_suggestions(self, category: str) -> List[str]:
        """Return default suggestions when AI is not available"""
        default_suggestions = {
            'technical': [
                "I understand you're experiencing technical difficulties. Let me help you troubleshoot this issue.",
                "Thank you for reporting this technical problem. I'll investigate and get back to you shortly.",
                "I can see this is a technical issue. Let me gather some additional information to better assist you."
            ],
            'billing': [
                "I understand your concern about the billing. Let me review your account and address this issue.",
                "Thank you for bringing this billing matter to our attention. I'll look into it right away.",
                "I can help you resolve this billing issue. Let me check the details and provide a solution."
            ],
            'general': [
                "Thank you for contacting us. I'm here to help you resolve this issue.",
                "I understand your concern. Let me assist you with finding a solution.",
                "Thank you for reaching out. I'll do my best to help you with this matter."
            ]
        }
        
        return default_suggestions.get(category, default_suggestions['general'])
    
    def _format_conversation_for_summary(self, history: List[Dict]) -> str:
        """Format conversation history for summary generation"""
        formatted = ""
        for msg in history:
            role = "Customer" if not msg.get('is_admin_reply') else "Agent"
            content = msg.get('message', '')
            formatted += f"{role}: {content}\n"
        return formatted

# Global instance
ai_service = AIService()
