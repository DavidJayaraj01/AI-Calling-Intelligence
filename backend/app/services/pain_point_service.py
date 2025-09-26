"""
Pain Point Extraction Service using RoBERTa model
"""
import asyncio
from typing import List, Dict, Any, Tuple
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
import torch
import numpy as np
from sentence_transformers import SentenceTransformer
import re
from loguru import logger
from app.core.config import settings
from app.models import PainPointCategory, SeverityLevel

class PainPointExtractor:
    def __init__(self):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.model = None
        self.tokenizer = None
        self.embedding_model = None
        self._load_models()

    def _load_models(self):
        """Load local RoBERTa and sentence transformer models"""
        try:
            # Load local RoBERTa model for emotion/pain point detection
            self.model = AutoModelForSequenceClassification.from_pretrained(
                settings.ROBERTA_MODEL,
                local_files_only=True
            )
            self.tokenizer = AutoTokenizer.from_pretrained(
                settings.ROBERTA_MODEL,
                local_files_only=True
            )
            
            # Load sentence transformer for embeddings
            self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=self.device)
            
            logger.info("Pain point extraction models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading pain point models: {e}")
            # Set to None for fallback behavior
            self.model = None
            self.tokenizer = None
            self.embedding_model = None

    def _preprocess_text(self, text: str) -> List[str]:
        """Split transcript into sentences for analysis"""
        # Split by sentences and clean
        sentences = re.split(r'[.!?]+', text)
        sentences = [s.strip() for s in sentences if s.strip() and len(s.strip()) > 10]
        return sentences

    def _classify_pain_point_category(self, text: str) -> PainPointCategory:
        """Classify pain point into categories using keyword matching and context"""
        text_lower = text.lower()
        
        # Technical keywords
        technical_keywords = ['bug', 'error', 'crash', 'slow', 'performance', 'integration', 'api', 'system']
        if any(keyword in text_lower for keyword in technical_keywords):
            return PainPointCategory.TECHNICAL
        
        # Pricing keywords
        pricing_keywords = ['price', 'cost', 'expensive', 'billing', 'payment', 'budget']
        if any(keyword in text_lower for keyword in pricing_keywords):
            return PainPointCategory.PRICING
        
        # Product keywords
        product_keywords = ['feature', 'functionality', 'usability', 'interface', 'design']
        if any(keyword in text_lower for keyword in product_keywords):
            return PainPointCategory.PRODUCT
        
        # Service keywords
        service_keywords = ['support', 'help', 'assistance', 'response', 'service']
        if any(keyword in text_lower for keyword in service_keywords):
            return PainPointCategory.SERVICE
        
        # Delivery keywords
        delivery_keywords = ['delivery', 'shipping', 'timeline', 'delay', 'schedule']
        if any(keyword in text_lower for keyword in delivery_keywords):
            return PainPointCategory.DELIVERY
        
        # Communication keywords
        communication_keywords = ['communication', 'unclear', 'confusing', 'explain']
        if any(keyword in text_lower for keyword in communication_keywords):
            return PainPointCategory.COMMUNICATION
        
        return PainPointCategory.OTHER

    def _determine_severity(self, text: str, emotion_scores: Dict[str, float]) -> SeverityLevel:
        """Determine severity based on emotion scores and keywords"""
        text_lower = text.lower()
        
        # Critical keywords
        critical_keywords = ['critical', 'urgent', 'emergency', 'down', 'broken', 'failed']
        if any(keyword in text_lower for keyword in critical_keywords):
            return SeverityLevel.CRITICAL
        
        # High severity keywords
        high_keywords = ['major', 'serious', 'important', 'significant', 'problem']
        if any(keyword in text_lower for keyword in high_keywords):
            return SeverityLevel.HIGH
        
        # Check emotion scores
        negative_emotions = ['anger', 'fear', 'sadness']
        total_negative = sum(emotion_scores.get(emotion, 0) for emotion in negative_emotions)
        
        if total_negative > 0.7:
            return SeverityLevel.HIGH
        elif total_negative > 0.4:
            return SeverityLevel.MEDIUM
        else:
            return SeverityLevel.LOW

    def _fallback_pain_point_extraction(self, sentences: List[str], call_id: str) -> List[Dict[str, Any]]:
        """Fallback pain point extraction using keyword-based approach"""
        pain_points = []
        
        pain_keywords = [
            'problem', 'issue', 'difficulty', 'trouble', 'concern', 'complaint',
            'frustrated', 'disappointed', 'unhappy', 'struggling', 'challenge',
            'error', 'bug', 'failure', 'broken', 'not working', 'can\'t', 'cannot'
        ]
        
        for i, sentence in enumerate(sentences):
            sentence_lower = sentence.lower()
            found_keywords = [kw for kw in pain_keywords if kw in sentence_lower]
            
            if found_keywords:
                pain_point = {
                    "text": sentence,
                    "category": PainPointCategory.TECHNICAL.value,  # Default category
                    "severity": SeverityLevel.MEDIUM.value,  # Default severity
                    "confidence": 0.6,  # Lower confidence for fallback
                    "keywords": found_keywords,
                    "position": i,
                    "embedding": None,
                    "call_id": call_id
                }
                pain_points.append(pain_point)
        
        return pain_points

    async def extract_pain_points(self, transcript: str, call_id: str) -> List[Dict[str, Any]]:
        """
        Extract pain points from call transcript
        
        Args:
            transcript: Call transcript text
            call_id: ID of the call
            
        Returns:
            List of pain points with metadata
        """
        try:
            sentences = self._preprocess_text(transcript)
            pain_points = []
            
            # If models are not loaded, use fallback analysis
            if self.model is None or self.tokenizer is None:
                return self._fallback_pain_point_extraction(sentences, call_id)
            
            # Analyze each sentence for pain points
            for i, sentence in enumerate(sentences):
                # Use RoBERTa for emotion analysis
                inputs = self.tokenizer(sentence, return_tensors="pt", truncation=True, padding=True)
                
                with torch.no_grad():
                    outputs = self.model(**inputs)
                    probabilities = torch.nn.functional.softmax(outputs.logits, dim=-1)
                    emotion_scores = probabilities[0].cpu().numpy()
                
                # Convert to emotion dictionary (simplified mapping)
                emotion_labels = ['anger', 'fear', 'joy', 'love', 'sadness', 'surprise']
                emotion_dict = {label: float(score) for label, score in zip(emotion_labels, emotion_scores)}
                
                # Identify potential pain points based on negative emotions and keywords
                pain_keywords = [
                    'problem', 'issue', 'difficulty', 'trouble', 'concern', 'complaint',
                    'frustrated', 'disappointed', 'unhappy', 'struggling', 'challenge',
                    'error', 'bug', 'failure', 'broken', 'not working'
                ]
                
                has_pain_keywords = any(keyword in sentence.lower() for keyword in pain_keywords)
                has_negative_emotion = (emotion_dict.get('anger', 0) > 0.3 or 
                                      emotion_dict.get('sadness', 0) > 0.3 or
                                      emotion_dict.get('fear', 0) > 0.3)
                
                if has_pain_keywords or has_negative_emotion:
                    # Generate embedding for the pain point
                    if self.embedding_model:
                        embedding = self.embedding_model.encode(sentence)
                    else:
                        embedding = None
                    
                    # Classify category and severity
                    category = self._classify_pain_point_category(sentence)
                    severity = self._determine_severity(sentence, emotion_dict)
                    
                    # Calculate confidence score
                    confidence = max(emotion_dict.get('anger', 0), 
                                   emotion_dict.get('sadness', 0), 
                                   emotion_dict.get('fear', 0))
                    if has_pain_keywords:
                        confidence = min(confidence + 0.3, 1.0)
                    
                    pain_point = {
                        "description": sentence.strip(),
                        "category": category,
                        "severity": severity,
                        "confidence": float(confidence),
                        "vector_embedding": embedding.tolist(),
                        "start_time": i * 10,  # Approximate timing (10 seconds per sentence)
                        "end_time": (i + 1) * 10,
                        "emotion_scores": emotion_dict,
                        "call_id": call_id
                    }
                    
                    pain_points.append(pain_point)
            
            logger.info(f"Extracted {len(pain_points)} pain points from call {call_id}")
            return pain_points
            
        except Exception as e:
            logger.error(f"Error extracting pain points: {e}")
            raise

    async def get_pain_point_embedding(self, text: str) -> List[float]:
        """Generate embedding for a pain point text"""
        try:
            embedding = self.embedding_model.encode(text)
            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {e}")
            raise

# Global instance
pain_point_extractor = PainPointExtractor()
