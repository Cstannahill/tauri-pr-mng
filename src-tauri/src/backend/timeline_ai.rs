use reqwest::Client;
use serde_json::json;

pub async fn generate_commit_summary(
    project_summary: &str,
    commit_diff: &str,
    openai_key: &str,
) -> Result<String, String> {
    let prompt = format!(
        "Project summary: {}\nCommit diff: {}\nWrite a concise, human-readable summary of what was accomplished in this commit for a project timeline.",
        project_summary, commit_diff
    );

    // Try Ollama llama3.1
    let ollama_res = Client::new()
        .post("http://localhost:11434/api/generate")
        .json(&json!({
            "model": "llama3.1",
            "prompt": prompt,
        }))
        .send()
        .await;

    if let Ok(resp) = ollama_res {
        if let Ok(json) = resp.json::<serde_json::Value>().await {
            if let Some(summary) = json["response"].as_str() {
                return Ok(summary.to_string());
            }
        }
    }

    // Fallback: OpenAI 4.1-nano
    let openai_res = Client::new()
        .post("https://api.openai.com/v1/chat/completions")
        .bearer_auth(openai_key)
        .json(&json!({
            "model": "gpt-4.1-nano",
            "messages": [{"role": "user", "content": prompt}],
        }))
        .send()
        .await;

    if let Ok(resp) = openai_res {
        if let Ok(json) = resp.json::<serde_json::Value>().await {
            if let Some(summary) = json["choices"][0]["message"]["content"].as_str() {
                return Ok(summary.to_string());
            }
        }
    }

    Err("Both AI models failed".to_string())
}
