import pandas as pd
import streamlit as st
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders operational threshold warnings and handles alerts acknowledgements."""
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

    tab1, tab2 = st.tabs(["Active Alerts Warnings", "Acknowledged/Historical Logs"])

    active_alerts = [a for a in alerts if a.get("status") == "active"]
    historical_alerts = [a for a in alerts if a.get("status") == "acknowledged"]

    with tab1:
        if not active_alerts:
            st.success("All systems operational. No active warnings triggered.")
        else:
            for alert in active_alerts:
                severity_color = "🔴" if alert["severity"] == "critical" else "⚠️"
                with st.expander(
                    f"{severity_color} {alert['metric_name'].upper()} - Severity: {alert['severity'].upper()}"
                ):
                    st.write(f"**Description**: {alert['description']}")
                    st.write(f"**Threshold limit**: {alert['threshold_value']}")
                    st.write(f"**Actual reading**: {alert['actual_value']}")
                    st.write(f"**Triggered At**: {alert['timestamp']}")

                    if st.button("Acknowledge Warning", key=f"ack_btn_{alert['id']}"):
                        res = api.acknowledge_alert(alert["id"])
                        if res.get("status") == "success":
                            st.success("Alert acknowledged successfully!")
                            st.rerun()
                        else:
                            st.error(
                                f"Acknowledge action failed: {res.get('message', 'unknown error')}"
                            )

    with tab2:
        if not historical_alerts:
            st.info("No historical alerts acknowledged yet.")
        else:
            df = pd.DataFrame(historical_alerts)
            display_df = df[
                [
                    "metric_name",
                    "threshold_value",
                    "actual_value",
                    "severity",
                    "description",
                    "timestamp",
                ]
            ].copy()
            display_df.columns = [
                "Metric Category",
                "Threshold Limit",
                "Actual Value",
                "Severity",
                "Description Details",
                "Triggered At",
            ]
            st.dataframe(display_df, use_container_width=True, hide_index=True)
