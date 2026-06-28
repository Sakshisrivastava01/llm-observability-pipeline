import os

import streamlit as st
from components.sidebar import render_sidebar
from pages import alerts, analytics, evaluations, overview, settings, traces

# 1. Page configuration
st.set_page_config(
    layout="wide",
    page_title="Enterprise LLM Observability Platform",
    page_icon="📊",
)


def load_css() -> None:
    """Injects the custom CSS overrides sheet into the Streamlit DOM."""
    current_dir = os.path.dirname(os.path.abspath(__file__))
    css_path = os.path.join(current_dir, "assets", "styles.css")
    if os.path.exists(css_path):
        with open(css_path, encoding="utf-8") as f:
            st.markdown(
                f"<style>{f.read()}</style>",
                unsafe_allow_html=True,
            )


# Load style tokens
load_css()

render_sidebar()

current_page = st.session_state.get("current_page", "Overview")

# Stateful page routing map
if current_page == "Overview":
    overview.render()
elif current_page == "Trace Explorer":
    traces.render()
elif current_page == "Analytics":
    analytics.render()
elif current_page == "Evaluation Center":
    evaluations.render()
elif current_page == "Alert Center":
    alerts.render()
elif current_page == "Model Comparison":
    from pages import model_comparison

    model_comparison.render()
elif current_page == "Settings":
    settings.render()
