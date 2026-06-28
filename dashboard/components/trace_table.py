from typing import Any

import pandas as pd
import streamlit as st


def render_trace_table(traces: list[dict[str, Any]]) -> str | None:
    """Renders a tabular dataframe of traces and returns the selected trace ID string."""
    if not traces:
        st.info("No traces logged yet.")
        return None

    df = pd.DataFrame(traces)
    # Re-arrange display columns
    display_df = df[
        ["trace_id", "name", "start_time", "end_time", "spans_count"]
    ].copy()
    display_df.columns = [
        "Trace ID",
        "Pipeline Name",
        "Start Time",
        "End Time",
        "Child Spans",
    ]

    st.dataframe(display_df, use_container_width=True, hide_index=True)

    trace_ids = [t["trace_id"] for t in traces]
    selected_id = st.selectbox(
        "Select a transaction Trace ID to inspect hierarchy & timelines:",
        trace_ids,
        key="trace_select_dropdown",
    )
    return selected_id
