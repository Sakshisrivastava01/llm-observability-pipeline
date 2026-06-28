import pandas as pd
import streamlit as st
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders the Alerts page displaying latency, cost, and regression status flags."""
    render_navbar("Operational Alerts & Diagnostics")
    api = APIService()

    # Query alert triggers
    alerts = api.get_alerts()
    reg_status = api.get_regressions()

    # 1. Latency Regression Warning Alert banner
    if reg_status.get("regression_detected", False):
        st.error(
            (
                "🚨 **CRITICAL LATENCY REGRESSION DETECTED**: P95 duration limits "
                "have exceeded 2x the standard operational baseline. Action required!"
            )
        )

    st.markdown("### Active & Historic Alert Triggers")
    if alerts:
        df = pd.DataFrame(alerts)
        display_df = df[
            [
                "metric_name",
                "threshold_value",
                "actual_value",
                "severity",
                "status",
                "description",
                "timestamp",
            ]
        ].copy()
        display_df.columns = [
            "Metric Name",
            "Threshold Limit",
            "Actual Value",
            "Severity",
            "Status",
            "Description Details",
            "Triggered At",
        ]
        st.dataframe(display_df, use_container_width=True, hide_index=True)
    else:
        st.info(
            "All systems normal. No token cost or transaction latency alerts active."
        )


class Alerts:
    pass
