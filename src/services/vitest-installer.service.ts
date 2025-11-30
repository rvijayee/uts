import fs from "fs-extra";
import * as path from "path";

import { execSync } from "child_process";


export async function addCoverageScript(repoPath: string) {
    const pkgPath = path.join(repoPath, "package.json");

    if (!fs.existsSync(pkgPath)) {
        console.log("⚠ No package.json found – skipping coverage script.");
        return;
    }

    // Use fs-extra read/write JSON
    const pkg = fs.readJSONSync(pkgPath);

    pkg.scripts = pkg.scripts || {};

    const isCRA = pkg.dependencies?.["react-scripts"];
    const isVite =
        fs.existsSync(path.join(repoPath, "vite.config.ts")) ||
        fs.existsSync(path.join(repoPath, "vite.config.js"));

    if (isCRA) {
        pkg.scripts.coverage = "react-scripts test --coverage --watchAll=false";
    } else if (isVite) {
        pkg.scripts.coverage = "vitest run --coverage";
    } else {
        pkg.scripts.coverage = "vitest run --coverage";
    }

    fs.writeJSONSync(pkgPath, pkg, { spaces: 2 });

    console.log("✔ coverage script added to package.json");
}

export class VitestInstallerService {
    constructor() { }

    // Read package.json of cloned repo
    readPackageJson(repoPath: string) {
        const pkgPath = path.join(repoPath, "package.json");
        if (!fs.existsSync(pkgPath)) return null;
        return JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    }

    // Detect React version from dependencies/devDependencies
    detectReactVersion(pkg: any): number | null {
        const dep =
            pkg?.dependencies?.react ||
            pkg?.devDependencies?.react ||
            null;

        if (!dep) return null;

        const versionMatch = dep.match(/\d+/);
        return versionMatch ? Number(versionMatch[0]) : null;
    }

    // Fix missing/broken tsconfig.json
    fixTsConfig(repoPath: string) {
        const tsPath = path.join(repoPath, "tsconfig.json");

        let needWrite = false;

        if (!fs.existsSync(tsPath)) {
            needWrite = true;
        } else {
            try {
                JSON.parse(fs.readFileSync(tsPath, "utf8"));
            } catch {
                needWrite = true;
            }
        }

        if (!needWrite) return;

        const tsconfig = {
            compilerOptions: {
                target: "ESNext",
                module: "ESNext",
                moduleResolution: "Node",
                jsx: "react-jsx",
                esModuleInterop: true,
                skipLibCheck: true,
                allowSyntheticDefaultImports: true,
                resolveJsonModule: true,
                isolatedModules: true
            },
            include: ["src"]
        };

        fs.writeFileSync(tsPath, JSON.stringify(tsconfig, null, 2));
        console.log("✔ Repaired tsconfig.json");
    }

    async addCoverageScript(repoPath: string) {
        const pkgPath = path.join(repoPath, "package.json");

        if (!fs.existsSync(pkgPath)) {
            console.log("⚠ No package.json found – skipping coverage script.");
            return;
        }

        const pkg = fs.readJSONSync(pkgPath);

        pkg.scripts = pkg.scripts || {};

        // Detect CRA or Vite or plain React
        const isCRA = pkg.dependencies?.["react-scripts"];
        const isVite = fs.existsSync(path.join(repoPath, "vite.config.ts")) ||
            fs.existsSync(path.join(repoPath, "vite.config.js"));

        if (isCRA) {
            pkg.scripts.coverage = "react-scripts test --coverage --watchAll=false";
        } else if (isVite) {
            pkg.scripts.coverage = "vitest run --coverage";
        } else {
            pkg.scripts.coverage = "vitest run --coverage";
        }

        fs.writeJSONSync(pkgPath, pkg, { spaces: 2 });
        console.log("✔ Added coverage script to package.json");
    }

    // Write vitest.config.ts
    writeVitestConfig(repoPath: string) {
        const vitestConfig = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    coverage: {
      provider: "v8",
      reportsDirectory: "./coverage",
    }
  }
});`;

        fs.writeFileSync(
            path.join(repoPath, "vitest.config.ts"),
            vitestConfig
        );
    }

    writeTestSetup(repoPath: string) {
        const testFolder = path.join(repoPath, "tests");
        if (!fs.existsSync(testFolder)) fs.mkdirSync(testFolder);

        const setupContent = `import "@testing-library/jest-dom";`;
        fs.writeFileSync(path.join(testFolder, "setup.ts"), setupContent);

        fs.writeFileSync(path.join(repoPath, ".env"), "SKIP_PREFLIGHT_CHECK=true\n");
        console.log("✔ Added SKIP_PREFLIGHT_CHECK=true to .env");

    }



    // Install dependencies based on React version
    installVitest(repoPath: string, reactMajor: number | null) {
        let deps: string[] = ["vitest"];

        if (reactMajor === 17) {
            console.log("⚡ React 17 detected → installing compatible libs");

            deps.push("jsdom@19");
            deps.push("@testing-library/react@12");
            deps.push("@testing-library/jest-dom@5");
        } else if (reactMajor === 16) {
            console.log("⚡ React 16 detected → using React 17 compatible libs");

            deps.push("jsdom@19");
            deps.push("@testing-library/react@12");
            deps.push("@testing-library/jest-dom@5");
        } else {
            console.log("⚡ React 18+ detected → installing latest DOM libs");

            deps.push("jsdom@latest");
            deps.push("@testing-library/react@latest");
            deps.push("@testing-library/jest-dom@latest");
        }

        const cmd = `cd ${repoPath} && npm install -D ${deps.join(" ")}`;
        console.log("🛠 Running:", cmd);

        execSync(cmd, { stdio: "inherit" });

        console.log("✔ Vitest + DOM libs installed.");
    }

    async ensureVitest(repoPath: string) {
        console.log("🔍 Checking Vitest installer...");

        const pkg = this.readPackageJson(repoPath);
        if (!pkg) {
            console.log("❌ No package.json found. Cannot install Vitest.");
            return;
        }

        await addCoverageScript(repoPath);


        const reactMajor = this.detectReactVersion(pkg);
        console.log("⚡ Detected React major version:", reactMajor);

        this.fixTsConfig(repoPath);

        this.installVitest(repoPath, reactMajor);

        this.writeVitestConfig(repoPath);
        this.writeTestSetup(repoPath);
    }


}

export const vitestInstaller = new VitestInstallerService();
