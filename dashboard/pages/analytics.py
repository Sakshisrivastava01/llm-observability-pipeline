import pandas as pd
import plotly.express as px
import streamlit as st
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders the Analytics Console featuring percentiles, anomalies, forecasting predictions, and throughput summaries."""
    render_navbar("Model Performance & Cost Analytics")
    api = APIService()

    # Load advanced analytics metrics
    advanced = api.get_advanced_analytics()
    percentiles = advanced.get(
        "percentiles", {"P50": 0.0, "P90": 0.0, "P95": 0.0, "P99": 0.0}
    )
    anomalies = advanced.get("anomalies", [])
    predictions = advanced.get(
        "predictions",
        {
            "predicted_latency": 0.0,
            "predicted_cost": 0.0,
            "predicted_success_rate": 100.0,
        },
    )

    # 1. Percentiles & Predictions KPIs
    st.markdown("### Platform Performance Percentiles")
    col1, col2, col3, col4 = st.columns(4)
    with col1:
        st.metric("P50 Latency", f"{percentiles.get('P50', 0.0):.3f}s")
    with col2:
        st.metric("P90 Latency", f"{percentiles.get('P90', 0.0):.3f}s")
    with col3:
        st.metric("P95 Latency", f"{percentiles.get('P95', 0.0):.3f}s")
    with col4:
        st.metric("P99 Latency", f"{percentiles.get('P99', 0.0):.3f}s")

    st.markdown("---")

    # Analytics forecasting predictions
    st.markdown("### Next Cycle Predictive Forecasting Summaries")
    col_p1, col_p2, col_p3 = st.columns(3)
    with col_p1:
        st.metric(
            "Forecasted Mean Latency",
            f"{predictions.get('predicted_latency', 0.0):.3f}s",
        )
    with col_p2:
        st.metric(
            "Forecasted Token Cost", f"${predictions.get('predicted_cost', 0.0):.6f}"
        )
    with col_p3:
        st.metric(
            "Forecasted Success Rate",
            f"{predictions.get('predicted_success_rate', 100.0):.1f}%",
        )

    st.markdown("---")

    # 2. Time based Throughput Summaries
    st.markdown("### System Throughput & Rolling Averages")
    interval = st.selectbox(
        "Aggregation Interval:", ["hourly", "daily", "weekly", "monthly"]
    )
    summaries = api.get_analytics_summaries(interval=interval)
    throughput = summaries.get("throughput_trends", [])
    rolling_avgs = summaries.get("rolling_averages", [])

    tab1, tab2 = st.tabs(["Throughput Volumes", "Latency Rolling Averages"])

    with tab1:
        if throughput:
            df_tp = pd.DataFrame(throughput)
            fig_tp = px.area(
                df_tp,
                x="timestamp",
                y="requests",
                title=f"Throughput Volume ({interval.capitalize()})",
                labels={"timestamp": "Timeline", "requests": "Requests Ingested"},
                color_discrete_sequence=["#818CF8"],
            )
            fig_tp.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font={"color": "#ECECF1"},
            )
            st.plotly_chart(fig_tp, use_container_width=True)
        else:
            st.info("No throughput records logged yet.")

    with tab2:
        if rolling_avgs:
            df_ra = pd.DataFrame(rolling_avgs)
            fig_ra = px.line(
                df_ra,
                x="timestamp",
                y=["latency", "rolling_avg"],
                title="Latency & Rolling Averages (Window: 5)",
                labels={"timestamp": "Timeline", "value": "Latency (s)"},
                color_discrete_map={
                    "latency": "rgba(79, 70, 229, 0.4)",
                    "rolling_avg": "#3B82F6",
                },
            )
            fig_ra.update_layout(
                paper_bgcolor="rgba(0,0,0,0)",
                plot_bgcolor="rgba(0,0,0,0)",
                font={"color": "#ECECF1"},
            )
            st.plotly_chart(fig_ra, use_container_width=True)
        else:
            st.info("No rolling latency averages statistics compiled yet.")

    st.markdown("---")

    # 3. Anomalies Outlier Detection
    st.markdown("### Anomaly & Outlier Diagnostics Audit")
    if anomalies:
        st.warning(
            f"⚠️ OUTLIERS DETECTED: {len(anomalies)} transaction traces exceeded mean duration limit by more than 2x standard deviation."
        )
        df_an = pd.DataFrame(anomalies)
        display_df = df_an[["trace_id", "name", "latency", "mean", "timestamp"]].copy()
        display_df.columns = [
            "Trace ID",
            "Pipeline Name",
            "Observed Latency (s)",
            "System Mean Baseline (s)",
            "Ingestion Date",
        ]
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    else:
        st.success("All transaction traces conform to system baseline averages.")
