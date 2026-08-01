import {
  Scope,
  walkAst,
  ScopeV2,
  AttributeStorage,
  JCtx,
} from "./libs/jgram/jgram.js";
import * as jobslite from "./libs/obslite/index.js";

import { astHandlers } from "./model/astHandlers.js";
import { unconstrain } from "./model/unconstrain.js";
import { plotNetwork, UncNet } from "./model/uncNet.js";
import {
  mathGrammarStr,
  mathSyntax,
  mathText2ltokens,
} from "./model/mathGrammar.js";
import { ACTION_TYPE, selectors, store } from "./store.js";
import { mathFormatNode } from "./model/mathNodes.js";

function logAction(...args) {
  console.log("#", ...args);
}
function logStep(...args) {
  console.log("+", ...args);
}
function logMinor(...args) {
  console.log("|", ...args);
}

const problems = [`x1 + x2 : x1^2 + x2^2 <= 1`];
const inputRawStr = problems[0];

function formatNodeJson(node) {
  const repr = node.item?.repr(false) ?? node.token?.lex ?? "error";
  if (node.children) {
    return { [repr]: node.children.map((n) => formatNodeJson(n)) };
  }
  return repr;
}

function formatNodeFn(node) {
  return `${node.type}: ${node.value}`;
}

function main() {
  const systemEffects = {
    loggerEffect: (action$, store) =>
      action$.pipe(
        jobslite.operators.jmap((action) => {
          logAction("Action:", action);
        }),
      ),
  };
  store.addEffect(...Object.values(systemEffects));

  const syntax$ = store
    .select(selectors.selectSyntax)
    .pipe(jobslite.operators.jdistinct());

  const problemText$ = store
    .select(selectors.selectProblemText)
    .pipe(jobslite.operators.jdistinct());
  const lexTokens$ = store
    .select(selectors.selectLexTokens)
    .pipe(jobslite.operators.jdistinct());
  const initAst$ = store
    .select(selectors.selectInitAst)
    .pipe(jobslite.operators.jdistinct());
  const simplifiedAst$ = store
    .select(selectors.selectSimplifiedAst)
    .pipe(jobslite.operators.jdistinct());
  const unconstrainedAst$ = store
    .select(selectors.selectUnconstrainedAst)
    .pipe(jobslite.operators.jdistinct());
  const network$ = store
    .select(selectors.selectNetwork)
    .pipe(jobslite.operators.jdistinct());

  syntax$.subscribe({
    next: () => {
      handleSyntax();
    },
  });

  problemText$.subscribe({
    next: () => {
      handleProblemInput();
    },
  });
  lexTokens$.subscribe({
    next: () => {
      handleLexTokens();
    },
  });
  initAst$.subscribe({
    next: () => {
      handleInitAst();
    },
  });
  simplifiedAst$.subscribe({
    next: () => {
      handleSimplifiedAst();
    },
  });
  unconstrainedAst$.subscribe({
    next: () => {
      handleUnconstrainedAst();
    },
  });
  network$.subscribe({
    next: () => {
      handleNetwork();
    },
  });

  // # elements
  // ## textarea input
  const textareaProblemInput = document.querySelector(
    ".textarea-problem-input",
  );
  // ## textarea out
  const textareaProblemConstrained = document.querySelector(
    ".textarea-problem-constrained",
  );
  const textareaProblemUnconstrained = document.querySelector(
    ".textarea-problem-unconstrained",
  );
  // ## textarea debug
  const textareaLexTokens = document.querySelector(".textarea-lex-tokens");
  const textareaSyntaxTokens = document.querySelector(
    ".textarea-syntax-tokens",
  );
  const textareaGrammar = document.querySelector(".textarea-grammar");
  // ## network vis
  const nodeNetworkAstEl = document.querySelector(".node-network-ast");
  const nodeNetworkAstSimplifiedEl = document.querySelector(
    ".node-network-ast-simplified",
  );
  const nodeNetworkAstUnconstrainedEl = document.querySelector(
    ".node-network-ast-unconstrained",
  );
  const nodeNetworkGradEl = document.querySelector(".node-network-grad");
  const nodeNetworkGrammarStatesEl = document.querySelector(
    ".node-network-grammar-states",
  );
  // ## tables
  const grammarTablesEl = document.querySelector(".grammar-tables");
  // ## Expand
  const checkboxExpand = document.querySelector(".checkbox-expand");
  checkboxExpand.addEventListener("change", () => {
    const expandableEl = document.querySelector(".expandable");
    expandableEl.classList.remove("_expanded");
    if (checkboxExpand.checked) {
      expandableEl.classList.add("_expanded");
    }
  });

  // set init values
  textareaProblemInput.value = inputRawStr;

  initGrammar();
  store.dispatch({
    type: ACTION_TYPE.PROBLEM_TEXT_UPDATE,
    payload: inputRawStr,
  });

  // listeners
  textareaProblemInput.addEventListener("blur", () => {
    const problemText = textareaProblemInput.value;
    store.dispatch({
      type: ACTION_TYPE.PROBLEM_TEXT_UPDATE,
      payload: problemText,
    });
  });

  function initGrammar() {
    logStep("initGrammar");
    const syntax = mathSyntax;
    store.dispatch({ type: ACTION_TYPE.SYNTAX_UPDATE, payload: syntax });
  }

  function handleSyntax() {
    logStep("handleSyntax");
    const { syntax } = store.state;
    if (!syntax) {
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
    } = syntax;

    textareaGrammar.value = mathGrammarStr;

    grammarTablesEl.innerHTML = "";
    syntax.renderTables(grammarTablesEl);

    syntax.renderNetworkStates(nodeNetworkGrammarStatesEl);
  }

  function handleProblemInput() {
    logStep("handleProblemInput");
    const { problemText } = store.state;
    if (!problemText) {
      return;
    }

    const lexTokens = mathText2ltokens(problemText);
    logMinor("lexTokens", lexTokens);

    store.dispatch({ type: ACTION_TYPE.LEX_TOKENS_UPDATE, payload: lexTokens });
  }

  function handleLexTokens() {
    logStep("handleLexTokens");
    const { lexTokens, syntax } = store.state;
    if (!lexTokens || !syntax) {
      return;
    }

    textareaLexTokens.value = JSON.stringify(lexTokens);

    const nodes = syntax.buildAst(lexTokens);
    logMinor("nodes", nodes);

    const initAst = nodes[0];
    logMinor("initAst", initAst);
    // dispatch initAst
    store.dispatch({ type: ACTION_TYPE.INIT_AST_UPDATE, payload: initAst });
  }

  function handleInitAst() {
    logStep("handleInitAst");
    const { initAst, syntax } = store.state;
    if (!initAst || !syntax) {
      return;
    }

    const nodesStr = JSON.stringify(formatNodeJson(initAst), null, 1);
    textareaSyntaxTokens.value = nodesStr;
    syntax.renderNetworkAst(initAst, nodeNetworkAstEl);

    const scope = new ScopeV2();
    const attributes = new AttributeStorage();
    const jctx = new JCtx(attributes);
    const ctx = {
      scope,
      attributes,
      jctx,
    };
    walkAst(initAst, astHandlers, ctx);
    const jjnode = jctx.getNodeCtx(initAst);

    const simplifiedAst = jjnode.at("S")["node"];
    logMinor("simplifiedAst", simplifiedAst);
    // dispatch simplifiedAst
    store.dispatch({
      type: ACTION_TYPE.SIMPLIFIED_AST_UPDATE,
      payload: simplifiedAst,
    });
  }

  function handleSimplifiedAst() {
    logStep("handleSimplifiedAst");
    const { simplifiedAst, syntax } = store.state;
    if (!simplifiedAst || !syntax) {
      return;
    }

    const constrainedFmt = mathFormatNode(simplifiedAst);
    logMinor("constrainedFmt", constrainedFmt);
    textareaProblemConstrained.value = constrainedFmt;

    syntax.renderNetworkAst(
      simplifiedAst,
      nodeNetworkAstSimplifiedEl,
      formatNodeFn,
    );

    const unconstrainedAst = unconstrain(simplifiedAst);
    logMinor("unconstrainedAst", unconstrainedAst);
    // dispatch unconstrainedAst
    store.dispatch({
      type: ACTION_TYPE.UNCONSTRAINED_AST_UPDATE,
      payload: unconstrainedAst,
    });
  }

  function handleUnconstrainedAst() {
    logStep("handleUnconstrainedAst");
    const { unconstrainedAst, syntax } = store.state;
    if (!unconstrainedAst || !syntax) {
      return;
    }

    const unconstrainedFmt = mathFormatNode(unconstrainedAst);
    logMinor("unconstrainedFmt", unconstrainedFmt);
    textareaProblemUnconstrained.value = unconstrainedFmt;

    syntax.renderNetworkAst(
      unconstrainedAst,
      nodeNetworkAstUnconstrainedEl,
      formatNodeFn,
    );

    const network = new UncNet();
    network.build(unconstrainedAst);
    logMinor("network", network);
    // dispatch network
    store.dispatch({ type: ACTION_TYPE.NETWORK_UPDATE, payload: network });
  }
  function handleNetwork() {
    logStep("handleNetwork");
    const { network } = store.state;
    if (!network) {
      return;
    }

    logMinor("network", network);
    logMinor("network.outputNode", network.outputNode);
    const params = network.parameters;
    plotNetwork(network.outputNode, params, nodeNetworkGradEl);
  }
}

main();
