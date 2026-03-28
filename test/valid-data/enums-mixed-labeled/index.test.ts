import { assertValidSchema } from "../../utils";
import { test } from "node:test";

test("valid-data - enums-mixed-labeled", assertValidSchema("enums-mixed-labeled", "Enum", { labeledEnums: true }));
