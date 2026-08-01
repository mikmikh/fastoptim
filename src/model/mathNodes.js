export function mathFormatNode(root) {
  const { type, value, children } = root;
  const cs = children?.map((c) => mathFormatNode(c)) ?? [];
  if (type === "FUNC") {
    return `${value}(${cs.join(",")})`;
  } else if (type === "BIN_OP") {
    return `${cs[0]}${value}${cs[1]}`;
  } else if (type === "COND") {
    return `${cs[0]} ${value} ${cs[1]}`;
  } else if (type === "UN_OP") {
    return `${value}(${cs[0]})`;
  } else if (type === "NUM" || type === "VAR") {
    return `${value}`;
  } else if (type === "PROBLEM") {
    cs.splice(1, 0, value);
    return cs.join("\n");
  } else {
    return `${value}` + cs.join(" ");
  }
}
