from typing import Any

import pandas as pd
import plotly.express as px
import streamlit as st
from components.navbar import render_navbar
from components.trace_table import render_trace_table
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
    """Renders the Trace Explorer page with root inputs, outputs, nested spans, and Gantt charts."""
    render_navbar("Trace Explorer Timeline")
    api = APIService()
    traces = api.get_traces()

    selected_id = render_trace_table(traces)

    if selected_id:
        st.markdown("---")
        st.markdown(f"### Inspecting Trace: `{selected_id}`")
        trace = api.get_trace(selected_id)

        # Overview Metadata Columns
        meta_col1, meta_col2, meta_col3 = st.columns(3)
        with meta_col1:
            st.markdown(
                f"**Pipeline**: `{trace.get('name', 'N/A')}`",
                unsafe_allow_html=True,
            )
        with meta_col2:
            st.markdown(
                f"**Timestamp**: `{trace.get('start_time', 'N/A')}`",
                unsafe_allow_html=True,
            )
        with meta_col3:
            st.markdown(
                f"**Child Spans**: `{len(trace.get('spans', []))}`",
                unsafe_allow_html=True,
            )

        st.markdown("<br>", unsafe_allow_html=True)

        # Details Tabs
        tab1, tab2, tab3 = st.tabs(
            ["Execution Timeline", "Payload Parameters", "Validation Evaluations"]
        )

        with tab1:
            spans = trace.get("spans", [])
            render_gantt_chart(spans)

            # Details list
            st.markdown("#### Spans Structure Details")
            for span in spans:
                with st.expander(
                    f"Span: {span['name']} ({span['span_type']}) - Latency: {span['start_time']} -> {span['end_time']}"
                ):
                    st.json(span)

        with tab2:
            col_in, col_out = st.columns(2)
            with col_in:
                st.markdown("#### Root Ingest Inputs")
                st.json(trace.get("input_data", {}))
            with col_out:
                st.markdown("#### Termination Outputs")
                st.json(trace.get("output_data", {}))

        with tab3:
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


class Traces:
    pass
