import pandas as pd
import plotly.express as px
import streamlit as st


def get_theme_layout() -> dict:
    """Returns Plotly dark theme layout styling dictionary parameters."""
    return {
        "paper_bgcolor": "rgba(0,0,0,0)",
        "plot_bgcolor": "rgba(0,0,0,0)",
        "font": {"color": "#ECECF1"},
        "xaxis": {"gridcolor": "rgba(255,255,255,0.05)"},
        "yaxis": {"gridcolor": "rgba(255,255,255,0.05)"},
    }


def render_throughput_chart(df: pd.DataFrame) -> None:
    """Renders line chart showing API throughput volume timeseries."""
    if df.empty:
        st.info("No data available for throughput chart.")
        return
    fig = px.line(
        df,
        x="timestamp",
        y="requests",
        title="Telemetry Ingest Volume Trends",
        color_discrete_sequence=["#818CF8"],
    )
    fig.update_layout(**get_theme_layout())
    st.plotly_chart(fig, use_container_width=True)


def render_cost_chart(df: pd.DataFrame) -> None:
    """Renders cumulative cost area chart."""
    if df.empty:
        st.info("No data available for cost charts.")
        return
    fig = px.area(
        df,
        x="timestamp",
        y="cumulative_cost",
        title="Token Cumulative Expenditures ($)",
        color_discrete_sequence=["#A78BFA"],
    )
    fig.update_layout(**get_theme_layout())
    st.plotly_chart(fig, use_container_width=True)


def render_latency_histogram(latencies: list[float]) -> None:
    """Renders histogram mapping latency frequencies."""
    if not latencies:
        st.info("No latency tracking data available.")
        return
    fig = px.histogram(
        x=latencies,
        nbins=20,
        title="Latency Distribution Frequency",
        labels={"x": "Latency (seconds)"},
        color_discrete_sequence=["#3B82F6"],
    )
    fig.update_layout(**get_theme_layout())
    st.plotly_chart(fig, use_container_width=True)


def render_model_pie(model_shares: dict[str, int]) -> None:
    """Renders donut chart showing LLM models query volume shares."""
    if not model_shares:
        st.info("No query distribution data logged.")
        return
    df = pd.DataFrame(list(model_shares.items()), columns=["Model", "Volume"])
    fig = px.pie(
        df,
        names="Model",
        values="Volume",
        hole=0.4,
        title="Model Distribution Share",
        color_discrete_sequence=["#818CF8", "#A78BFA", "#3B82F6"],
    )
    fig.update_layout(**get_theme_layout())
    st.plotly_chart(fig, use_container_width=True)
