"""
Solution Matching Service using vector similarity search
"""
import asyncio
from typing import List, Dict, Any, Optional, Tuple
from sentence_transformers import SentenceTransformer
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
import json
from datetime import datetime
from loguru import logger
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.config import settings
from app.models import SolutionCategory, ImplementationDifficulty, SolutionResource, ProblemSolutionMapping

class SolutionMatcher:
    def __init__(self):
        self.embedding_model = None
        self.solution_database = []
        self._load_model()

    def _load_model(self):
        """Load local sentence transformer model for embeddings"""
        try:
            self.embedding_model = SentenceTransformer(settings.VECTOR_MODEL)
            logger.info(f"Solution matching model loaded successfully from: {settings.VECTOR_MODEL}")
        except Exception as e:
            logger.error(f"Error loading solution matching model: {e}")
            logger.error(f"Vector model path: {settings.VECTOR_MODEL}")
            self.embedding_model = None
        
    async def find_matching_solutions(
        self, 
        pain_point: Dict[str, Any], 
        db: Session,
        top_k: int = 3
    ) -> List[Dict[str, Any]]:
        """
        Find matching solutions for a pain point using vector similarity search
        
        Args:
            pain_point: Pain point dictionary with embedding
            db: Database session
            top_k: Number of top matches to return
            
        Returns:
            List of matching solutions with scores
        """
        try:
            pain_point_embedding = pain_point.get('vector_embedding')
            if not pain_point_embedding:
                logger.warning("Pain point has no embedding, generating one")
                pain_point_embedding = self.embedding_model.encode(
                    pain_point['description']
                ).tolist()
            
            # Convert embedding to PostgreSQL vector format
            embedding_str = '[' + ','.join(map(str, pain_point_embedding)) + ']'
            
            # Query for similar solutions using cosine similarity
            query = text("""
                SELECT 
                    id,
                    title,
                    description,
                    resource_type,
                    uri,
                    content,
                    tags,
                    1 - (vector_embedding <=> :embedding) as similarity_score
                FROM solution_resources 
                WHERE is_active = true
                ORDER BY vector_embedding <=> :embedding
                LIMIT :limit
            """)
            
            result = db.execute(query, {
                'embedding': embedding_str,
                'limit': top_k
            })
            
            matches = []
            for row in result:
                match = {
                    'resource_id': str(row.id),
                    'title': row.title,
                    'description': row.description,
                    'resource_type': row.resource_type,
                    'uri': row.uri,
                    'content': row.content,
                    'tags': row.tags,
                    'similarity_score': float(row.similarity_score)
                }
                matches.append(match)
            
            # Enhance matches using local keyword and category matching
            if matches:
                enhanced_matches = self._enhance_matches_locally(pain_point, matches)
                return enhanced_matches
            
            return matches
            
        except Exception as e:
            logger.error(f"Error finding matching solutions: {e}")
            raise

    def _enhance_matches_locally(
        self, 
        pain_point: Dict[str, Any], 
        initial_matches: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Enhance solution matches using local keyword and category matching
        """
        try:
            pain_category = pain_point.get('category', '').lower()
            pain_description = pain_point.get('description', '').lower()
            pain_severity = pain_point.get('severity', '').lower()
            
            # Define category relevance weights
            category_weights = {
                'technical': 1.2,
                'product': 1.1,
                'pricing': 1.0,
                'service': 1.1,
                'delivery': 1.0,
                'communication': 1.0
            }
            
            # Define severity weights
            severity_weights = {
                'critical': 1.3,
                'high': 1.2,
                'medium': 1.1,
                'low': 1.0
            }
            
            # Enhance each match
            for match in initial_matches:
                # Get base similarity score
                base_score = match['similarity_score']
                
                # Apply category relevance
                category_weight = category_weights.get(pain_category, 1.0)
                
                # Apply severity weight
                severity_weight = severity_weights.get(pain_severity, 1.0)
                
                # Calculate enhanced score
                enhanced_score = base_score * category_weight * severity_weight
                
                # Add local enhancement metadata
                match['enhanced_score'] = min(enhanced_score, 1.0)  # Cap at 1.0
                match['category_relevance'] = category_weight
                match['severity_boost'] = severity_weight
                match['enhancement_method'] = 'local_keyword_matching'
            
            # Sort by enhanced score
            enhanced_matches = sorted(initial_matches, key=lambda x: x.get('enhanced_score', x['similarity_score']), reverse=True)
            return enhanced_matches
                
        except Exception as e:
            logger.error(f"Error enhancing matches locally: {e}")
            return initial_matches

    async def create_solution_mappings(
        self,
        call_id: str,
        pain_point_id: str,
        solutions: List[Dict[str, Any]],
        db: Session
    ) -> List[str]:
        """
        Create problem-solution mappings in the database
        
        Returns:
            List of created mapping IDs
        """
        try:
            mapping_ids = []
            
            for solution in solutions:
                mapping = ProblemSolutionMapping(
                    call_id=call_id,
                    pain_point_id=pain_point_id,
                    solution_resource_id=solution['resource_id'],
                    matching_score=solution.get('final_matching_score', solution.get('similarity_score', 0))
                )
                
                db.add(mapping)
                db.flush()  # Get the ID
                mapping_ids.append(str(mapping.id))
            
            db.commit()
            logger.info(f"Created {len(mapping_ids)} solution mappings")
            return mapping_ids
            
        except Exception as e:
            logger.error(f"Error creating solution mappings: {e}")
            db.rollback()
            raise

    async def add_solution_resource(
        self,
        title: str,
        description: str,
        resource_type: str,
        content: str,
        uri: Optional[str] = None,
        tags: Optional[List[str]] = None,
        created_by: str = None,
        db: Session = None
    ) -> str:
        """
        Add a new solution resource to the database
        
        Returns:
            ID of the created resource
        """
        try:
            # Generate embedding for the content
            full_text = f"{title} {description} {content}"
            embedding = self.embedding_model.encode(full_text)
            
            resource = SolutionResource(
                title=title,
                description=description,
                resource_type=resource_type,
                uri=uri,
                content=content,
                vector_embedding=embedding.tolist(),
                tags=tags or [],
                created_by=created_by,
                is_active=True
            )
            
            db.add(resource)
            db.commit()
            db.refresh(resource)
            
            logger.info(f"Added new solution resource: {title}")
            return str(resource.id)
            
        except Exception as e:
            logger.error(f"Error adding solution resource: {e}")
            db.rollback()
            raise

# Global instance
solution_matcher = SolutionMatcher()
