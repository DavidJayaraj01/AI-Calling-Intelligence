"""
Sentiment Analysis Service using Google Gemini API
"""
import asyncio
from typing import List, Dict, Any, Tuple
import json
import re
from datetime import datetime
import google.generativeai as genai
from loguru import logger
from app.core.config import settings
from app.models import CallSentiment

class SentimentAnalyzer:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info("Sentiment analysis service initialized with Gemini API")

    def _segment_transcript(self, transcript: str, segment_length: int = 30) -> List[Dict[str, Any]]:
        """
        Segment transcript into time-based chunks for analysis
        """
        sentences = re.split(r'[.!?]+', transcript)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        segments = []
        current_segment = ""
        start_time = 0
        
        for i, sentence in enumerate(sentences):
            current_segment += sentence + ". "
            
            if (i + 1) % 3 == 0 or len(current_segment) > 200:
                end_time = start_time + segment_length
                
                segments.append({
                    'text': current_segment.strip(),
                    'start_time': start_time,
                    'end_time': end_time,
                    'speaker': self._identify_speaker(current_segment)
                })
                
                current_segment = ""
                start_time = end_time
        
        if current_segment.strip():
            segments.append({
                'text': current_segment.strip(),
                'start_time': start_time,
                'end_time': start_time + segment_length,
                'speaker': self._identify_speaker(current_segment)
            })
        
        return segments

    def _identify_speaker(self, text: str) -> str:
        """Simple speaker identification based on common patterns"""
        text_lower = text.lower()
        
        if any(phrase in text_lower for phrase in ['i think', 'in my opinion', 'from our side']):
            return 'distributor'
        elif any(phrase in text_lower for phrase in ['we can provide', 'our product', 'from our end']):
            return 'vendor'
        else:
            return 'unknown'

    def analyze_sentiment(self, transcript: str, call_context: Dict[str, Any] = None) -> Dict[str, Any]:
        """
        Analyze sentiment of entire call transcript using Gemini API
        """
        try:
            segments = self._segment_transcript(transcript)
            
            prompt = f"""You are an expert sentiment analyst specializing in business communications. Analyze the sentiment of this business call transcript between a vendor and distributor.

Transcript:
{transcript}

Please analyze:
1. Overall sentiment (POSITIVE, NEGATIVE, NEUTRAL)
2. Confidence score (0.0 to 1.0)
3. Key emotions detected
4. Sentiment for each speaker if identifiable

Return ONLY valid JSON with this exact format:
{{
    "overall_sentiment": "POSITIVE|NEGATIVE|NEUTRAL",
    "confidence": 0.85,
    "emotions": ["emotion1", "emotion2"],
    "speaker_sentiments": {{
        "distributor": "POSITIVE|NEGATIVE|NEUTRAL",
        "vendor": "POSITIVE|NEGATIVE|NEUTRAL"
    }},
    "summary": "Brief summary of the sentiment analysis"
}}"""

            response = self.model.generate_content(
                prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.2,
                    max_output_tokens=1000,
                )
            )
            
            content = response.text
            
            try:
                json_start = content.find('{')
                json_end = content.rfind('}') + 1
                if json_start >= 0 and json_end > json_start:
                    sentiment_data = json.loads(content[json_start:json_end])
                else:
                    sentiment_data = {}
            except json.JSONDecodeError as e:
                logger.error(f"Error parsing sentiment response: {e}")
                sentiment_data = {}
            
            # Analyze segments
            segment_sentiments = self._analyze_segments(segments)
            
            result = {
                'overall_sentiment': sentiment_data.get('overall_sentiment', 'NEUTRAL'),
                'overall_confidence': sentiment_data.get('confidence', 0.5),
                'emotions': sentiment_data.get('emotions', []),
                'speaker_sentiments': sentiment_data.get('speaker_sentiments', {}),
                'summary': sentiment_data.get('summary', ''),
                'segments': segment_sentiments,
                'analyzed_at': datetime.utcnow().isoformat()
            }
            
            logger.info(f"Analyzed sentiment: {result['overall_sentiment']} (confidence: {result['overall_confidence']})")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            return self._fallback_sentiment_analysis(transcript)

    def _analyze_segments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Analyze sentiment for each segment"""
        segment_results = []
        
        for segment in segments:
            try:
                prompt = f"You are a sentiment classifier. Analyze the sentiment of this text segment and respond with only POSITIVE, NEGATIVE, or NEUTRAL: {segment['text']}"
                
                response = self.model.generate_content(
                    prompt,
                    generation_config=genai.types.GenerationConfig(
                        temperature=0.1,
                        max_output_tokens=10,
                    )
                )
                
                sentiment = response.text.strip().upper()
                if sentiment not in ['POSITIVE', 'NEGATIVE', 'NEUTRAL']:
                    sentiment = 'NEUTRAL'
                
                segment_results.append({
                    'text': segment['text'],
                    'start_time': segment['start_time'],
                    'end_time': segment['end_time'],
                    'speaker': segment['speaker'],
                    'sentiment': sentiment,
                    'confidence': 0.8
                })
                
            except Exception as e:
                logger.error(f"Error analyzing segment sentiment: {e}")
                segment_results.append({
                    'text': segment['text'],
                    'start_time': segment['start_time'],
                    'end_time': segment['end_time'],
                    'speaker': segment['speaker'],
                    'sentiment': 'NEUTRAL',
                    'confidence': 0.3
                })
        
        return segment_results

    def _fallback_sentiment_analysis(self, transcript: str) -> Dict[str, Any]:
        """Fallback sentiment analysis using keywords"""
        logger.info("Using fallback keyword-based sentiment analysis")
        
        positive_keywords = ['good', 'great', 'excellent', 'happy', 'satisfied', 'pleased', 'perfect']
        negative_keywords = ['bad', 'terrible', 'awful', 'disappointed', 'frustrated', 'angry', 'problem']
        
        text_lower = transcript.lower()
        positive_count = sum(1 for word in positive_keywords if word in text_lower)
        negative_count = sum(1 for word in negative_keywords if word in text_lower)
        
        if positive_count > negative_count:
            sentiment = 'POSITIVE'
            confidence = min(0.8, positive_count / (positive_count + negative_count))
        elif negative_count > positive_count:
            sentiment = 'NEGATIVE' 
            confidence = min(0.8, negative_count / (positive_count + negative_count))
        else:
            sentiment = 'NEUTRAL'
            confidence = 0.5
        
        return {
            'overall_sentiment': sentiment,
            'overall_confidence': confidence,
            'emotions': [],
            'speaker_sentiments': {},
            'summary': 'Keyword-based analysis',
            'segments': [],
            'analyzed_at': datetime.utcnow().isoformat()
        }

# Global instance
sentiment_analyzer = SentimentAnalyzer()