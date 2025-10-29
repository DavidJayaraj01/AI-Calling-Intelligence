"""
Sentiment Analysis Service using tabularisai/multilingual-sentiment-analysis
"""
import asyncio
from typing import List, Dict, Any, Tuple
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import numpy as np
import re
from datetime import datetime
from loguru import logger
from app.core.config import settings
from app.models import SentimentType

class SentimentAnalyzer:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.sentiment_pipeline = None
        self.emotion_pipeline = None
        self._load_models()

    def _load_models(self):
        """Load local sentiment analysis models"""
        try:
            # Load local multilingual sentiment model
            self.sentiment_pipeline = pipeline(
                "sentiment-analysis",
                model=settings.SENTIMENT_MODEL,
                device=0 if torch.cuda.is_available() else -1
            )
            
            # Use the same local model for emotion analysis
            self.emotion_pipeline = pipeline(
                "text-classification",
                model=settings.SENTIMENT_MODEL,
                device=0 if torch.cuda.is_available() else -1
            )
            
            logger.info(f"Local multilingual sentiment model loaded successfully from: {settings.SENTIMENT_MODEL}")
        except Exception as e:
            logger.error(f"Error loading local sentiment models: {e}")
            logger.error(f"Sentiment model path: {settings.SENTIMENT_MODEL}")
            # Fallback to keyword-based analysis
            self.sentiment_pipeline = None
            self.emotion_pipeline = None
            logger.info("Using fallback keyword-based sentiment analysis")

    def _segment_transcript(self, transcript: str, segment_length: int = 30) -> List[Dict[str, Any]]:
        """
        Segment transcript into time-based chunks for analysis
        
        Args:
            transcript: Full transcript text
            segment_length: Length of each segment in seconds
            
        Returns:
            List of transcript segments with timing
        """
        # Split transcript by sentences
        sentences = re.split(r'[.!?]+', transcript)
        sentences = [s.strip() for s in sentences if s.strip()]
        
        segments = []
        current_segment = ""
        start_time = 0
        sentence_duration = segment_length / max(len(sentences), 1)  # Average duration per sentence
        
        for i, sentence in enumerate(sentences):
            current_segment += sentence + ". "
            
            # Create segment every few sentences or at certain length
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
        
        # Add remaining text as final segment
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
        
        # Look for speaker indicators
        if any(phrase in text_lower for phrase in ['customer:', 'client:', 'user:']):
            return 'Customer'
        elif any(phrase in text_lower for phrase in ['support:', 'agent:', 'rep:', 'vendor:']):
            return 'Vendor'
        elif any(phrase in text_lower for phrase in ['distributor:', 'sales:']):
            return 'Distributor'
        else:
            # Default based on content patterns
            if any(phrase in text_lower for phrase in ['we have', 'our system', 'let me help']):
                return 'Vendor'
            elif any(phrase in text_lower for phrase in ['i need', 'we need', 'our issue']):
                return 'Customer'
            else:
                return 'Unknown'

    def _map_sentiment_label(self, label: str, score: float) -> Tuple[SentimentType, float]:
        """Map model output to our sentiment types"""
        label_lower = label.lower()
        
        if 'positive' in label_lower or 'pos' in label_lower:
            return SentimentType.POSITIVE, score
        elif 'negative' in label_lower or 'neg' in label_lower:
            return SentimentType.NEGATIVE, score
        elif 'neutral' in label_lower:
            return SentimentType.NEUTRAL, score
        else:
            # For models that use different labels
            if score > 0.6:
                return SentimentType.POSITIVE, score
            elif score < 0.4:
                return SentimentType.NEGATIVE, score
            else:
                return SentimentType.NEUTRAL, score

    async def analyze_sentiment(self, transcript: str, call_id: str) -> Dict[str, Any]:
        """
        Perform comprehensive sentiment analysis on call transcript
        
        Args:
            transcript: Call transcript text
            call_id: ID of the call
            
        Returns:
            Sentiment analysis results with segments and overall sentiment
        """
        try:
            # Segment the transcript
            segments = self._segment_transcript(transcript)
            
            # Analyze sentiment for each segment
            sentiment_segments = []
            segment_sentiments = []
            
            for segment in segments:
                segment_text = segment['text']
                
                # Get sentiment analysis
                if self.sentiment_pipeline is not None:
                    sentiment_result = self.sentiment_pipeline(segment_text)[0]
                    sentiment_type, confidence = self._map_sentiment_label(
                        sentiment_result['label'], 
                        sentiment_result['score']
                    )
                else:
                    # Use fallback keyword-based sentiment analysis
                    sentiment_type, confidence = self._fallback_sentiment_analysis(segment_text)
                
                # Get emotion analysis if available
                emotions = {}
                if self.emotion_pipeline:
                    try:
                        emotion_results = self.emotion_pipeline(segment_text)
                        for emotion_result in emotion_results:
                            emotions[emotion_result['label']] = emotion_result['score']
                    except:
                        pass  # Continue without emotions if model fails
                
                segment_analysis = {
                    'start_time': segment['start_time'],
                    'end_time': segment['end_time'],
                    'speaker': segment['speaker'],
                    'sentiment': sentiment_type.value,
                    'confidence': confidence,
                    'transcript_excerpt': segment_text[:500],  # Limit excerpt length
                    'emotions_json': emotions,
                    'call_id': call_id
                }
                
                sentiment_segments.append(segment_analysis)
                segment_sentiments.append(sentiment_type)
            
            # Calculate overall sentiment
            overall_sentiment = self._calculate_overall_sentiment(segment_sentiments)
            overall_confidence = np.mean([seg['confidence'] for seg in sentiment_segments])
            
            # Generate sentiment timeline for visualization
            timeline = self._generate_sentiment_timeline(sentiment_segments)
            
            # Identify sentiment shifts and key moments
            key_moments = self._identify_key_moments(sentiment_segments)
            
            result = {
                'call_id': call_id,
                'overall_sentiment': overall_sentiment.value,
                'overall_confidence': float(overall_confidence),
                'sentiment_segments': sentiment_segments,
                'sentiment_timeline': timeline,
                'key_moments': key_moments,
                'analysis_metadata': {
                    'total_segments': len(sentiment_segments),
                    'analysis_timestamp': datetime.utcnow().isoformat(),
                    'model_used': settings.SENTIMENT_MODEL
                }
            }
            
            logger.info(f"Completed sentiment analysis for call {call_id} with {len(sentiment_segments)} segments")
            return result
            
        except Exception as e:
            logger.error(f"Error analyzing sentiment: {e}")
            raise

    def _calculate_overall_sentiment(self, segment_sentiments: List[SentimentType]) -> SentimentType:
        """Calculate overall sentiment from segment sentiments"""
        if not segment_sentiments:
            return SentimentType.NEUTRAL
        
        # Count sentiment types
        sentiment_counts = {
            SentimentType.POSITIVE: 0,
            SentimentType.NEGATIVE: 0,
            SentimentType.NEUTRAL: 0
        }
        
        for sentiment in segment_sentiments:
            sentiment_counts[sentiment] += 1
        
        # Determine overall sentiment
        max_count = max(sentiment_counts.values())
        max_sentiments = [s for s, c in sentiment_counts.items() if c == max_count]
        
        if len(max_sentiments) > 1:
            return SentimentType.MIXED
        else:
            return max_sentiments[0]

    def _generate_sentiment_timeline(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Generate timeline data for visualization"""
        timeline = []
        
        for segment in segments:
            timeline_point = {
                'timestamp': segment['start_time'],
                'sentiment': segment['sentiment'],
                'confidence': segment['confidence'],
                'speaker': segment['speaker']
            }
            timeline.append(timeline_point)
        
        return timeline

    def _identify_key_moments(self, segments: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Identify key moments in the call based on sentiment shifts"""
        key_moments = []
        
        if len(segments) < 2:
            return key_moments
        
        for i in range(1, len(segments)):
            prev_segment = segments[i-1]
            curr_segment = segments[i]
            
            # Detect significant sentiment shifts
            sentiment_shift = self._calculate_sentiment_shift(
                prev_segment['sentiment'], 
                curr_segment['sentiment']
            )
            
            if sentiment_shift > 0.5:  # Significant shift threshold
                key_moment = {
                    'timestamp': curr_segment['start_time'],
                    'type': 'sentiment_shift',
                    'description': f"Sentiment changed from {prev_segment['sentiment']} to {curr_segment['sentiment']}",
                    'from_sentiment': prev_segment['sentiment'],
                    'to_sentiment': curr_segment['sentiment'],
                    'speaker': curr_segment['speaker'],
                    'excerpt': curr_segment['transcript_excerpt'][:200]
                }
                key_moments.append(key_moment)
            
            # Detect highly negative moments
            if (curr_segment['sentiment'] == 'negative' and 
                curr_segment['confidence'] > 0.8):
                key_moment = {
                    'timestamp': curr_segment['start_time'],
                    'type': 'negative_peak',
                    'description': 'High confidence negative sentiment detected',
                    'sentiment': curr_segment['sentiment'],
                    'confidence': curr_segment['confidence'],
                    'speaker': curr_segment['speaker'],
                    'excerpt': curr_segment['transcript_excerpt'][:200]
                }
                key_moments.append(key_moment)
        
        return key_moments

    def _calculate_sentiment_shift(self, from_sentiment: str, to_sentiment: str) -> float:
        """Calculate the magnitude of sentiment shift between two segments"""
        sentiment_values = {
            'positive': 1.0,
            'neutral': 0.0,
            'negative': -1.0
        }
        
        from_value = sentiment_values.get(from_sentiment, 0.0)
        to_value = sentiment_values.get(to_sentiment, 0.0)
        
        return abs(to_value - from_value)

    def _fallback_sentiment_analysis(self, text: str) -> Tuple[SentimentType, float]:
        """Fallback keyword-based sentiment analysis"""
        text_lower = text.lower()
        
        # Positive keywords
        positive_keywords = [
            'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic',
            'happy', 'pleased', 'satisfied', 'love', 'like', 'perfect',
            'helpful', 'useful', 'working', 'solved', 'fixed', 'improved'
        ]
        
        # Negative keywords
        negative_keywords = [
            'bad', 'terrible', 'awful', 'horrible', 'disappointed', 'frustrated',
            'angry', 'upset', 'problem', 'issue', 'error', 'broken', 'failed',
            'difficult', 'confusing', 'unclear', 'wrong', 'not working'
        ]
        
        # Count keywords
        positive_count = sum(1 for word in positive_keywords if word in text_lower)
        negative_count = sum(1 for word in negative_keywords if word in text_lower)
        
        # Determine sentiment
        if positive_count > negative_count:
            return SentimentType.POSITIVE, min(0.7, 0.5 + (positive_count * 0.1))
        elif negative_count > positive_count:
            return SentimentType.NEGATIVE, min(0.7, 0.5 + (negative_count * 0.1))
        else:
            return SentimentType.NEUTRAL, 0.6

    async def get_call_sentiment_summary(self, call_id: str) -> Dict[str, Any]:
        """Get a summary of sentiment analysis for a call"""
        # This would typically query the database for stored sentiment data
        # For now, return a placeholder structure
        return {
            'call_id': call_id,
            'overall_sentiment': 'positive',
            'confidence': 0.75,
            'positive_percentage': 60,
            'negative_percentage': 20,
            'neutral_percentage': 20,
            'key_insights': [
                'Call started with neutral sentiment',
                'Customer expressed satisfaction with solution',
                'Some concerns raised about implementation timeline'
            ]
        }

# Global instance
sentiment_analyzer = SentimentAnalyzer()
