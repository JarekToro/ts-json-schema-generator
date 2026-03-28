import assert from "node:assert";
import { describe, it } from "node:test";
import { EnumTypeFormatter, toEnumType } from "../../src/TypeFormatter/EnumTypeFormatter.js";
import type { EnumMember } from "../../src/Type/EnumType.js";
import { EnumType } from "../../src/Type/EnumType.js";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEnumType(members: EnumMember[]): EnumType {
    return new EnumType(
        "enum-test",
        members.map((m) => m.value),
        members,
    );
}

// ---------------------------------------------------------------------------
// toEnumType
// ---------------------------------------------------------------------------

describe("toEnumType", () => {
    it("unwraps single-element array", () => {
        assert.strictEqual(toEnumType(["string"]), "string");
    });

    it("returns array as-is when multiple types", () => {
        assert.deepStrictEqual(toEnumType(["string", "number"]), ["string", "number"]);
    });
});

// ---------------------------------------------------------------------------
// EnumTypeFormatter – default (no labeledEnums)
// ---------------------------------------------------------------------------

describe("EnumTypeFormatter (default)", () => {
    const formatter = new EnumTypeFormatter();

    it("supportsType returns true for EnumType", () => {
        const type = makeEnumType([{ value: 1, name: "A" }]);
        assert.strictEqual(formatter.supportsType(type), true);
    });

    it("returns enum array for multiple number values", () => {
        const type = makeEnumType([
            { value: 1, name: "X" },
            { value: 2, name: "Y" },
        ]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            type: "number",
            enum: [1, 2],
        });
    });

    it("returns const for single value", () => {
        const type = makeEnumType([{ value: 1, name: "Only" }]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            type: "number",
            const: 1,
        });
    });

    it("returns enum array for multiple string values", () => {
        const type = makeEnumType([
            { value: "x", name: "X" },
            { value: "y", name: "Y" },
        ]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            type: "string",
            enum: ["x", "y"],
        });
    });

    it("returns mixed types for mixed values", () => {
        const type = makeEnumType([
            { value: 0, name: "A" },
            { value: "str", name: "B" },
        ]);
        const def = formatter.getDefinition(type);
        assert.deepStrictEqual(def, {
            type: ["number", "string"],
            enum: [0, "str"],
        });
    });

    it("getChildren returns empty array", () => {
        const type = makeEnumType([{ value: 1, name: "A" }]);
        assert.deepStrictEqual(formatter.getChildren(type), []);
    });

    it("deduplies repeated enum values", () => {
        const type = new EnumType("enum-dup", [1, 1, 2]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            type: "number",
            enum: [1, 2],
        });
    });
});

// ---------------------------------------------------------------------------
// EnumTypeFormatter – labeledEnums: true
// ---------------------------------------------------------------------------

describe("EnumTypeFormatter (labeledEnums: true)", () => {
    const formatter = new EnumTypeFormatter({ labeledEnums: true });

    it("returns oneOf with const+title for number enum", () => {
        const type = makeEnumType([
            { value: 1, name: "Up" },
            { value: 2, name: "Down" },
        ]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            oneOf: [
                { const: 1, title: "Up" },
                { const: 2, title: "Down" },
            ],
        });
    });

    it("returns oneOf with const+title for string enum", () => {
        const type = makeEnumType([
            { value: "x", name: "X" },
            { value: "y", name: "Y" },
        ]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            oneOf: [
                { const: "x", title: "X" },
                { const: "y", title: "Y" },
            ],
        });
    });

    it("includes description when member has a description", () => {
        const type = makeEnumType([
            { value: 1, name: "Up" },
            { value: 2, name: "Down", description: "Move downward" },
        ]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            oneOf: [
                { const: 1, title: "Up" },
                { const: 2, title: "Down", description: "Move downward" },
            ],
        });
    });

    it("wraps single-member enum in oneOf for consistency", () => {
        const type = makeEnumType([{ value: 42, name: "Only" }]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            oneOf: [{ const: 42, title: "Only" }],
        });
    });

    it("handles mixed-type members", () => {
        const type = makeEnumType([
            { value: 0, name: "A" },
            { value: "str", name: "B" },
            { value: true as unknown as number, name: "C" },
        ]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            oneOf: [
                { const: 0, title: "A" },
                { const: "str", title: "B" },
                { const: true, title: "C" },
            ],
        });
    });

    it("falls back to standard format when members list is empty", () => {
        // An EnumType constructed without members (backward-compat)
        const type = new EnumType("enum-no-members", [1, 2]);
        assert.deepStrictEqual(formatter.getDefinition(type), {
            type: "number",
            enum: [1, 2],
        });
    });

    it("getChildren returns empty array", () => {
        const type = makeEnumType([{ value: 1, name: "A" }]);
        assert.deepStrictEqual(formatter.getChildren(type), []);
    });
});
