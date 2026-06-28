import streamlit as st
from components.evaluation_table import render_evaluation_table
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders the Evaluation page to trigger manual scorer runs and view historical evaluation scores."""
    render_navbar("Evaluations Manager")
    api = APIService()

    # Load recent traces to populate target dropdown
    traces = api.get_traces()
    evals = api.get_evaluations()

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


class Evaluations:
    pass
