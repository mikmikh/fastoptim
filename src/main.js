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
} from "./libs/jgram/jgram.js";
import { astHandlers } from "./astHandlers.js";
import { unconstrain } from "./unconstrain.js";
import { plotNetwork, UncNet } from "./uncNet.js";

const grammarStr = `S
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

const problems = [`x1 + x2 : x1^2 + x2^2 <= 1`];
const inputRawStr = problems[0];

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

function formatNodeJson(node) {
  const repr = node.item?.repr(false) ?? node.token?.lex ?? "error";
  if (node.children) {
    return { [repr]: node.children.map((n) => formatNodeJson(n)) };
  }
  return repr;
}

function main() {
  const state = {
    syntax: null,
    ltokens: null,
    ast: null,
  };

  // inputs
  const inputRawEl = document.querySelector(".textarea-input-raw");
  const outputTokensEl = document.querySelector(".textarea-output-tokens");
  const inputGrammarEl = document.querySelector(".textarea-input-grammar");
  const inputTokensEl = document.querySelector(".textarea-input-tokens");
  const textareaOutputEl = document.querySelector(".textarea-output");
  // const btnProcessEl = document.querySelector(".btn-process");

  inputGrammarEl.addEventListener("blur", () => processGrammar());
  inputGrammarEl.value = grammarStr;
  processGrammar();

  inputRawEl.addEventListener("blur", () => {
    processRaw();
    processTokens();
  });
  inputRawEl.value = inputRawStr;
  processRaw();

  inputTokensEl.addEventListener("blur", () => processTokens());
  // inputTokensEl.value = inputTokensStr;
  processTokens();

  function processGrammar() {
    const tablesEl = document.querySelector(".tables");
    tablesEl.innerHTML = "";

    const grammarText = inputGrammarEl.value;
    state.syntax = null;
    try {
      state.syntax = new JSyntax(grammarText);
    } catch (e) {
      console.error(e);
    }
    if (!state.syntax) {
      return;
    }
    const {
      grammar,
      firstSet,
      followSet,
      terminalSet,
      nonterminalSet,
      states,
      transitions,
      actionGoto,
      conflicts,
    } = state.syntax;

    state.syntax.renderTables(tablesEl);

    const networkEl = document.querySelector(".state-network");
    state.syntax.renderNetworkStates(networkEl);
  }

  function processRaw() {
    const rawText = inputRawEl.value;
    const lexer = new JLexer(rawText);
    const ltokensRaw = [...lexer.parse()];
    const ltokens = ltokensRaw.map((lt) =>
      ltoken2stoken(lt, state.syntax.terminalSet),
    );
    state.ltokens = ltokens;
    console.log("ltokens", ltokens);
    outputTokensEl.value = JSON.stringify(ltokens);

    inputTokensEl.value = ltokens.map((lt) => lt.name).join(" ");
  }

  function processTokens() {
    textareaOutputEl.value = "";
    if (!state.syntax) {
      textareaOutputEl.value = "Grammar Error";
      return;
    }

    const nodes = state.syntax.buildAst(state.ltokens);
    console.log("nodes", nodes);

    state.ast = nodes[0];
    const nodesStr = JSON.stringify(formatNodeJson(nodes[0]), null, 1);
    textareaOutputEl.value = nodesStr;

    const networkEl = document.querySelector(".node-network");
    state.syntax.renderNetworkAst(state.ast, networkEl);

    // flattenAst();
    interpret();
  }

  function interpret() {
    if (!state.ast) {
      return;
    }
    const scope = new ScopeV2();
    const attributes = new AttributeStorage();
    const jctx = new JCtx(attributes);
    const ctx = {
      scope,
      attributes,
      jctx,
    };
    walkAst(state.ast, astHandlers, ctx);
    const jjnode = jctx.getNodeCtx(state.ast);
    const problem_node = jjnode.at("S")["node"];
    console.log("problem_node", problem_node);
    // const problemAstData = {
    //   objective: jjnode.at("S")["objective"],
    //   constraints: jjnode.at("S")["constraints"],
    // };
    // console.log("problemAstData", problemAstData);

    const formatNode = (node) => `${node.type}: ${node.value}`;
    const problemNetworkEl = document.querySelector(".node-network-problem");
    state.syntax.renderNetworkAst(problem_node, problemNetworkEl, formatNode);

    const unc_node = unconstrain(problem_node);
    const problemNetworkUncEl = document.querySelector(
      ".node-network-problem-unc",
    );
    state.syntax.renderNetworkAst(unc_node, problemNetworkUncEl, formatNode);

    const uncNet = new UncNet();
    const resNode = uncNet.build(unc_node);
    console.log("uncNet", uncNet);
    console.log("resNode", resNode);

    const params = uncNet.parameters;
    const netEl = document.querySelector(".node-network-problem-net");
    plotNetwork(resNode, params, netEl);
  }
}

main();
