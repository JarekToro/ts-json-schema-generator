import ts from "typescript";
import type { Context } from "../NodeParser.js";
import type { SubNodeParser } from "../SubNodeParser.js";
import type { BaseType } from "../Type/BaseType.js";
import type { EnumMember, EnumValue } from "../Type/EnumType.js";
import { EnumType } from "../Type/EnumType.js";
import { isNodeHidden } from "../Utils/isHidden.js";
import { getKey } from "../Utils/nodeKey.js";

export class EnumNodeParser implements SubNodeParser {
    public constructor(protected typeChecker: ts.TypeChecker) {}

    public supportsNode(node: ts.EnumDeclaration | ts.EnumMember): boolean {
        return node.kind === ts.SyntaxKind.EnumDeclaration || node.kind === ts.SyntaxKind.EnumMember;
    }
    public createType(node: ts.EnumDeclaration | ts.EnumMember, context: Context): BaseType {
        const rawMembers = node.kind === ts.SyntaxKind.EnumDeclaration ? node.members.slice() : [node];
        const visibleMembers = rawMembers.filter((member: ts.EnumMember) => !isNodeHidden(member));

        const members: EnumMember[] = visibleMembers.map((member, index) => ({
            value: this.getMemberValue(member, index),
            name: this.getMemberName(member),
            description: this.getMemberDescription(member),
        }));

        return new EnumType(
            `enum-${getKey(node, context)}`,
            members.map((m) => m.value),
            members,
        );
    }

    protected getMemberName(member: ts.EnumMember): string {
        if (ts.isIdentifier(member.name)) {
            return member.name.text;
        }
        if (ts.isStringLiteral(member.name)) {
            return member.name.text;
        }
        return member.name.getText();
    }

    protected getMemberDescription(member: ts.EnumMember): string | undefined {
        // Try JSDoc/leading documentation comment via symbol
        const symbol = this.typeChecker.getSymbolAtLocation(member.name);
        if (symbol) {
            const comments = symbol.getDocumentationComment(this.typeChecker);
            if (comments.length > 0) {
                const description = ts.displayPartsToString(comments).trim();
                if (description) {
                    return description;
                }
            }
        }

        // Fall back to trailing single-line comment on the same line (e.g. `Up = 1, // comment`)
        const sourceFile = member.getSourceFile();
        const text = sourceFile.text;
        const memberEnd = member.getEnd();
        const lineEnd = text.indexOf("\n", memberEnd);
        const lineText = text.substring(memberEnd, lineEnd === -1 ? text.length : lineEnd);
        const trailingMatch = lineText.match(/\/\/(.*)/);
        if (trailingMatch) {
            const description = trailingMatch[1].trim();
            if (description) {
                return description;
            }
        }

        return undefined;
    }

    protected getMemberValue(member: ts.EnumMember, index: number): EnumValue {
        const constantValue = this.typeChecker.getConstantValue(member);
        if (constantValue !== undefined) {
            return constantValue;
        }

        const initializer: ts.Expression | undefined = member.initializer;
        if (!initializer) {
            return index;
        } else if (initializer.kind === ts.SyntaxKind.NoSubstitutionTemplateLiteral) {
            return (member.name as ts.Identifier).getText();
        } else {
            return this.parseInitializer(initializer);
        }
    }
    protected parseInitializer(initializer: ts.Node): EnumValue {
        if (initializer.kind === ts.SyntaxKind.TrueKeyword) {
            return true;
        } else if (initializer.kind === ts.SyntaxKind.FalseKeyword) {
            return false;
        } else if (initializer.kind === ts.SyntaxKind.NullKeyword) {
            return null;
        } else if (initializer.kind === ts.SyntaxKind.StringLiteral) {
            return (initializer as ts.LiteralLikeNode).text;
        } else if (initializer.kind === ts.SyntaxKind.ParenthesizedExpression) {
            return this.parseInitializer((initializer as ts.ParenthesizedExpression).expression);
        } else if (initializer.kind === ts.SyntaxKind.AsExpression) {
            return this.parseInitializer((initializer as ts.AsExpression).expression);
        } else if (initializer.kind === ts.SyntaxKind.TypeAssertionExpression) {
            return this.parseInitializer((initializer as ts.TypeAssertion).expression);
        } else {
            return initializer.getText();
        }
    }
}
