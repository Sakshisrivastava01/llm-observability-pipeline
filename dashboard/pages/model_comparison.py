import pandas as pd
import plotly.express as px
import streamlit as st
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders Model Comparison dashboard comparing OpenAI vs Ollama metrics."""
    render_navbar("Model Comparison Console")
    api = APIService()

    comp_data = api.get_provider_comparison()

    if not comp_data:
        st.info("No comparative token stats logged yet.")
        return

    st.markdown("### comparative Provider Performance stats")

    # Display side by side indicators
    providers = list(comp_data.keys())

    for prov in providers:
        data = comp_data[prov]
        with st.expander(f"Provider metrics: {prov.upper()}", expanded=True):
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Avg Latency", f"{data['avg_latency']:.3f}s")
            with col2:
                st.metric("Avg Token Cost", f"${data['avg_cost']:.6f}")
            with col3:
                st.metric("Avg Tokens", f"{int(data['avg_tokens'])}")
            with col4:
                st.metric("Failure Rate", f"{data['failure_rate']:.1f}%")

    # Prepare DataFrame for comparisons charts
    chart_rows = []
    for prov, data in comp_data.items():
        chart_rows.append(
            {
                "Provider": prov.upper(),
                "Avg Latency (s)": data["avg_latency"],
                "Avg Cost ($)": data["avg_cost"],
                "Failure Rate (%)": data["failure_rate"],
            }
        )

    df_comp = pd.DataFrame(chart_rows)

    chart_col1, chart_col2 = st.columns(2)

    with chart_col1:
        fig_lat = px.bar(
            df_comp,
            x="Provider",
            y="Avg Latency (s)",
            title="Latency Comparison (s)",
            color="Provider",
            color_discrete_sequence=["#818CF8", "#3B82F6"],
        )
        fig_lat.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font={"color": "#ECECF1"},
        )
        st.plotly_chart(fig_lat, use_container_width=True)

    with chart_col2:
        fig_fail = px.bar(
            df_comp,
            x="Provider",
            y="Failure Rate (%)",
            title="Failure Rate Comparison (%)",
            color="Provider",
            color_discrete_sequence=["#EF4444", "#F87171"],
        )
        fig_fail.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font={"color": "#ECECF1"},
        )
        st.plotly_chart(fig_fail, use_container_width=True)
