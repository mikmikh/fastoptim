
export function unconstrain(problemRoot) {
  // obj, ...constraints
  // obj -> f(x)
  // == -> lhs - rhs == 0 -> h_i^2
  // <= -> lhs - rhs <= 0 -> (max(0, g_j))^2
  // >= -> rhs - lhs <= 0 -> (max(0, g_j))^2
  // Pp(x) = f(x) + pSum
  const f = problemRoot.children[0];
  const constraints = problemRoot.children.slice(1);
  const gs = constraints.map((constraint) => {
    const { value: op, children } = constraint;
    let h_node = null;
    if (op === "=" || op === "<=" || op === "<") {
      h_node = {
        type: "BIN_OP",
        value: "-",
        children: [...children],
      };
    } else if (op === ">=" || op === ">") {
      h_node = {
        type: "BIN_OP",
        value: "-",
        children: [...children].reverse(),
      };
    } else {
      throw new Error(`Unknown node op: "${op}"`);
    }

    if (op !== "=") {
      h_node = {
        type: "FUNC",
        value: "max",
        children: [
          {
            type: "NUM",
            value: "0",
          },
          h_node,
        ],
      };
    }
    const squared_node = {
      type: "BIN_OP",
      value: "^",
      children: [
        h_node,
        {
          type: "NUM",
          value: "2",
        },
      ],
    };
    return squared_node;
  });

  const gs_sum_node = gs.reduce((s, g) => ({
    type: "BIN_OP",
    value: "+",
    children: [s, g],
  }));
  const p_gs_node = {
    type: "BIN_OP",
    value: "*",
    children: [
      {
        type: "VAR",
        value: "p",
      },
      gs_sum_node,
    ],
  };
  const res = {
    type: "BIN_OP",
    value: "+",
    children: [f, p_gs_node],
  };
  return res;
}
