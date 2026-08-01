export const NODE_TYPE = {
    OPTIM: 'OPTIM',
    COND: 'COND',
    BIN_OP: 'BIN_OP',
    UN_OP: 'UN_OP',
    VAR: 'VAR',
    NUM: 'NUM',
    FUNC: 'FUNC',
}

export const astHandlers = {
  "S#0": (node, dir, { scope, jctx }) => {
    // S -> E :colon CS
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("S")["objective"] = jjnode.at("E")["node"];
      jjnode.at("S")["constraints"] = jjnode.at("CS")["nodes"];
      jjnode.at("S")["node"] = {
        type: "OPTIM",
        value: "ST",
        children: [jjnode.at("E")["node"], ...jjnode.at("CS")["nodes"]],
      }
    }
  },
  "CS#0": (node, dir, { scope, jctx }) => {
    // CS -> CS :comma C
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("CS#0")["nodes"] = [
        ...jjnode.at("CS#1")["nodes"],
        jjnode.at("C")["node"],
      ];
    }
  },
  "CS#1": (node, dir, { scope, jctx }) => {
    // CS -> C
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("CS")["nodes"] = [jjnode.at("C")["node"]];
    }
  },
  "C#0": (node, dir, { scope, jctx }) => {
    // C -> E :cop E
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("C")["node"] = {
        type: "COND",
        value: jjnode.at(":cop")["lex"],
        children: [jjnode.at("E#0")["node"], jjnode.at("E#1")["node"]],
      };
    }
  },
  "E#0": (node, dir, { scope, jctx }) => {
    // E -> E :top T
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("E#0")["node"] = {
        type: "BIN_OP",
        value: jjnode.at(":top")["lex"],
        children: [jjnode.at("E#1")["node"], jjnode.at("T")["node"]],
      };
    }
  },
  "E#1": (node, dir, { scope, jctx }) => {
    // E -> T
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("E#0")["node"] = jjnode.at("T")["node"];
    }
  },
  "T#0": (node, dir, { scope, jctx }) => {
    // T -> T :fop U
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("T#0")["node"] = {
        type: "BIN_OP",
        value: jjnode.at(":fop")["lex"],
        children: [jjnode.at("T#1")["node"], jjnode.at("U")["node"]],
      };
    }
  },
  "T#1": (node, dir, { scope, jctx }) => {
    // T -> U
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("T#0")["node"] = jjnode.at("U")["node"];
    }
  },
  "U#0": (node, dir, { scope, jctx }) => {
    // U -> :top P
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("U#0")["node"] = {
        type: "UN_OP",
        value: jjnode.at(":top")["lex"],
        children: [jjnode.at("P")["node"]],
      };
    }
  },
  "U#1": (node, dir, { scope, jctx }) => {
    // U -> P
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("U")["node"] = jjnode.at("P")["node"];
    }
  },
  "P#0": (node, dir, { scope, jctx }) => {
    // P -> F :pow P
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("P#0")["node"] = {
        type: "BIN_OP",
        value: jjnode.at(":pow")["lex"],
        children: [jjnode.at("F")["node"], jjnode.at("P#1")["node"]],
      };
    }
  },
  "P#1": (node, dir, { scope, jctx }) => {
    // P -> F
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("P")["node"] = jjnode.at("F")["node"];
    }
  },
  "F#0": (node, dir, { scope, jctx }) => {
    // F -> :id
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("F")["node"] = {
        type: "VAR",
        value: jjnode.at(":id")["lex"],
      };
    }
  },
  "F#1": (node, dir, { scope, jctx }) => {
    // F -> :num
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("F")["node"] = {
        type: "NUM",
        value: jjnode.at(":num")["lex"],
      };
    }
  },
  "F#2": (node, dir, { scope, jctx }) => {
    // F -> :lpar E :rpar
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("F")["node"] = jjnode.at("E")["node"];
    }
  },
  "F#3": (node, dir, { scope, jctx }) => {
    // F -> :id :lpar AL :rpar
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("F")["node"] = {
        type: "FUNC",
        value: jjnode.at(":id")["lex"],
        children: jjnode.at("AL")["nodes"],
      };
    }
  },
  "AL#0": (node, dir, { scope, jctx }) => {
    // AL -> AL :comma E
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("AL")["nodes"] = [
        ...jjnode.at("AL")["nodes"],
        jjnode.at("E")["node"],
      ];
    }
  },
  "AL#1": (node, dir, { scope, jctx }) => {
    // AL -> E
    const jjnode = jctx.getNodeCtx(node);
    if (dir === "up") {
      jjnode.at("AL")["nodes"] = [jjnode.at("E")["node"]];
    }
  },
};
