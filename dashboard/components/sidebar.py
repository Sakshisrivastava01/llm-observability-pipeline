import streamlit as st


def render_sidebar() -> None:
    """Renders custom sidebar navigation buttons modifying st.session_state.current_page."""
    with st.sidebar:
        # Platform Branding Logo/Text
        st.markdown(
            (
                "<div style='text-align: center; margin-bottom: 20px;'>"
                "<h1 style='color: #818CF8; font-size: 1.8rem; font-weight: 800; "
                "margin-bottom: 0;'>ANTIGRAVITY</h1>"
                "<p style='color: #6366F1; font-size: 0.8rem; font-weight: 600; "
                "letter-spacing: 0.1em; margin-top: 2px;'>OBSERVABILITY</p>"
                "</div>"
            ),
            unsafe_allow_html=True,
        )

        st.markdown(
            "<hr style='border: 0; border-top: 1px solid rgba(79, 70, 229, 0.2); margin: 15px 0;'>",
            unsafe_allow_html=True,
        )

        pages = [
            ("Overview", "📊"),
            ("Trace Explorer", "🔍"),
            ("Model Analytics", "📈"),
            ("Evaluation", "⚖️"),
            ("Alerts", "⚠️"),
            ("Settings", "⚙️"),
        ]

        if "current_page" not in st.session_state:
            st.session_state.current_page = "Overview"

        for page_name, icon in pages:
            # Check if this button represents the active page for style context
            if st.button(f"{icon} {page_name}", key=f"nav_btn_{page_name}"):
                st.session_state.current_page = page_name
                st.rerun()

        st.markdown(
            "<hr style='border: 0; border-top: 1px solid rgba(79, 70, 229, 0.2); margin: 15px 0;'>",
            unsafe_allow_html=True,
        )

        st.markdown(
            (
                "<div style='background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); "
                "border-radius: 8px; padding: 10px; text-align: center;'>"
                "<span style='color: #4ADE80; font-size: 0.8rem; font-weight: 600;'>"
                "● Telemetry Node: Active</span>"
                "</div>"
            ),
            unsafe_allow_html=True,
        )
