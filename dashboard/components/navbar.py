import streamlit as st
from services.api import APIService


def render_navbar(page_title: str) -> None:
    """Renders the top navbar showing connection health status checks."""
    api = APIService()
    health = api.get_health()
    status = health.get("status", "offline")

    col1, col2 = st.columns([5, 1])
    with col1:
        st.markdown(
            f"<h2 style='margin-top: 0; color: #FFFFFF; font-weight: 700;'>{page_title}</h2>",
            unsafe_allow_html=True,
        )
    with col2:
        if status == "healthy":
            st.markdown(
                (
                    "<div style='text-align: right;'>"
                    "<span style='background: rgba(34, 197, 94, 0.15); border: 1px solid #22C55E; "
                    "border-radius: 20px; padding: 6px 14px; color: #4ADE80; font-size: 0.75rem; "
                    "font-weight: 700; display: inline-block; box-shadow: 0 0 10px rgba(34, 197, 94, 0.25);'>"
                    "● API CONNECTED</span>"
                    "</div>"
                ),
                unsafe_allow_html=True,
            )
        else:
            st.markdown(
                (
                    "<div style='text-align: right;'>"
                    "<span style='background: rgba(239, 68, 68, 0.15); border: 1px solid #EF4444; "
                    "border-radius: 20px; padding: 6px 14px; color: #FCA5A5; font-size: 0.75rem; "
                    "font-weight: 700; display: inline-block; box-shadow: 0 0 10px rgba(239, 68, 68, 0.25);'>"
                    "▲ INGEST OFFLINE</span>"
                    "</div>"
                ),
                unsafe_allow_html=True,
            )
        st.markdown("<div style='margin-bottom: 20px;'></div>", unsafe_allow_html=True)
