import { assertValidSchema } from "../../utils";
import { test } from "node:test";

test("valid-data - enums-number-labeled", assertValidSchema("enums-number-labeled", "Enum", { labeledEnums: true }));
