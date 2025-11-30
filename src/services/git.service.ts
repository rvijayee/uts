// placeholder
// src/services/git.service.ts
import simpleGit from "simple-git";
import * as path from "path";
import * as fs from "fs-extra";

export class GitService {
    baseDir = path.join(process.cwd(), "repos");

    constructor() {
        fs.ensureDirSync(this.baseDir);
    }

    async cloneOrUpdate(projectId: number, gitUrl: string, branch: string): Promise<string> {
        const projectPath = path.join(this.baseDir, String(projectId));

        const git = simpleGit();

        if (!fs.existsSync(projectPath)) {
            await git.clone(gitUrl, projectPath, ["--branch", branch]);
        } else {
            await git.cwd(projectPath);
            await git.fetch();
            await git.checkout(branch);
            await git.pull();
        }

        return projectPath;
    }
}

export const gitService = new GitService();
