from typing import Any

import pandas as pd
import streamlit as st


def render_evaluation_table(evaluations: list[dict[str, Any]]) -> None:
    """Renders tabular list of evaluation scorer logs in the dashboard."""
    if not evaluations:
        st.info("No evaluations computed yet.")
        return

    df = pd.DataFrame(evaluations)
    display_df = df[
        ["id", "trace_id", "metric_name", "metric_value", "status", "feedback"]
    ].copy()
    display_df.columns = [
        "Evaluation ID",
        "Trace ID",
        "Metric Category",
        "Score Value",
        "Status",
        "Scorer Feedback / Reason",
    ]

    st.dataframe(display_df, use_container_width=True, hide_index=True)
