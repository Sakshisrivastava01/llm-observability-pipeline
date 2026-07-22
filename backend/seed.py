import asyncio
import random
from datetime import datetime, timedelta, timezone

from app.core.password import hash_password
from app.db.models.user import User
from app.db.session import async_session_factory
from app.models.alert import Alert
from app.models.evaluation import Evaluation
from app.models.pricing import ModelPricing
from app.models.span import Span
from app.models.trace import Trace
from sqlalchemy import delete


async def seed_data() -> None:
    """Seeds synthetic, production-grade traces, evaluations, prices, and alerts."""
    print("Starting database seeding...")
    async with async_session_factory() as db:
        # Clear existing data
        await db.execute(delete(Alert))
        await db.execute(delete(Evaluation))
        await db.execute(delete(Span))
        await db.execute(delete(Trace))
        await db.execute(delete(ModelPricing))
        await db.execute(delete(User))
        await db.commit()

        # 1. Seed Model Pricing Profiles
        prices = [
            ModelPricing(
                provider="openai",
                model_name="gpt-4o",
                input_token_price_per_1k=0.005,
                output_token_price_per_1k=0.015,
                active=True,
            ),
            ModelPricing(
                provider="openai",
                model_name="gpt-4o-mini",
                input_token_price_per_1k=0.00015,
                output_token_price_per_1k=0.0006,
                active=True,
            ),
            ModelPricing(
                provider="ollama",
                model_name="mistral",
                input_token_price_per_1k=0.0,
                output_token_price_per_1k=0.0,
                active=True,
            ),
            ModelPricing(
                provider="ollama",
                model_name="llama3",
                input_token_price_per_1k=0.0,
                output_token_price_per_1k=0.0,
                active=True,
            ),
        ]
        db.add_all(prices)
        await db.commit()
        print("Pricing seeded.")

        # 2. Seed Default User
        default_user = User(
            email="sakshisrivastava200306@gmail.com",
            name="Sakshi Srivastava",
            hashed_password=hash_password("Sakshi@2024"),
            is_active=True,
        )
        db.add(default_user)
        await db.commit()
        print("Default user seeded.")

        # 3. Seed Traces & Spans
        now = datetime.now(timezone.utc)
        models_list = ["gpt-4o", "gpt-4o-mini", "mistral", "llama3"]
        trace_names = [
            "chat_completion_pipeline",
            "rag_retrieval_flow",
            "agent_planner_cycle",
        ]
        severities = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

        print("Generating 220 traces, spans, evaluations, and alerts...")
        traces_to_add = []
        spans_to_add = []
        evals_to_add = []
        alerts_to_add = []

        for i in range(1, 221):
            t_id = f"tr-{i}"
            model = models_list[i % len(models_list)]
            latency = round(random.uniform(0.1, 6.5), 2)
            p_tok = random.randint(100, 1000)
            c_tok = random.randint(50, 800)

            # calculate pricing
            cost = 0.0
            if model == "gpt-4o":
                cost = (p_tok * 0.005 / 1000.0) + (c_tok * 0.015 / 1000.0)
            elif model == "gpt-4o-mini":
                cost = (p_tok * 0.00015 / 1000.0) + (c_tok * 0.0006 / 1000.0)

            start_time = now - timedelta(hours=i * 0.7)
            end_time = start_time + timedelta(seconds=latency)

            # Insert Trace
            trace = Trace(
                trace_id=t_id,
                name=trace_names[i % len(trace_names)],
                start_time=start_time,
                end_time=end_time,
                input_data={
                    "prompt": f"Tell me about model performance metrics for attempt {i}."
                },
                output_data={
                    "response": f"Performance metrics show latency of {latency}s and cost of ${cost:.6f} USD."
                },
                custom_metadata={"environment": "production"},
            )
            traces_to_add.append(trace)

            # Insert Span
            span_id = f"sp-{i}"
            span = Span(
                span_id=span_id,
                trace_id=t_id,
                name="completion_step",
                span_type="llm",
                start_time=start_time,
                end_time=end_time,
                input_data={
                    "prompt": f"Tell me about model performance metrics for attempt {i}."
                },
                output_data={
                    "response": f"Performance metrics show latency of {latency}s and cost of ${cost:.6f} USD."
                },
                model_name=model,
                prompt_tokens=p_tok,
                completion_tokens=c_tok,
                total_tokens=p_tok + c_tok,
                cost=cost,
                custom_metadata={},
            )
            spans_to_add.append(span)

            # Insert Evaluations linked to trace
            evals = [
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="hallucination",
                    metric_value=round(random.uniform(0.0, 5.0), 2),
                    status="success",
                    feedback="Detected hallucinated claims."
                    if random.choice([True, False])
                    else "Claim verification passed.",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="groundedness",
                    metric_value=round(random.uniform(0.0, 5.0), 2),
                    status="success",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="faithfulness",
                    metric_value=round(random.uniform(0.0, 5.0), 2),
                    status="success",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="similarity",
                    metric_value=round(random.uniform(0.0, 5.0), 2),
                    status="success",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="quality",
                    metric_value=round(random.uniform(0.0, 5.0), 2),
                    status="success",
                ),
            ]
            evals_to_add.extend(evals)

            # Seed 220 active alerts
            alert = Alert(
                metric_name="latency_seconds" if i % 2 == 0 else "hallucination_score",
                threshold_value=5.0 if i % 2 == 0 else 3.5,
                actual_value=latency
                if i % 2 == 0
                else round(random.uniform(3.6, 5.0), 2),
                severity=severities[i % len(severities)],
                status="active",
                description=f"Performance regression detected for model {model}. Actual value exceeded threshold.",
                timestamp=start_time,
            )
            alerts_to_add.append(alert)

        db.add_all(traces_to_add)
        db.add_all(spans_to_add)
        await db.flush()

        db.add_all(evals_to_add)
        db.add_all(alerts_to_add)

        await db.commit()
        print("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_data())
