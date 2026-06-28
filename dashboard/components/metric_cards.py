import streamlit as st


def render_metric_card(title: str, value: str, subtext: str = "") -> None:
    """Renders a custom glassmorphism style card for dashboard KPI values."""
    st.markdown(
        f"""
        <div class="glass-card">
            <h3>{title}</h3>
            <div class="metric-val">{value}</div>
            <p style="margin: 5px 0 0 0; font-size: 0.8rem; color: #9CA3AF;">{subtext}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )
