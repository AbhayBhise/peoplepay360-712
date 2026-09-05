// Restricted arithmetic evaluator for salary_rules.formula. Deliberately does NOT use
// eval()/Function() — security.md flags unrestricted eval on user-supplied strings as a
// real code-injection surface, and salary formulas are configured by HR Payroll Manager
// through the UI, i.e. untrusted-enough input to warrant this. Supports + - * / ( ) and
// identifiers that get substituted with already-computed rule amounts before evaluation.
import { ApiError } from "../../utils/ApiError";

type Token = { type: "num" | "op" | "lparen" | "rparen"; value: string };

function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expression.length) {
    const ch = expression[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let num = "";
      while (i < expression.length && /[0-9.]/.test(expression[i])) {
        num += expression[i];
        i++;
      }
      tokens.push({ type: "num", value: num });
      continue;
    }
    if ("+-*/".includes(ch)) {
      tokens.push({ type: "op", value: ch });
      i++;
      continue;
    }
    if (ch === "(") {
      tokens.push({ type: "lparen", value: ch });
      i++;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen", value: ch });
      i++;
      continue;
    }
    throw ApiError.badRequest(`formula: unsupported character '${ch}' — identifiers must be substituted before evaluation`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek() {
    return this.tokens[this.pos];
  }
  private consume() {
    return this.tokens[this.pos++];
  }

  parseExpression(): number {
    let value = this.parseTerm();
    while (this.peek() && this.peek().type === "op" && (this.peek().value === "+" || this.peek().value === "-")) {
      const op = this.consume().value;
      const rhs = this.parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  private parseTerm(): number {
    let value = this.parseFactor();
    while (this.peek() && this.peek().type === "op" && (this.peek().value === "*" || this.peek().value === "/")) {
      const op = this.consume().value;
      const rhs = this.parseFactor();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }

  private parseFactor(): number {
    const token = this.peek();
    if (!token) throw ApiError.badRequest("formula: unexpected end of expression");

    if (token.type === "op" && token.value === "-") {
      this.consume();
      return -this.parseFactor();
    }
    if (token.type === "num") {
      this.consume();
      return Number(token.value);
    }
    if (token.type === "lparen") {
      this.consume();
      const value = this.parseExpression();
      const closing = this.consume();
      if (!closing || closing.type !== "rparen") {
        throw ApiError.badRequest("formula: missing closing parenthesis");
      }
      return value;
    }
    throw ApiError.badRequest(`formula: unexpected token '${token.value}'`);
  }
}

// `variables` maps salary_rule codes to their already-computed amount for this payslip.
// Identifiers in the formula are substituted (longest-code-first, to avoid partial-match
// collisions like BASIC vs BASIC2) before the restricted arithmetic parser runs.
export function evaluateFormula(formula: string, variables: Record<string, number>): number {
  let substituted = formula;
  const codes = Object.keys(variables).sort((a, b) => b.length - a.length);
  for (const code of codes) {
    const pattern = new RegExp(`\\b${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "g");
    substituted = substituted.replace(pattern, `(${variables[code]})`);
  }

  if (/[a-zA-Z_]/.test(substituted)) {
    throw ApiError.badRequest(
      `formula: contains an unresolved identifier — check the referenced rule code exists in this structure`
    );
  }

  const tokens = tokenize(substituted);
  const result = new Parser(tokens).parseExpression();
  return Math.round(result * 100) / 100;
}
