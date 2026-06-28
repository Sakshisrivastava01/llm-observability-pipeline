import httpx
import pandas as pd
import plotly.express as px
import streamlit as st
from components.evaluation_table import render_evaluation_table
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders the Evaluation Center with metrics audits, comparison charts, manual run inputs, and file exports."""
    render_navbar("Evaluations Manager")
    api = APIService()

    # Load recent traces to populate target dropdown
    traces = api.get_traces()
    evals = api.get_evaluations()

    # 1. Export Buttons Block
    st.markdown("### Export Evaluation Reports")
    col_exp1, col_exp2 = st.columns(2)
    with col_exp1:
        try:
            csv_data = httpx.get(
                f"{api.base_url}/evaluations/export?format=csv", timeout=5.0
            ).text
            st.download_button(
                label="📥 Export Report to CSV",
                data=csv_data,
                file_name="evaluations_report.csv",
                mime="text/csv",
                key="exp_eval_csv",
            )
        except Exception:
            st.error("Ingest node offline. Unable to download CSV.")
    with col_exp2:
        try:
            json_data = httpx.get(
                f"{api.base_url}/evaluations/export?format=json", timeout=5.0
            ).text
            st.download_button(
                label="📥 Export Report to JSON",
                data=json_data,
                file_name="evaluations_report.json",
                mime="application/json",
                key="exp_eval_json",
            )
        except Exception:
            st.error("Ingest node offline. Unable to download JSON.")

    st.markdown("---")

    # 2. Comparison Metrics Charts
    st.markdown("### Evaluations History Analytics")
    if evals:
        df_ev = pd.DataFrame(evals)
        # Convert timestamp to date
        df_ev["date"] = pd.to_datetime(df_ev["timestamp"])

        fig = px.line(
            df_ev,
            x="date",
            y="metric_value",
            color="metric_name",
            title="Operational Quality Scores History",
            labels={"date": "Timeline", "metric_value": "Score (0.0 - 1.0)"},
        )
        fig.update_layout(
            paper_bgcolor="rgba(0,0,0,0)",
            plot_bgcolor="rgba(0,0,0,0)",
            font={"color": "#ECECF1"},
            xaxis={"gridcolor": "rgba(255,255,255,0.05)"},
            yaxis={"gridcolor": "rgba(255,255,255,0.05)"},
        )
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Insufficient metrics data to map historical score curves.")

    st.markdown("---")

    # 3. Trigger manual evaluations
    st.markdown("### Trigger Manual Evaluator Scorer")
    if traces:
        trace_ids = [t["trace_id"] for t in traces]

        col_id, col_scr = st.columns(2)
        with col_id:
            selected_trace_id = st.selectbox(
                "Select Target Trace ID:", trace_ids, key="eval_trace_id_select"
            )
        with col_scr:
            scorer_name = st.selectbox(
                "Select Scorer Algorithm:",
                [
                    "hallucination",
                    "groundedness",
                    "faithfulness",
                    "similarity",
                    "quality",
                ],
                key="eval_scorer_select",
            )

        # Retrieve text values from selected trace to autofill inputs for convenience
        trace_detail = api.get_trace(selected_trace_id)
        default_out = trace_detail.get("output_data", {}).get("response", "")
        default_in = trace_detail.get("input_data", {}).get("prompt", "")

        out_text = st.text_area(
            "Completion Output to audit:",
            value=default_out,
            key="eval_output_area",
        )
        context_text = st.text_area(
            "Reference Context (for hallucination/groundedness):",
            value="",
            placeholder="Reference documents or ground truth paragraphs...",
            key="eval_context_area",
        )
        ref_text = st.text_area(
            "Target Output Reference (for similarity comparison):",
            value=default_in,
            key="eval_ref_area",
        )

        if st.button("Trigger Evaluator Run", key="trigger_eval_btn"):
            payload = {
                "trace_id": selected_trace_id,
                "scorer_name": scorer_name,
                "output_text": out_text,
                "context_text": context_text if context_text.strip() else None,
                "reference_text": ref_text if ref_text.strip() else None,
            }
            res = api.run_evaluation(payload)
            if "evaluation_id" in res:
                st.success(
                    (
                        f"Scorer run completed successfully! Metric: "
                        f"**{res['metric_name']}** -> Score: **{res['metric_value']:.4f}**"
                    )
                )
                st.rerun()
            else:
                st.error(
                    f"Scorer execution failed: {res.get('detail', 'Unknown error')}"
                )
    else:
        st.info("No trace records logged. Log a trace first to evaluate.")

    st.markdown("---")
    st.markdown("### Computed Evaluation Auditing Logs")
    render_evaluation_table(evals)
