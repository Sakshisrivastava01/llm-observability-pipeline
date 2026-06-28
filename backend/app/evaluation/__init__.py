from app.evaluation.base import BaseScorer, LLMBaseScorer, ScorerFactory, ScorerResult
from app.evaluation.faithfulness import FaithfulnessScorer
from app.evaluation.groundedness import GroundednessScorer
from app.evaluation.hallucination import HallucinationScorer
from app.evaluation.quality import QualityScorer
from app.evaluation.similarity import SemanticSimilarityScorer

# Register concrete scorers to the scorer factory
ScorerFactory.register("hallucination", HallucinationScorer)
ScorerFactory.register("groundedness", GroundednessScorer)
ScorerFactory.register("faithfulness", FaithfulnessScorer)
ScorerFactory.register("similarity", SemanticSimilarityScorer)
ScorerFactory.register("quality", QualityScorer)

__all__ = [
    "BaseScorer",
    "ScorerResult",
    "ScorerFactory",
    "LLMBaseScorer",
    "HallucinationScorer",
    "GroundednessScorer",
    "FaithfulnessScorer",
    "SemanticSimilarityScorer",
    "QualityScorer",
]
