import { assertValidSchema } from "../../utils";
import { test } from "node:test";

test("valid-data - enums-string-labeled", assertValidSchema("enums-string-labeled", "Enum", { labeledEnums: true }));
