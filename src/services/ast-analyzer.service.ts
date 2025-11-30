// src/services/ast-analyzer.service.ts
import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as fs from "fs";
import { query } from "../utils/db-utils";

export class ASTAnalyzer {
    parseFile(filePath: string) {
        const code = fs.readFileSync(filePath, "utf8");

        return parse(code, {
            sourceType: "module",
            plugins: ["jsx", "typescript"]
        });
    }

    async analyzeAndSave(fileId: number, filePath: string) {
        const ast = this.parseFile(filePath);

        // Collect data here (SYNC)
        const imports: any[] = [];
        const exports: any[] = [];
        const functions: any[] = [];
        const jsx: any[] = [];

        traverse(ast, {
            ImportDeclaration(path) {
                const src = path.node.source.value;

                const defaultImport =
                    path.node.specifiers.find(s => s.type === "ImportDefaultSpecifier")
                        ?.local.name || null;

                const named = path.node.specifiers
                    .filter(s => s.type === "ImportSpecifier")
                    .map(s => s.local.name);

                imports.push({
                    imported_from: src,
                    default_import: defaultImport,
                    named_imports_json: JSON.stringify(named)
                });
            },

            ExportDefaultDeclaration(path) {
                exports.push({
                    name: "default",
                    export_type: "default"
                });
            },

            ExportNamedDeclaration(path) {
                const name = path.node.declaration?.id?.name;
                if (name) {
                    exports.push({
                        name,
                        export_type: "named"
                    });
                }
            },

            FunctionDeclaration(path) {
                functions.push({
                    name: path.node.id?.name || "anonymous",
                    kind: "functionDecl",
                    params_json: JSON.stringify(path.node.params)
                });
            },

            JSXElement(path) {
                const opening = path.node.openingElement;
                const tagName = opening.name.type === "JSXIdentifier"
                    ? opening.name.name
                    : "Unknown";

                jsx.push({ tag_name: tagName });
            }
        });

        // Now insert into DB ASYNC (valid)
        for (const imp of imports) {
            await query(
                `INSERT INTO import_record (file_id, imported_from, default_import, named_imports_json)
         VALUES (?, ?, ?, ?)`,
                [fileId, imp.imported_from, imp.default_import, imp.named_imports_json]
            );
        }

        for (const exp of exports) {
            await query(
                `INSERT INTO export_record (file_id, name, export_type)
         VALUES (?, ?, ?)`,
                [fileId, exp.name, exp.export_type]
            );
        }

        for (const fn of functions) {
            await query(
                `INSERT INTO function_record (file_id, name, kind, params_json)
         VALUES (?, ?, ?, ?)`,
                [fileId, fn.name, fn.kind, fn.params_json]
            );
        }

        for (const jsxNode of jsx) {
            await query(
                `INSERT INTO jsx_element (file_id, component_id, tag_name)
         VALUES (?, NULL, ?)`,
                [fileId, jsxNode.tag_name]
            );
        }
    }
}

export const astAnalyzer = new ASTAnalyzer();
