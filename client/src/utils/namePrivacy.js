
/**
 * Determines the display name of a user based on the viewer's role and department.
 * Privacy Rule:
 * - Users can only see names of colleagues in the same department (Role).
 * - Privileged roles (ADMIN, EXECUTIVE, MARKETING, FINANCE) can see all names.
 * - If privacy applies, show "Role #ID" instead of Name.
 * 
 * @param {Object} targetUser - The user object whose name is to be displayed { id, name, role, code? }
 * @param {Object} currentUser - The currently logged-in user { id, role }
 * @returns {String} - The name to display
 */
export const getDisplayName = (targetUser, currentUser) => {
  if (!targetUser) return "-";
  if (!currentUser) return targetUser.name; // Fallback

  // 1. View own name: Always allowed
  if (targetUser.id === currentUser.id) return targetUser.name;

  // 2. Privileged Roles: Can see everyone
  const privilegedRoles = ["ADMIN", "EXECUTIVE", "MARKETING", "FINANCE", "SUPER_ADMIN"];
  if (privilegedRoles.includes(currentUser.role)) return targetUser.name;

  // 3. Same Role (Department): Can see each other
  // Mapping some roles that might be considered "Same Department" if needed, 
  // but usually Role == Department in this system.
  if (targetUser.role === currentUser.role) return targetUser.name;

  // 4. Privacy Mode: Hide Name
  // Start with Role specific label if available, else use generic Role string
  const roleLabels = {
    SALES: "ฝ่ายขาย",
    GRAPHIC: "ฝ่ายกราฟิก",
    STOCK: "ฝ่ายสต็อก",
    PRODUCTION: "ฝ่ายผลิต",
    SEWING_QC: "ฝ่ายตัดเย็บ/QC",
    DELIVERY: "ฝ่ายจัดส่ง",
    PURCHASING: "ฝ่ายจัดซื้อ",
  };
  
  const roleName = roleLabels[targetUser.role] || targetUser.role;
  // Use code if available, else use last 3 digits of ID
  const code = targetUser.salesNumber || targetUser.code || String(targetUser.id).padStart(3, '0').slice(-3);
  
  return `${roleName} #${code}`;
};
