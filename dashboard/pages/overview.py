import pandas as pd
import streamlit as st
from components.charts import render_model_pie, render_throughput_chart
from components.metric_cards import render_metric_card
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders the overview page containing system metrics, live charts, and KPI summary blocks."""
    render_navbar("System Overview Console")
    api = APIService()

    # Load metrics from the backend API
    kpis = api.get_kpis()
    model_shares = api.get_model_shares()
    traces = api.get_traces()

    # KPI metric cards grid
    col1, col2, col3, col4, col6 = st.columns(5)
    with col1:
        render_metric_card(
            "Requests Ingested",
            f"{int(kpis.get('total_requests', 0))}",
            "Aggregate trace signals",
        )
    with col2:
        render_metric_card(
            "Avg Latency",
            f"{kpis.get('avg_latency', 0.0):.2f}s",
            "Mean roundtrip duration",
        )
    with col3:
        render_metric_card(
            "Cumulative Cost",
            f"${kpis.get('total_cost', 0.0):.4f}",
            "Estimated USD pricing",
        )
    with col4:
        render_metric_card(
            "Total Tokens",
            f"{int(kpis.get('total_tokens', 0))}",
            "Completions token budget",
        )
    with col6:
        render_metric_card(
            "Success Rate",
            f"{kpis.get('success_rate', 100.0):.1f}%",
            "Zero error terminations",
        )

    st.markdown("<br>", unsafe_allow_html=True)

    # Charts layer
    chart_col1, chart_col2 = st.columns(2)
    with chart_col1:
        if traces:
            ts_data = []
            for t in traces:
                ts_data.append({"timestamp": t["start_time"][:16], "requests": 1})
            df = pd.DataFrame(ts_data).groupby("timestamp").sum().reset_index()
            render_throughput_chart(df)
        else:
            render_throughput_chart(pd.DataFrame())

    with chart_col2:
        render_model_pie(model_shares)

    # Recent activity logs
    st.markdown("### Recent Logged Telemetry Signals")
    if traces:
        df_traces = pd.DataFrame(traces)[
            ["trace_id", "name", "start_time", "spans_count"]
        ].copy()
        df_traces.columns = ["Trace ID", "Pipeline Name", "Timestamp", "Spans Count"]
        st.dataframe(df_traces.head(10), use_container_width=True, hide_index=True)
    else:
        st.info("No traces currently logged. Run inferences in Settings to seed data.")


class Overview:
    pass
