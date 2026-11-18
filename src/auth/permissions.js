export const SUPER_ADMIN_EMAIL = "akhasannaeem@gmail.com";

export function getPermissions(role, email) {
  const isSuperAdmin = String(email || "").trim().toLowerCase() === SUPER_ADMIN_EMAIL;
  const isAdmin = role === "admin" || isSuperAdmin;
  return {
    isAdmin,
    isSuperAdmin,
    isAdvance: false,
    isAdvanceOrAdmin: isAdmin,
    isGeneral: !isAdmin,
  };
}
