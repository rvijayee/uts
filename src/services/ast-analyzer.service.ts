import { parse } from "@babel/parser";
import traverse from "@babel/traverse";
import * as t from "@babel/types";
import * as fs from "fs";
import { query } from "../utils/db-utils";
import { computeFileChecksum } from "../utils/hash-utils";

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

        // Collect results
        const imports: any[] = [];
        const exports: any[] = [];

        const components: any[] = [];
        const jsxElements: any[] = [];
        const componentDependencies: any[] = [];

        let currentComponent: string | null = null;

        // Helper: detect if both name & JSX-returning
        function markComponent(name: string) {
            if (!components.find(c => c.name === name)) {
                components.push({ name, props: [] });
            }
        }

        // Helper: Identify JSX tag name
        function getJSXName(node: t.JSXOpeningElement) {
            if (t.isJSXIdentifier(node.name)) {
                return node.name.name;         // Button → Button
            }
            if (t.isJSXMemberExpression(node.name)) {
                return `${node.name.object.name}.${node.name.property.name}`;
            }
            return null;
        }


        traverse(ast, {
            // ----------------------------
            // IMPORTS
            // ----------------------------
            ImportDeclaration(path) {
                const src = path.node.source.value;

                const defImport =
                    path.node.specifiers.find(s => t.isImportDefaultSpecifier(s))
                        ?.local.name || null;

                const named = path.node.specifiers
                    .filter(s => t.isImportSpecifier(s))
                    .map(s => s.local.name);

                imports.push({
                    imported_from: src,
                    default_import: defImport,
                    named_imports_json: JSON.stringify(named)
                });
            },

            // ----------------------------
            // CLASS COMPONENTS
            // ----------------------------
            ClassDeclaration: {
                enter(path) {
                    const name = path.node.id?.name;
                    if (!name) return;

                    // detection: extends React.Component / React.PureComponent
                    const superClass = path.node.superClass;

                    let isReactClass = false;

                    if (
                        t.isMemberExpression(superClass) &&
                        superClass.object &&
                        superClass.property &&
                        superClass.object.type === "Identifier" &&
                        superClass.object.name === "React" &&
                        superClass.property.type === "Identifier" &&
                        (superClass.property.name === "Component" ||
                            superClass.property.name === "PureComponent")
                    ) {
                        isReactClass = true;
                    }

                    if (
                        t.isIdentifier(superClass) &&
                        (superClass.name === "Component" || superClass.name === "PureComponent")
                    ) {
                        isReactClass = true;
                    }

                    if (isReactClass) {
                        markComponent(name);
                    }

                    // if we've already marked this class as component, set currentComponent
                    if (components.find(c => c.name === name)) {
                        currentComponent = name;
                    }
                },
                exit(path) {
                    currentComponent = null;
                }
            },

            // ----------------------------
            // EXPORTS
            // ----------------------------
            ExportDefaultDeclaration(path) {
                if (t.isFunctionDeclaration(path.node.declaration)) {
                    const name = path.node.declaration.id?.name || "default";
                    markComponent(name);

                    exports.push({
                        name,
                        export_type: "default"
                    });
                } else {
                    exports.push({
                        name: "default",
                        export_type: "default"
                    });
                }
            },

            ExportNamedDeclaration(path) {
                if (t.isFunctionDeclaration(path.node.declaration)) {
                    const name = path.node.declaration.id?.name;
                    if (name) {
                        markComponent(name);

                        exports.push({
                            name,
                            export_type: "named"
                        });
                    }
                }
            },

            // ----------------------------
            // FUNCTION COMPONENTS
            // ----------------------------
            FunctionDeclaration: {
                enter(path) {
                    const name = path.node.id?.name;
                    if (!name) return;

                    // detect JSX-returning
                    let returnsJSX = false;

                    path.traverse({
                        ReturnStatement(ret) {
                            if (
                                ret.node.argument &&
                                (t.isJSXElement(ret.node.argument) ||
                                    t.isJSXFragment(ret.node.argument))
                            ) {
                                returnsJSX = true;
                            }
                        }
                    });

                    if (returnsJSX) {
                        markComponent(name);
                    }

                    if (components.find(c => c.name === name)) {
                        currentComponent = name;
                    }
                },
                exit() {
                    currentComponent = null;
                }
            },

            // ----------------------------
            // ARROW FUNCTION COMPONENTS
            // ----------------------------
            VariableDeclarator: {
                enter(path) {
                    if (!t.isIdentifier(path.node.id)) return;
                    const name = path.node.id.name;

                    const init = path.node.init;

                    if (
                        t.isArrowFunctionExpression(init) &&
                        (t.isJSXElement(init.body) || t.isJSXFragment(init.body))
                    ) {
                        markComponent(name);
                    }

                    if (t.isArrowFunctionExpression(init)) {
                        let returnsJSX = false;

                        (path.get("init") as any).traverse({
                            ReturnStatement(ret: any) {
                                if (
                                    ret.node.argument &&
                                    (t.isJSXElement(ret.node.argument) ||
                                        t.isJSXFragment(ret.node.argument))
                                ) {
                                    returnsJSX = true;
                                }
                            }
                        });

                        if (returnsJSX) markComponent(name);
                    }

                    if (
                        t.isCallExpression(init) &&
                        t.isMemberExpression(init.callee) &&
                        t.isIdentifier(init.callee.object) &&
                        init.callee.object.name === "React" &&
                        t.isIdentifier(init.callee.property) &&
                        (init.callee.property.name === "memo" ||
                            init.callee.property.name === "forwardRef")
                    ) {
                        markComponent(name);
                    }

                    if (components.find(c => c.name === name)) {
                        currentComponent = name;
                    }
                },
                exit() {
                    currentComponent = null;
                }
            },

            // ----------------------------
            // CLASS METHODS (render etc.)
            // ----------------------------
            ClassMethod: {
                enter(path) {
                    const classDecl = path.findParent(p => p.isClassDeclaration());
                    const className = classDecl?.node.id?.name;

                    if (className && components.some(c => c.name === className)) {
                        currentComponent = className;
                    }
                },
                exit() {
                    currentComponent = null;
                }
            },

            // ----------------------------
            // JSX Detection + Dependency tracking
            // ----------------------------
            JSXElement(path) {
                const opening = path.node.openingElement;
                const tagName = getJSXName(opening);
                if (!tagName) return;

                jsxElements.push({ tagName });

                const isComponent =
                    /^[A-Z]/.test(tagName) && !["Fragment"].includes(tagName);

                if (isComponent && currentComponent) {
                    componentDependencies.push({
                        parent: currentComponent,
                        child: tagName
                    });
                }
            }
        });


        // ----------------------------------
        // SAVE COMPONENTS
        // ----------------------------------
        const componentIdMap: Record<string, number> = {};

        for (const comp of components) {
            const result = await query(
                `INSERT INTO component (file_id, name, is_default_export)
         VALUES (?, ?, ?)`,
                [fileId, comp.name, 0]
            );

            componentIdMap[comp.name] = result.insertId;
        }

        // ----------------------------------
        // SAVE JSX
        // ----------------------------------
        for (const jsx of jsxElements) {
            await query(
                `INSERT INTO jsx_element (file_id, component_id, tag_name)
         VALUES (?, NULL, ?)`,
                [fileId, jsx.tagName]
            );
        }

        // ----------------------------------
        // SAVE DEPENDENCY GRAPH
        // ----------------------------------
        for (const dep of componentDependencies) {
            const parentId = componentIdMap[dep.parent];
            const childId = componentIdMap[dep.child];

            if (!parentId || !childId) continue;

            await query(
                `INSERT INTO component_dep_graph (parent_component_id, child_component_id)
         VALUES (?, ?)`,
                [parentId, childId]
            );
        }
        return components;
    }
}

export const astAnalyzer = new ASTAnalyzer();
