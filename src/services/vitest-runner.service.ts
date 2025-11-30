// placeholder
import { execSync } from "child_process";
import * as path from "path";

export class TestRunnerService {
    runTests(repoPath: string) {
        const pkg = require(path.join(repoPath, "package.json"));

        let cmd = "";

        if (pkg.scripts?.test?.includes("react-scripts")) {
            cmd = "yarn test --watchAll=false --json --outputFile=test-results.json";
        } else if (pkg.scripts?.test?.includes("vitest")) {
            cmd = "yarn test --run --reporter=json --outputFile=test-results.json";
        } else {
            cmd = "yarn test --json --outputFile=test-results.json";
        }

        try {
            execSync(cmd, { cwd: repoPath, stdio: "pipe" });
        } catch (err: any) {
            // Even failing tests produce output
            console.log("Tests finished with failures.");
        }

        const resultsPath = path.join(repoPath, "test-results.json");
        return require(resultsPath);
    }
}

export const testRunner = new TestRunnerService();
