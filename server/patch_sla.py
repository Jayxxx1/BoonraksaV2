import re

def patch_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Define the replacement block
    replacement = """      const addDays = (d, days) => {
        const date = new Date(d);
        date.setHours(18, 0, 0, 0);
        date.setDate(date.getDate() + days);
        return date.getTime();
      };
      const deptDeadlines = {
        GRAPHIC: Math.min(addDays(order.createdAt, 2), dueDateVal),
        STOCK: Math.max(createdAtTime, dueDateVal - 3 * 24 * 60 * 60 * 1000),
        PRODUCTION: Math.max(createdAtTime, dueDateVal - 2 * 24 * 60 * 60 * 1000),
        QC: Math.max(createdAtTime, dueDateVal - 1 * 24 * 60 * 60 * 1000),
      };"""

    # Multi-line regex to find the old deptDeadlines block
    # It accounts for varying indentation and potential line break differences
    pattern = r"const deptDeadlines = \{.*?GRAPHIC: Math\.max\(createdAtTime, dueDateVal - 4 \* 24 \* 60 \* 60 \* 1000\),.*?STOCK: Math\.max\(createdAtTime, dueDateVal - 3 \* 24 \* 60 \* 60 \* 1000\),.*?PRODUCTION: Math\.max\(.*?createdAtTime,.*?dueDateVal - 2 \* 24 \* 60 \* 60 \* 1000,.*?/?,.*?QC: Math\.max\(createdAtTime, dueDateVal - 1 \* 24 \* 60 \* 60 \* 1000\),.*?\};"
    
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    
    # Check if replacements were made
    if new_content == content:
        print("No changes were made. Pattern might not have matched.")
    else:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("File patched successfully.")

if __name__ == "__main__":
    patch_file("d:/BoonraksaSystem/server/controllers/dashboardController.js")
