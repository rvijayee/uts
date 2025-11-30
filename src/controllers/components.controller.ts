import { Request, Response } from "express";
import { query } from "../utils/db-utils";

export const getComponentGraphForProject = async (req: Request, res: Response) => {
  const { projectId } = req.params;

  const edges = await query(`
    SELECT cdg.parent_component_id, cdg.child_component_id
    FROM component_dep_graph cdg
    JOIN component c ON c.component_id = cdg.parent_component_id
    WHERE c.file_id IN (SELECT file_id FROM file WHERE project_id = ?)
  `, [projectId]);

  res.json({ project_id: projectId, edges });
};

export const getComponentDependencies = async (req: Request, res: Response) => {
  const deps = await query(
    `SELECT child_component_id FROM component_dep_graph WHERE parent_component_id = ?`,
    [req.params.componentId]
  );
  res.json(deps);
};

export const getComponentDependents = async (req: Request, res: Response) => {
  const deps = await query(
    `SELECT parent_component_id FROM component_dep_graph WHERE child_component_id = ?`,
    [req.params.componentId]
  );
  res.json(deps);
};
