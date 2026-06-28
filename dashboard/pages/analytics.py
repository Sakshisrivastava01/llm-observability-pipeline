import pandas as pd
import streamlit as st
from components.charts import render_cost_chart, render_latency_histogram
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders the Model Analytics page depicting token metrics, cost curves, and latency trends."""
    render_navbar("Model Performance & Cost Analytics")
    api = APIService()

    kpis = api.get_kpis()
    traces = api.get_traces()

    col1, col2, col3 = st.columns(3)
    with col1:
        st.metric(
            label="Total Tokens Spent",
            value=f"{int(kpis.get('total_tokens', 0))}",
            delta="Processed",
        )
    with col2:
        st.metric(
            label="Cumulative Dollars spent",
            value=f"${kpis.get('total_cost', 0.0):.4f}",
            delta="Estimated Cost",
        )
    with col3:
        st.metric(
            label="System Average Latency",
            value=f"{kpis.get('avg_latency', 0.0):.2f}s",
            delta="Pipeline response time",
        )

    st.markdown("<br>", unsafe_allow_html=True)

    tab1, tab2 = st.tabs(["Latency Trends", "Cost Expenditures Area"])

    with tab1:
        if traces:
            latencies = []
            for t in traces:
                lat = (
                    pd.to_datetime(t["end_time"]) - pd.to_datetime(t["start_time"])
                ).total_seconds()
                latencies.append(lat)
            render_latency_histogram(latencies)
        else:
            st.info("No latency tracking metrics available yet.")

    with tab2:
        if traces:
            cost_series = []
            for t in traces:
                cost_series.append(
                    {
                        "timestamp": t["start_time"][:16],
                        # Use trace metadata or estimated sum from spans
                        "cost": float(t.get("cost", 0.001)),
                    }
                )
            df_costs = pd.DataFrame(cost_series).sort_values("timestamp")
            # Calculate cumulative sum
            df_costs["cumulative_cost"] = df_costs["cost"].cumsum()
            render_cost_chart(df_costs)
        else:
            st.info("No cost tracking metrics logged yet.")


class Analytics:
    pass
