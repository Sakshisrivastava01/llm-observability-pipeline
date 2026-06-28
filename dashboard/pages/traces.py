from typing import Any

import httpx
import pandas as pd
import plotly.express as px
import streamlit as st
from components.navbar import render_navbar
from services.api import APIService


def render_gantt_chart(spans: list[dict[str, Any]]) -> None:
    """Renders a Gantt execution offset chart mapping relative start and duration boundaries of child spans."""
    if not spans:
        st.warning("No spans available for this trace to generate timeline.")
        return

    df = pd.DataFrame(spans)
    df["start"] = pd.to_datetime(df["start_time"])
    df["end"] = pd.to_datetime(df["end_time"])

    fig = px.timeline(
        df,
        x_start="start",
        x_end="end",
        y="name",
        color="span_type",
        title="Span Latency Gantt Timeline",
        labels={"name": "Span Process", "span_type": "Call Type"},
        hover_data=[
            "model_name",
            "prompt_tokens",
            "completion_tokens",
            "cost",
            "error",
        ],
    )
    fig.update_yaxes(autorange="reversed")
    fig.update_layout(
        paper_bgcolor="rgba(0,0,0,0)",
        plot_bgcolor="rgba(0,0,0,0)",
        font={"color": "#ECECF1"},
        xaxis={"gridcolor": "rgba(255,255,255,0.05)"},
        yaxis={"gridcolor": "rgba(255,255,255,0.05)"},
    )
    st.plotly_chart(fig, use_container_width=True)


def render() -> None:
    """Renders the Trace Explorer page with root inputs, outputs, filters, search, and Gantt waterfall charts."""
    render_navbar("Trace Explorer Timeline")
    api = APIService()

    # 1. Export Buttons Block
    st.markdown("### Export Ingested Telemetry Logs")
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        try:
            csv_data = httpx.get(
                f"{api.base_url}/traces/export?format=csv", timeout=5.0
            ).text
            st.download_button(
                label="📥 Export Traces to CSV",
                data=csv_data,
                file_name="traces_report.csv",
                mime="text/csv",
                key="exp_trace_csv",
            )
        except Exception:
            st.error("Ingest node offline. Unable to download CSV.")
    with col_exp2:
        try:
            json_data = httpx.get(
                f"{api.base_url}/traces/export?format=json", timeout=5.0
            ).text
            st.download_button(
                label="📥 Export Traces to JSON",
                data=json_data,
                file_name="traces_report.json",
                mime="application/json",
                key="exp_trace_json",
            )
        except Exception:
            st.error("Ingest node offline. Unable to download JSON.")

    st.markdown("---")

    # 2. Search & Filters Block
    st.markdown("### Search & Filters")
    col_s, col_f = st.columns(2)
    with col_s:
        search_query = st.text_input(
            "Search by Trace ID or Pipeline name:", value="", key="trace_search_input"
        )
    with col_f:
        model_shares = api.get_model_shares()
        model_options = ["ALL"] + list(model_shares.keys())
        selected_model = st.selectbox(
            "Filter by Model:", model_options, key="trace_model_filter"
        )

    # 3. Pagination Controls
    st.markdown("---")
    limit = st.number_input(
        "Page size limit:",
        min_value=5,
        max_value=250,
        value=20,
        step=5,
        key="trace_page_limit",
    )
    offset = st.number_input(
        "Offset page count:", min_value=0, value=0, step=1, key="trace_page_offset"
    )

    # Load traces from API
    traces = api.get_traces()

    # Filter traces locally in Python for absolute portability
    filtered_traces = []
    for t in traces:
        # Search query check
        if search_query.strip():
            sq = search_query.lower()
            if (
                sq not in t.get("trace_id", "").lower()
                and sq not in t.get("name", "").lower()
            ):
                continue

        # Model name filter check (check nested spans)
        if selected_model != "ALL":
            # Fetch detailed spans to check if this trace ran on the selected model
            detail = api.get_trace(t["trace_id"])
            has_model = any(
                selected_model == s.get("model_name") for s in detail.get("spans", [])
            )
            if not has_model:
                continue

        filtered_traces.append(t)

    # Slice list by pagination limits
    paginated_traces = filtered_traces[offset : offset + limit]

    st.markdown(
        f"Showing **{len(paginated_traces)}** traces out of **{len(filtered_traces)}** matching filter conditions."
    )

    if not paginated_traces:
        st.info("No traces matched the current filter conditions.")
        return

    # Render custom table
    df_grid = pd.DataFrame(paginated_traces)
    display_df = df_grid[
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

    trace_ids = [t["trace_id"] for t in paginated_traces]
    selected_id = st.selectbox(
        "Select a transaction Trace ID to inspect hierarchy & timelines:",
        trace_ids,
        key="trace_select_dropdown",
    )

    if selected_id:
        st.markdown("---")
        st.markdown(f"### Inspecting Trace: `{selected_id}`")
        trace = api.get_trace(selected_id)

        meta_col1, meta_col2, meta_col3 = st.columns(3)
        with meta_col1:
            st.markdown(f"**Pipeline**: `{trace.get('name', 'N/A')}`")
        with meta_col2:
            st.markdown(f"**Timestamp**: `{trace.get('start_time', 'N/A')}`")
        with meta_col3:
            st.markdown(f"**Child Spans**: `{len(trace.get('spans', []))}`")

        st.markdown("<br>", unsafe_allow_html=True)

        tab_timeline, tab_payload, tab_evals = st.tabs(
            ["Execution Timeline", "Payload Parameters", "Validation Evaluations"]
        )

        with tab_timeline:
            spans = trace.get("spans", [])
            render_gantt_chart(spans)

            st.markdown("#### Spans Structure Details")
            for span in spans:
                with st.expander(
                    f"Span: {span['name']} ({span['span_type']}) - Latency: {span['start_time']} -> {span['end_time']}"
                ):
                    st.json(span)

        with tab_payload:
            col_in, col_out = st.columns(2)
            with col_in:
                st.markdown("#### Root Ingest Inputs")
                st.json(trace.get("input_data", {}))
            with col_out:
                st.markdown("#### Termination Outputs")
                st.json(trace.get("output_data", {}))

        with tab_evals:
            st.markdown("#### Evaluation Metric Scores")
            evaluations = trace.get("evaluations", [])
            if evaluations:
                for ev in evaluations:
                    st.metric(
                        label=f"{ev['metric_name']} score",
                        value=f"{ev['metric_value']:.2f}",
                        help=ev.get("feedback"),
                    )
            else:
                st.info("No automatic evaluations logged for this trace.")
