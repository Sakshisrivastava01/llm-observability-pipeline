import streamlit as st
from components.navbar import render_navbar
from services.api import APIService


def render() -> None:
    """Renders deep settings audit checks, pricing configurations, and inference test play areas."""
    render_navbar("System Settings & Playground")
    api = APIService()

    # 1. Connection settings
    st.markdown("### API Connection Settings")
    st.text_input("Ingest Host Endpoint:", value=api.base_url, disabled=True)

    # Health status check button
    if st.button("Run System Diagnostics Audit"):
        diagnostics = api.get_health_diagnostics()
        col1, col2, col3 = st.columns(3)
        with col1:
            if diagnostics.get("database") == "healthy":
                st.success("Database status: Operational")
            else:
                st.error(f"Database status: Offline ({diagnostics.get('database')})")
        with col2:
            if diagnostics.get("openai") == "reachable":
                st.success("OpenAI connection: Reachable")
            else:
                st.error("OpenAI connection: Unreachable")
        with col3:
            if diagnostics.get("ollama") == "reachable":
                st.success("Ollama local connection: Reachable")
            else:
                st.warning("Ollama local connection: Offline")

        st.info(f"Ingest Node Environment: {diagnostics.get('environment', 'unknown')}")

    st.markdown("---")

    # 2. Pricing Configuration Panel
    st.markdown("### Token Pricing Configuration")
    pricing_list = api.get_pricing()
    if pricing_list:
        import pandas as pd

        df_price = pd.DataFrame(pricing_list)
        df_price.columns = [
            "ID",
            "Provider",
            "Model Name",
            "Input Token Price ($/1k)",
            "Output Token Price ($/1k)",
            "Active Status",
        ]
        st.dataframe(df_price, use_container_width=True, hide_index=True)
    else:
        st.info("No pricing models custom registered. Default rates are active.")

    with st.expander("Update Model Pricing Rates", expanded=False):
        with st.form("pricing_form"):
            prov = st.selectbox("Provider:", ["openai", "ollama"])
            model_name = st.text_input(
                "Model name identifier:", placeholder="e.g. gpt-4o, llama3"
            )
            input_p = st.number_input(
                "Input Token cost per 1k ($):", min_value=0.0, format="%.6f"
            )
            output_p = st.number_input(
                "Output Token cost per 1k ($):", min_value=0.0, format="%.6f"
            )
            submit_price = st.form_submit_button("Register Rates Configuration")

            if submit_price:
                if not model_name.strip():
                    st.error("Model name identifier cannot be empty.")
                else:
                    res = api.upsert_pricing(
                        provider=prov,
                        model_name=model_name.strip(),
                        input_price=input_p,
                        output_price=output_p,
                    )
                    if res.get("status") == "success":
                        st.success(
                            f"Price configurations updated for: **{res.get('model_name')}**"
                        )
                        st.rerun()
                    else:
                        st.error(
                            f"Update failed: {res.get('message', 'unknown error')}"
                        )

    st.markdown("---")

    # 3. Query Simulator
    st.markdown("### LLM Telemetry & Evaluation Simulator")
    st.write(
        "Submit synthetic queries below to trigger completions, log traces, and calculate evaluation scores."
    )

    col_prov, col_mod = st.columns(2)
    with col_prov:
        provider = st.selectbox("LLM Provider Connector:", ["openai", "ollama"])
    with col_mod:
        model = st.selectbox("Target LLM Model:", ["gpt-4o", "gpt-3.5-turbo", "llama3"])

    prompt = st.text_area(
        "User Prompt:", value="Explain the basic concept of quantum superposition."
    )
    sys_instruction = st.text_input(
        "System Instruction (Optional):", value="Be extremely concise."
    )
    temp = st.slider("Temperature:", min_value=0.0, max_value=1.0, value=0.7)

    st.markdown("#### Quality Metrics References (Optional)")
    ref_context = st.text_area(
        "Reference Document Context (For Hallucination/Groundedness):",
        value=(
            "Quantum superposition is a fundamental principle of quantum mechanics "
            "where a physical system exists in multiple states simultaneously."
        ),
    )
    ref_output = st.text_area(
        "Reference Completion (For Semantic Similarity comparison):",
        value=(
            "Quantum superposition allows a physical system to exist in multiple states "
            "simultaneously until it is measured."
        ),
    )

    if st.button("Submit Inference Request"):
        payload = {
            "provider": provider,
            "model": model,
            "prompt": prompt,
            "system_instruction": sys_instruction if sys_instruction else None,
            "temperature": temp,
            "reference_context": ref_context if ref_context.strip() else None,
            "reference_output": ref_output if ref_output.strip() else None,
        }

        with st.spinner("Executing completions & tracking telemetry signals..."):
            res = api.run_inference(payload)

        if "trace_id" in res:
            st.success(
                f"Inference succeeded! Telemetry Trace generated ID: `{res['trace_id']}`"
            )

            # Columns to display results
            col_out, col_stats = st.columns(2)
            with col_out:
                st.markdown("#### Model Response Generation")
                st.write(res.get("response", ""))

            with col_stats:
                st.markdown("#### Cost & Usage Details")
                st.json(
                    {
                        "cost": f"${res.get('cost', 0.0):.6f}",
                        "tokens": res.get("tokens", {}),
                    }
                )

            st.markdown("#### Computed Real-time Evaluations")
            evals = res.get("evaluations", [])
            if evals:
                for ev in evals:
                    st.metric(
                        label=f"{ev['metric_name']} score",
                        value=f"{ev['metric_value']:.4f}",
                    )
            else:
                st.info("No evaluations configured for this simulation.")
        else:
            st.error(f"Inference simulation failed: {res.get('message', res)}")
