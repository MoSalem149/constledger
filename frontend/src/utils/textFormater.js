export const addSpace = (text) => text.split("_").join(" ");

export function formatRole(role) {
  const rolesMap = {
    subcontractor: "Sub Contractor",
    main_contractor: "Main Contractor",
  };

  if (rolesMap[role]) return rolesMap[role];

  return role
    ?.replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}
