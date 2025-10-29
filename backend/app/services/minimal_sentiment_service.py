"""
Minimal Sentiment Service for testing without loading heavy models
"""
import asyncio
from typing import List, Dict, Any
from datetime import datetime
from loguru import logger

class MinimalSentimentAnalyzer:
    def __init__(self):
        self.sentiment_pipeline = None
        self.emotion_pipeline = None
        logger.info("Minimal Sentiment Analyzer initialized (models not loaded)")

    async def analyze_sentiment(self, transcript: str, call_id: str) -> Dict[str, Any]:
        """Mock sentiment analysis for testing"""
        
        # Simple keyword-based sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'happy', 'satisfied', 'love', 'amazing']
        negative_words = ['bad', 'terrible', 'awful', 'hate', 'frustrated', 'angry', 'disappointed']
        
        words = transcript.lower().split()
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        if positive_count > negative_count:
            overall_sentiment = 'positive'
            confidence = 0.7
        elif negative_count > positive_count:
            overall_sentiment = 'negative'
            confidence = 0.7
        else:
            overall_sentiment = 'neutral'
            confidence = 0.6
            
        # Create mock segments
        segments = transcript.split('.')
        sentiment_segments = []
        
        for i, segment in enumerate(segments[:5]):  # Limit to 5 segments
            if segment.strip():
                segment_sentiment = overall_sentiment  # Simplified
                sentiment_segments.append({
                    'start_time': i * 30,
                    'end_time': (i + 1) * 30,
                    'speaker': 'Customer' if i % 2 == 0 else 'Vendor',
                    'sentiment': segment_sentiment,
                    'confidence': confidence,
                    'transcript_excerpt': segment.strip()[:200],
                    'emotions_json': {'neutral': 0.6, 'positive': 0.3, 'negative': 0.1},
                    'call_id': call_id
                })
        
        result = {
            'call_id': call_id,
            'overall_sentiment': overall_sentiment,
            'overall_confidence': confidence,
            'sentiment_segments': sentiment_segments,
            'sentiment_timeline': [
                {
                    'timestamp': seg['start_time'],
                    'sentiment': seg['sentiment'],
                    'confidence': seg['confidence'],
                    'speaker': seg['speaker']
                } for seg in sentiment_segments
            ],
            'key_moments': [],
            'analysis_metadata': {
                'total_segments': len(sentiment_segments),
                'analysis_timestamp': datetime.utcnow().isoformat(),
                'model_used': 'mock_sentiment_model'
            }
        }
        
        logger.info(f"Mock sentiment analysis completed for call {call_id}")
        return result

# Global instance
sentiment_analyzer = MinimalSentimentAnalyzer()
