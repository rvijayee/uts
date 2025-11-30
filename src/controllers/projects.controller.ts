import { Request, Response } from "express";

import { query, queryOne } from "../utils/db-utils";

export const listProjects = async (req: Request, res: Response) => {
  const projects = await query("SELECT * FROM project ORDER BY project_id DESC");
  res.json(projects);
};

export const createProject = async (req: Request, res: Response) => {
  const { name, git_url, default_branch } = req.body;

  const result = await query(
    "INSERT INTO project (name, git_url, default_branch) VALUES (?, ?, ?)",
    [name, git_url, default_branch]
  );

  res.status(201).json({
    project_id: result.insertId,
    name,
    git_url,
    default_branch
  });
};

export const getProject = async (req: Request, res: Response) => {
  const project = await queryOne("SELECT * FROM project WHERE project_id = ?", [
    req.params.projectId
  ]);

  if (!project) return res.status(404).json({ error: "Project not found" });

  res.json(project);
};

export const deleteProject = async (req: Request, res: Response) => {
  await query("DELETE FROM project WHERE project_id = ?", [req.params.projectId]);
  res.json({ message: "Project deleted" });
};
