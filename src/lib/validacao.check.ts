// Checagem das regras de cadastro. Rode com: node src/lib/validacao.check.ts
import assert from "node:assert";
import { destinoSeguro, erroConfirmar, erroEmail, erroNome, erroSenha, normalizarEmail } from "./validacao.ts";

for (const ok of ["Ana", "Maria da Silva", "Ana-Maria", "D'Ávila", "João  Pedro "]) assert.strictEqual(erroNome(ok), null, ok);
for (const ruim of ["", "   ", "Al", "Ana2", "Ana_", "-Ana", "a".repeat(61), "Ana!"]) assert.ok(erroNome(ruim), ruim);

assert.strictEqual(erroEmail("Pedro@Exemplo.com "), null);
assert.strictEqual(normalizarEmail(" Pedro@Exemplo.COM"), "pedro@exemplo.com");
for (const ruim of ["", "pedro", "pedro@", "pedro@x", "a b@x.com", `${"a".repeat(250)}@x.com`]) assert.ok(erroEmail(ruim), ruim);

assert.strictEqual(erroSenha("Senha#123"), null);
for (const ruim of ["", "Se#1", "senha#123", "SENHA#123", "Senha#abc", "Senha1234", `Aa1!${"a".repeat(69)}`]) assert.ok(erroSenha(ruim), ruim);
assert.ok(erroSenha(`Aa1!${"é".repeat(35)}`), "72 bytes, não 72 caracteres");

assert.strictEqual(erroConfirmar("Senha#123", "Senha#123"), null);
assert.ok(erroConfirmar("Senha#123", "Senha#12"));

assert.strictEqual(destinoSeguro("/app/materias/1?aba=resumo"), "/app/materias/1?aba=resumo");
for (const ruim of [null, "", "//evil.com", "https://evil.com", "/entrar", "/application", "/\\evil.com"]) {
  assert.strictEqual(destinoSeguro(ruim), "/app", String(ruim));
}
console.log("validacao ok");
