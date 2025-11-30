export class TestFailureParser {
    async extractFailures(json: any) {
        if (!json || !json.testResults) return [];

        const failures = [];

        for (const suite of json.testResults) {
            if (suite.status === "failed" && suite.message) {
                failures.push({
                    fullName: "[SUITE FAILED]",
                    message: suite.message,
                    file: suite.name,
                    suiteName: "",
                    testName: ""
                });
                continue;
            }

            for (const assertion of suite.assertionResults) {
                if (assertion.status === "failed") {
                    console.log("working");
                    failures.push({
                        fullName: assertion.fullName,
                        message: assertion.failureMessages?.join("\n") || "",
                        file: suite.name,
                        suiteName: assertion.ancestorTitles.join(" "),
                        testName: assertion.title
                    });
                }
            }
        }
        console.log("count : " + failures.length);
        return failures;
    }
}

export const testFailureParser = new TestFailureParser();
