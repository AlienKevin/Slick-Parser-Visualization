import {Runner, PARSE, RUN, Visitor} from "slick-lang";
import {Expr, Case, Get, Function, RecordLiteral, ListLiteral, Call, If, Binary, Grouping, Literal, Variable} from "slick-lang/dist/Expr";
import {Stmt, VarDeclaration, CustomTypeDeclaration} from "slick-lang/dist/Stmt";
import { Token } from "slick-lang/dist/Token";
import runtime from "slick-lang/dist/Runtime";

type Node = {
    name: string,
    attributes?: {[key: string]: string},
    _collapsed: boolean,
    children: Node[]
}

class Traverser implements Visitor {

    traverse(source: string) {
        const runner = new Runner({});
        const statements = runner.run(source, { mode:  RUN, level: PARSE });

        const rootNode = {
            name: "Slick Program",
            children: statements.map(
                (stmt) => this.stmt(stmt)
            ),
            _collapsed: true
        };

        return rootNode;
    }

    stmt(stmt: Stmt): Node {
        if (stmt === null || stmt === undefined) {
            return {
                name: "Empty Statement",
                children: [],
                _collapsed: true
            };
        }
        return stmt.accept(this);
    }

    expr(expr: Expr, name?: string): Node {
        const node = expr.accept(this);
        if (name !== undefined) {
            return {
                name: name,
                children: [
                    node
                ],
                _collapsed: true
            }
        } else {
            return node;
        }
    }

    exprs(exprs: Expr[]): Node[] {
        return exprs.map((expr) => this.expr(expr))
    }

    leafNode(leafName: any, parentName?: string): Node {
        return (
            parentName === undefined
            ? {
                name: leafName.toString(),
                children: [],
                _collapsed: true
            }
            : {
                name: parentName,
                children: [
                    this.leafNode(leafName.toString())
                ],
                _collapsed: true
            }
        );
    }

    leafNodes(leaves: any[], parentName?: string) {
        const result = leaves.map((leaf) => this.leafNode(leaf));
        if (parentName !== undefined) {
            return (
                result.length > 0
                ? [{
                    name: parentName,
                    children: result,
                    _collapsed: true
                }]
                : []
            );
        } else {
            return result;
        }
    }

    visitIfExpr(expr: If) {
        return {
            name: "If Expression",
            children: [
                this.expr(expr.condition),
                this.expr(expr.thenBranch),
                this.expr(expr.elseBranch),
            ]
        };
    }

    visitBinaryExpr(expr: Binary) {
        return {
            name: "Binary Expression",
            children: [
                this.expr(expr.left),
                this.leafNode(expr.operator, "operator"),
                this.expr(expr.right),
            ]
        }
    }
    visitGroupingExpr(expr: Grouping) {
        return {
            name: "Grouping Expression",
            children: [
                this.leafNode("("),
                this.expr(expr.expression),
                this.leafNode(")"),
            ]
        }
    }
    visitLiteralExpr(expr: Literal) {
        return {
            name: "Literal Expression",
            children: [
                this.leafNode(runtime.toString(expr.value))
            ]
        }
    }
    visitVariableExpr(expr: Variable) {
        return {
            name: "Binding",
            children: [
                this.leafNode(expr.name)
            ]
        }
    }
    visitCallExpr(expr: Call) {
        return {
            name: "Call Expression",
            children: [
                this.expr(expr.callee),
                ...this.exprs(expr.argumentList)
            ]
        }
    }
    visitListLiteralExpr(expr: ListLiteral) {
        return {
            name: "List Literal",
            children: [
                ...this.exprs(expr.list)
            ]
        }
    }
    visitRecordLiteralExpr(expr: RecordLiteral) {
        return {
            name: "Record Literal",
            children: [
                ...(
                    expr.target === undefined
                    ? []
                    : [this.expr(expr.target, "Target Record")]
                ),
                ...Object.entries(expr.record).reduce((fields: Node[], [key, expr]) =>
                    [
                        ...fields,
                        this.expr(expr, key)
                    ]
                , []),
            ]
        }
    }
    visitFunctionExpr(expr: Function) {
        return {
            name: "Function Expression",
            children: [
                this.leafNodes(expr.params, "Parameters"),
                this.expr(expr.body, "Body")
            ]
        }
    }
    visitGetExpr(expr: Get) {
        return {
            name: "Get Expression",
            children: [
                this.expr(expr.object, "Record"),
                this.leafNode("'" + expr.name.lexeme + "'", "Property Name"),
            ]
        }
    }
    visitCaseExpr(expr: Case) {
        return {
            name: "Case Expression",
            children: [
                this.expr(expr.expr, "Conditional"),
                ...expr.cases.map((branch) => {
                    return {
                        name: "Branch",
                        children: [
                            (
                                branch.subtype instanceof Token
                                ? this.leafNode(branch.subtype, "Subtype")
                                : this.expr(branch.subtype, "Value")
                            ),
                            ...this.leafNodes(branch.parameters, "Parameters"),
                            this.expr(branch.result, "Result")
                        ]
                    }
                })
            ]
        }
    }
    visitVarDeclarationStmt(stmt: VarDeclaration) {
        return {
            name: "Binding Declaration",
            children: [
                this.leafNode(stmt.name, "Binding Name"),
                this.expr(stmt.initializer)
            ]
        }
    }
    visitCustomTypeDeclarationStmt(stmt: CustomTypeDeclaration) {
        return {
            name: "Custom Type Declaration",
            children: [
                this.leafNode(stmt.name, "Custom Type Name"),
                ...Object.entries(stmt.subtypes).reduce((subtypes: Node[], [key, type]) =>
                    [
                        ...subtypes,
                        this.leafNode(key + " " + (
                            type === undefined
                            ? ""
                            : type.toString()
                        ))
                    ]
                , [])
            ]
        }
    }
}

export {Traverser};

// const source =
// `_ :
//     print 'hello'
// `

// const traverser = new Traverser();
// var util = require('util');
// console.log(util.inspect(traverser.traverse(source), false, null));

