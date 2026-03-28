import assert from "node:assert";
import { describe, it } from "node:test";
import { EnumType } from "../../src/Type/EnumType.js";
import { LiteralType } from "../../src/Type/LiteralType.js";
import { NullType } from "../../src/Type/NullType.js";

describe("EnumType", () => {
    it("getId returns the provided id", () => {
        const type = new EnumType("enum-my-id", [1, 2]);
        assert.strictEqual(type.getId(), "enum-my-id");
    });

    it("getValues returns the provided values", () => {
        const type = new EnumType("enum-test", [1, "str", null]);
        assert.deepStrictEqual(type.getValues(), [1, "str", null]);
    });

    it("getTypes maps values to LiteralType / NullType correctly", () => {
        const type = new EnumType("enum-types", [1, "str", null]);
        const types = type.getTypes();
        assert.strictEqual(types.length, 3);
        assert.ok(types[0] instanceof LiteralType);
        assert.ok(types[1] instanceof LiteralType);
        assert.ok(types[2] instanceof NullType);
    });

    it("getMembers returns undefined when not provided", () => {
        const type = new EnumType("enum-no-members", [1, 2]);
        assert.strictEqual(type.getMembers(), undefined);
    });

    it("getMembers returns the provided members array", () => {
        const members = [
            { value: 1 as const, name: "One" },
            { value: 2 as const, name: "Two", description: "the second" },
        ];
        const type = new EnumType("enum-with-members", [1, 2], members);
        assert.deepStrictEqual(type.getMembers(), members);
    });

    it("getTypes produces LiteralType for boolean values", () => {
        const type = new EnumType("enum-bool", [true, false]);
        const types = type.getTypes();
        assert.strictEqual(types.length, 2);
        assert.ok(types[0] instanceof LiteralType);
        assert.ok(types[1] instanceof LiteralType);
    });

    it("getTypes handles empty values array", () => {
        const type = new EnumType("enum-empty", []);
        assert.deepStrictEqual(type.getTypes(), []);
        assert.deepStrictEqual(type.getValues(), []);
    });
});
