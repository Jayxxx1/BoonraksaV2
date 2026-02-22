import os
import re

file_path = r"d:\BoonraksaSystem\server\controllers\dashboardController.js"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# Logic to replace the first block (getSLAKPIs)
# Search for the specific pattern including the multi-line PRODUCTION part
target1 = """      const dueDate = new Date(order.dueDate);
      const bufferDays = parseInt(order.slaBufferLevel || 0);
      const internalDeadline = new Date(dueDate);
      internalDeadline.setDate(internalDeadline.getDate() - bufferDays);

      const deptDeadlines = {
        STOCK: new Date(internalDeadline).getTime() - 5 * 24 * 60 * 60 * 1000,
        GRAPHIC: new Date(internalDeadline).getTime() - 4 * 24 * 60 * 60 * 1000,
        PRODUCTION:
          new Date(internalDeadline).getTime() - 2 * 24 * 60 * 60 * 1000,
        QC: new Date(internalDeadline).getTime() - 0.5 * 24 * 60 * 60 * 1000,
      };"""

# Normalize target to handle potential \r\n or \n
target1_alt = target1.replace("\n", "\r\n")

replacement = """      const createdAtTime = new Date(order.createdAt).getTime();
      const dueDateVal = new Date(order.dueDate).getTime();

      const deptDeadlines = {
        GRAPHIC: Math.max(createdAtTime, dueDateVal - 4 * 24 * 60 * 60 * 1000),
        STOCK: Math.max(createdAtTime, dueDateVal - 3 * 24 * 60 * 60 * 1000),
        PRODUCTION: Math.max(createdAtTime, dueDateVal - 2 * 24 * 60 * 60 * 1000),
        QC: Math.max(createdAtTime, dueDateVal - 1 * 24 * 60 * 60 * 1000),
      };"""

if target1 in content:
    content = content.replace(target1, replacement)
elif target1_alt in content:
    content = content.replace(target1_alt, replacement)
else:
    print("Error: Target 1 not found")
    # Try even more flexible search
    import re
    # Match the block even if whitespace differs slightly
    pattern = r"const dueDate = new Date\(order\.dueDate\);.*?const deptDeadlines = \{.*?STOCK:.*?GRAPHIC:.*?PRODUCTION:.*?QC:.*?\};"
    if re.search(pattern, content, re.DOTALL):
        print("Regex match found for Target 1")
        # We'll use a safer regex replacement if needed
    else:
        print("Regex match failed for Target 1")

# Use regex for both targets to be safe
patterns = [
    (r"const dueDate = new Date\(order\.dueDate\);.*?const deptDeadlines = \{.*?STOCK:.*?GRAPHIC:.*?PRODUCTION:.*?QC:.*?\};", replacement),
]

for pattern, repl in patterns:
    content = re.sub(pattern, repl, content, flags=re.DOTALL)

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)

print("Patch applied successfully")
