// Checagem do lerJson. Rode com: node src/lib/quiz.check.ts
import assert from "node:assert";
import { GradeSchema, lerJson } from "./quiz.ts";

const ok = { verdict: "certa", feedback: "Boa." };
assert.deepStrictEqual(lerJson(JSON.stringify(ok), GradeSchema), ok);
assert.deepStrictEqual(lerJson("```json\n" + JSON.stringify(ok) + "\n```", GradeSchema), ok);
assert.deepStrictEqual(lerJson("Aqui está:\n```\n" + JSON.stringify(ok) + "\n```", GradeSchema), ok);
assert.strictEqual(lerJson("não é json", GradeSchema), null);
assert.strictEqual(lerJson('{"verdict":"talvez","feedback":""}', GradeSchema), null);
console.log("lerJson ok");
