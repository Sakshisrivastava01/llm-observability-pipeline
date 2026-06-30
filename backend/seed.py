import asyncio
from datetime import datetime, timedelta, timezone

from app.core.auth import hash_password
from app.db.session import async_session_factory
from app.models.alert import Alert
from app.models.evaluation import Evaluation
from app.models.pricing import ModelPricing
from app.models.span import Span
from app.models.trace import Trace
from app.models.user import User
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

        # Seed default user
        admin_user = User(
            email="admin@company.com",
            hashed_password=hash_password("password"),
            name="Admin User",
        )
        db.add(admin_user)
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
                model_name="gpt-3.5-turbo",
                input_token_price_per_1k=0.0015,
                output_token_price_per_1k=0.002,
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

        # 2. Seed Traces & Spans
        now = datetime.now(timezone.utc)
        trace_data = [
            (
                "tr-1",
                "chat_completion_pipeline",
                "gpt-4o",
                "What is quantum entanglement?",
                "Quantum entanglement is a physical phenomenon where pairs of particles...",
                250,
                380,
                0.00695,
                2.4,
            ),
            (
                "tr-2",
                "chat_completion_pipeline",
                "gpt-3.5-turbo",
                "Tell me a programming joke.",
                "Why do programmers wear glasses? Because they can't C#!",
                120,
                45,
                0.00027,
                0.8,
            ),
            (
                "tr-3",
                "rag_retrieval_flow",
                "gpt-4o",
                "Summarize our financial performance.",
                "In Q3, total revenues increased by 14% to $12.4M...",
                850,
                920,
                0.01805,
                6.2,  # Latency alert trigger (>5.0s)
            ),
            (
                "tr-4",
                "agent_planner_cycle",
                "llama3",
                "Plan a 3-day trip to Paris.",
                "Day 1: Louvre Museum. Day 2: Eiffel Tower. Day 3: Palace of Versailles.",
                450,
                820,
                0.0,
                4.1,
            ),
        ]

        for (
            t_id,
            t_name,
            model,
            prompt,
            resp_txt,
            p_tok,
            c_tok,
            cost,
            latency,
        ) in trace_data:
            start_time = now - timedelta(minutes=int(t_id.split("-")[1]) * 15)
            end_time = start_time + timedelta(seconds=latency)

            # Insert Trace
            trace = Trace(
                trace_id=t_id,
                name=t_name,
                start_time=start_time,
                end_time=end_time,
                input_data={"prompt": prompt},
                output_data={"response": resp_txt},
                custom_metadata={"environment": "production"},
            )
            db.add(trace)
            await db.flush()

            # Insert LLM Completion Span
            span_id = f"sp-{t_id.split('-')[1]}"
            span = Span(
                span_id=span_id,
                trace_id=t_id,
                name="completion_step",
                span_type="llm",
                start_time=start_time,
                end_time=end_time,
                input_data={"prompt": prompt},
                output_data={"response": resp_txt},
                model_name=model,
                prompt_tokens=p_tok,
                completion_tokens=c_tok,
                total_tokens=p_tok + c_tok,
                cost=cost,
                custom_metadata={},
            )
            db.add(span)
            await db.flush()

            # 3. Seed Evaluations linked to trace
            evals = [
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="hallucination",
                    metric_value=0.95 if t_id != "tr-3" else 0.42,  # Low score on tr-3
                    status="success",
                    feedback="Claim verification passed."
                    if t_id != "tr-3"
                    else "Detected hallucinated claims.",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="groundedness",
                    metric_value=0.98 if t_id != "tr-3" else 0.51,
                    status="success",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="faithfulness",
                    metric_value=0.92,
                    status="success",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="similarity",
                    metric_value=0.88,
                    status="success",
                ),
                Evaluation(
                    trace_id=t_id,
                    span_id=span_id,
                    metric_name="quality",
                    metric_value=0.93 if t_id != "tr-3" else 0.58,
                    status="success",
                ),
            ]
            db.add_all(evals)

            # 4. Trigger Alerts based on threshold metrics
            if latency > 5.0:
                alert = Alert(
                    metric_name="latency_seconds",
                    threshold_value=5.0,
                    actual_value=latency,
                    severity="warning",
                    status="active",
                    description=(
                        f"Trace '{t_name}' latency reached {latency}s, "
                        f"exceeding rules boundary."
                    ),
                )
                db.add(alert)

        await db.commit()
        print("Database seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_data())
