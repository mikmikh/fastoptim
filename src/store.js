import * as jobslite from "./libs/obslite/index.js";

const initState = {
  problemText: null,
  syntax: null,
  lexTokens: null,
  initAst: null,
  simplifiedAst: null,
  unconstrainedAst: null,
  network: null,
};

export const selectors = {
  selectProblemText: jobslite.store.jcreateSelectorMemo(
    (state) => state.problemText,
    jobslite.utils.idFn,
  ),
  selectSyntax: jobslite.store.jcreateSelectorMemo(
    (state) => state.syntax,
    jobslite.utils.idFn,
  ),
  selectLexTokens: jobslite.store.jcreateSelectorMemo(
    (state) => state.lexTokens,
    jobslite.utils.idFn,
  ),
  selectInitAst: jobslite.store.jcreateSelectorMemo(
    (state) => state.initAst,
    jobslite.utils.idFn,
  ),
  selectSimplifiedAst: jobslite.store.jcreateSelectorMemo(
    (state) => state.simplifiedAst,
    jobslite.utils.idFn,
  ),
  selectUnconstrainedAst: jobslite.store.jcreateSelectorMemo(
    (state) => state.unconstrainedAst,
    jobslite.utils.idFn,
  ),
  selectNetwork: jobslite.store.jcreateSelectorMemo(
    (state) => state.network,
    jobslite.utils.idFn,
  ),
};

export const ACTION_TYPE = {
  PROBLEM_TEXT_UPDATE: "PROBLEM_TEXT_UPDATE",
  SYNTAX_UPDATE: "SYNTAX_UPDATE",
  LEX_TOKENS_UPDATE: "LEX_TOKENS_UPDATE",
  INIT_AST_UPDATE: "INIT_AST_UPDATE",
  SIMPLIFIED_AST_UPDATE: "SIMPLIFIED_AST_UPDATE",
  UNCONSTRAINED_AST_UPDATE: "UNCONSTRAINED_AST_UPDATE",
  NETWORK_UPDATE: "NETWORK_UPDATE",
};

const handlers = {
  [ACTION_TYPE.PROBLEM_TEXT_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { problemText: payload }),
  [ACTION_TYPE.SYNTAX_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { syntax: payload }),
  [ACTION_TYPE.LEX_TOKENS_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { lexTokens: payload }),
  [ACTION_TYPE.INIT_AST_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { initAst: payload }),
  [ACTION_TYPE.SIMPLIFIED_AST_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { simplifiedAst: payload }),
  [ACTION_TYPE.UNCONSTRAINED_AST_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { unconstrainedAst: payload }),
  [ACTION_TYPE.NETWORK_UPDATE]: (state, { payload }) =>
    jobslite.utils.jupdateState(state, { network: payload }),
};

const reducer = jobslite.store.jcreateReducer(initState, handlers);

export const store = new jobslite.store.JStore(reducer);