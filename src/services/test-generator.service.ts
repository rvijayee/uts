import fs from "fs-extra";
import * as path from "path";

export class TestGeneratorService {
    // ------------------------------------
    // Detect JS/TS for each repo
    // ------------------------------------
    detectExtension(repoPath: string) {
        const srcDir = path.join(repoPath, "src");

        if (fs.existsSync(path.join(repoPath, "tsconfig.json"))) return "tsx";

        if (fs.existsSync(srcDir)) {
            const files = fs.readdirSync(srcDir);
            if (files.some(f => f.endsWith(".ts") || f.endsWith(".tsx"))) return "tsx";
        }

        return "jsx";
    }

    // ------------------------------------
    // Detect correct test directory
    // Vite → src/__tests__
    // CRA → src/__tests__
    // Next.js → __tests__
    // Default → tests
    // ------------------------------------
    detectTestDir(repoPath: string) {
        const pkgPath = path.join(repoPath, "package.json");
        const viteConf = path.join(repoPath, "vite.config.ts");
        const nextConf = path.join(repoPath, "next.config.js");

        const pkg = fs.existsSync(pkgPath)
            ? fs.readJSONSync(pkgPath)
            : {};

        // Vite → must place tests inside src/
        if (fs.existsSync(viteConf)) {
            return path.join(repoPath, "src/__tests__");
        }

        // CRA (react-scripts) → must place tests inside src/
        if (pkg.dependencies?.["react-scripts"]) {
            return path.join(repoPath, "src/__tests__");
        }

        // Next.js → root __tests__
        if (fs.existsSync(nextConf)) {
            return path.join(repoPath, "__tests__");
        }

        // Default fallback
        return path.join(repoPath, "tests");
    }

    ensureFolder(dir: string) {
        fs.ensureDirSync(dir);
    }

    // ------------------------------------
    // Extract component name from file
    // ------------------------------------
    getComponentName(filePath: string) {
        const filename = path.basename(filePath);
        let name = filename.replace(/\.(jsx?|tsx?)$/, "");

        if (name === "index") {
            name = path.basename(path.dirname(filePath));
        }

        return name.replace(/[^a-zA-Z0-9_]/g, "");
    }

    // ------------------------------------
    // Convert repo absolute → proper relative import path
    // ------------------------------------
    generateRelativeImport(testDir: string, sourceFilePath: string) {
        let rel = path.relative(testDir, sourceFilePath).replace(/\\/g, "/");

        if (!rel.startsWith(".")) rel = "./" + rel;

        // Remove extension
        return rel.replace(/\.(jsx?|tsx?)$/, "");
    }

    // ------------------------------------
    // Generate test file content
    // ------------------------------------
    generateTestTemplate(componentName: string, importPath: string) {
        return `
import React from "react";
import { render, screen } from "@testing-library/react";
import ${componentName} from "${importPath}";

describe("${componentName}", () => {
  test("renders without crashing", () => {
    render(<${componentName} />);
    expect(screen).toBeDefined();
  });

  test("component is defined", () => {
    expect(${componentName}).toBeTruthy();
  });
});
`.trim();
    }

    generateTestFilePath(testDir: string, componentName: string, ext: string) {
        return path.join(testDir, `${componentName}.test.${ext}`);
    }

    // ------------------------------------
    // Main generator
    // ------------------------------------
    async generateTestsForFile(repoPath: string, filePath: string, components: string[]) {
        console.log("Detected components:", components);

        if (!components || components.length === 0) {
            console.log("⚠ No components detected → skipping test creation.");
            return;
        }

        const testDir = this.detectTestDir(repoPath);
        this.ensureFolder(testDir);

        const extension = this.detectExtension(repoPath);

        for (const componentName of components) {
            const testFilePath = this.generateTestFilePath(testDir, componentName, extension);

            if (fs.existsSync(testFilePath)) {
                console.log(`✔ Test already exists: ${testFilePath}`);
                continue;
            }

            const importPath = this.generateRelativeImport(testDir, filePath);

            const template = this.generateTestTemplate(componentName, importPath);
            fs.writeFileSync(testFilePath, template);

            console.log(`🧪 Created: ${testFilePath}`);
        }
    }
}

export const testGenerator = new TestGeneratorService();
