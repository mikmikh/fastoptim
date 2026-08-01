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
  } else if (type === "OPTIM") {
    return `minimize ${cs[0]} st. ${cs.slice(1).join(' , ')}`;
  } else {
    return `${value}` + cs.join(" ");
  }
}
