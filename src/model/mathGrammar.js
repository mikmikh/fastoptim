import {
  JSyntax,
  JLexer,
  visualize,
  LAMBDA,
  cloneAst,
  Scope,
  walkAst,
  ScopeV2,
  AttributeStorage,
  TAC,
  JCtx,
} from "../libs/jgram/jgram.js";
import { astHandlers } from "./astHandlers.js";
import { unconstrain } from "./unconstrain.js";
import { plotNetwork, UncNet } from "./uncNet.js";

export const mathGrammarStr = `S
  S -> E :colon CS
  CS -> CS :comma C
  CS -> C
  C -> E :cop E
  E -> E :top T
  E -> T
  T -> T :fop U
  T -> U
  U -> :top P
  U -> P
  P -> F :pow P
  P -> F
  F -> :id
  F -> :num
  F -> :lpar E :rpar
  F -> :id :lpar AL :rpar
  AL -> AL :comma E
  AL -> E
  `;

function ltoken2stoken(ltoken, terminalSet) {
  const keywords = {
    ":": ":colon",
    ",": ":comma",
    "(": ":lpar",
    ")": ":rpar",
    "+": ":top",
    "-": ":top",
    "*": ":fop",
    "/": ":fop",
    "^": ":pow",
    "=": ":cop",
    "<": ":cop",
    "<=": ":cop",
    ">": ":cop",
    ">=": ":cop",
  };
  if (keywords[ltoken.value]) {
    return { name: keywords[ltoken.value], lex: ltoken.value };
  }
  if (["ID"].includes(ltoken.type)) {
    return { name: ":id", lex: ltoken.value };
  }
  if (["NUMBER"].includes(ltoken.type)) {
    return { name: ":num", lex: ltoken.value };
  }
  if (["STRING"].includes(ltoken.type)) {
    return { name: ":str", lex: ltoken.value };
  }
  if (ltoken.type === "EOF") {
    return { name: "$", lex: "" };
  }

  return { name: ltoken.value, lex: ltoken.value };
}

export const mathSyntax = new JSyntax(mathGrammarStr);

export function mathText2ltokens(rawText) {
  const lexer = new JLexer(rawText);
  const ltokensRaw = [...lexer.parse()];
  const ltokens = ltokensRaw.map((lt) =>
    ltoken2stoken(lt, mathSyntax.terminalSet),
  );
  return ltokens;
}

