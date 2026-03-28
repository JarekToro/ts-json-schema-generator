import { assertValidSchema } from "../../utils";
import { test } from "node:test";

test(
    "valid-data - enums-jsdoc-labeled",
    assertValidSchema("enums-jsdoc-labeled", "Enum", { labeledEnums: true }),
);
