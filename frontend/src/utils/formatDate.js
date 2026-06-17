export const formatDate = (d) => {
  if (!d || typeof d !== "string") return "—";
  return d.split(" ").slice(0, 4).join(" ");
};
