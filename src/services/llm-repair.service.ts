import { llm } from "./llm.service";
import fs from "fs";

export class LLMRepairService {
    async fixTest(failure, repoPath: string) {
        const testCode = fs.readFileSync(failure.file, "utf8");

        const prompt = `
Your job: Fix a failing frontend unit test.

--- Failure ---
${failure.message}

--- Test Name ---
${failure.fullName}

--- Current Test File ---
${testCode}

Fix the test so that it passes, with correct React Testing Library usage.
Return ONLY the updated test file.
`;

        const updated = await llm.run(prompt);

        fs.writeFileSync(failure.file, updated.trim());
        return updated;
    }
}

export const llmRepair = new LLMRepairService();
