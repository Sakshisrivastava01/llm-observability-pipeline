import json
import os
from abc import ABC, abstractmethod
from typing import Any

from app.providers import ProviderFactory
from pydantic import BaseModel


class ScorerResult(BaseModel):
    """Unified schema representing scoring outcomes, numeric scores [0.0 - 1.0], and feedback logs."""

    score: float
    feedback: str | None = None
    metadata: dict[str, Any] = {}


class BaseScorer(ABC):
    """Abstract interface all evaluation scorer modules must implement."""

    @abstractmethod
    async def score(
        self,
        output: str,
        context: str | None = None,
        reference: str | None = None,
        **kwargs: Any,
    ) -> ScorerResult:
        """Computes evaluation score of generated output against reference assertions."""
        pass


class LLMBaseScorer(BaseScorer):
    """Helper base class for scorers utilizing LLM-in-the-loop evaluation."""

    def _read_prompt_template(self, name: str) -> str:
        """Helper to read external prompt templates from evaluation/prompts/ directory."""
        current_dir = os.path.dirname(os.path.abspath(__file__))
        path = os.path.join(current_dir, "prompts", f"{name}.txt")
        with open(path, encoding="utf-8") as f:
            return f.read()

    async def _evaluate_llm(self, prompt: str) -> dict[str, Any]:
        """Resolves the OpenAI provider wrapper to evaluate a custom formatted scoring prompt."""
        provider = ProviderFactory.get("openai")
        try:
            resp = await provider.generate(
                model="gpt-3.5-turbo", prompt=prompt, temperature=0.0
            )
            text = resp.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()

            data = json.loads(text)
            return {
                "score": float(data.get("score", 1.0)),
                "reason": data.get("reason", "Evaluation completed successfully."),
            }
        except Exception as e:
            return {
                "score": 0.5,
                "reason": f"Evaluator parser fallback exception: {str(e)}",
            }


class ScorerFactory:
    """Extensible factory registry managing concrete evaluator scorers."""

    _scorers: dict[str, type[BaseScorer]] = {}

    @classmethod
    def register(cls, name: str, scorer_class: type[BaseScorer]) -> None:
        """Registers a scorer type under a unique key."""
        cls._scorers[name.lower().strip()] = scorer_class

    @classmethod
    def get(cls, name: str) -> BaseScorer:
        """Resolves and instantiates an evaluator scorer."""
        scorer_class = cls._scorers.get(name.lower().strip())
        if not scorer_class:
            raise ValueError(f"Unsupported evaluation scorer: {name}")
        return scorer_class()
