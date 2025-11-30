// placeholder
import axios from "axios";

export class LLMService {
    baseURL = process.env.LLM_URL || "http://localhost:11434/v1";
    model = process.env.LLM_MODEL || "llama3.2:latest";

    async run(prompt: string): Promise<string> {
        try {
            const response = await axios.post(
                `${this.baseURL}/chat/completions`,
                {
                    model: this.model,
                    messages: [{ role: "user", content: prompt }],
                    temperature: 0.2
                },
                {
                    headers: { "Content-Type": "application/json" }
                }
            );
            console.log(response.data);
            return response.data.choices[0].message.content;
        } catch (err: any) {
            console.error("LLM ERROR:", err.response?.data || err.message);
            return "/* LLM failed */";
        }
    }
}

export const llm = new LLMService();
