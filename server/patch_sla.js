const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "controllers", "dashboardController.js");
let content = fs.readFileSync(filePath, "utf8");

const replacement = `      const addDays = (d, days) => {
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
      };`;

// Use a more relaxed regex that ignores whitespace and line ending differences
const pattern =
  /const deptDeadlines = \{[\s\S]*?GRAPHIC: Math\.max\(createdAtTime, dueDateVal - 4 \* 24 \* 60 \* 60 \* 1000\),[\s\S]*?STOCK: Math\.max\(createdAtTime, dueDateVal - 3 \* 24 \* 60 \* 60 \* 1000\),[\s\S]*?PRODUCTION: Math\.max\([\s\S]*?createdAtTime,[\s\S]*?dueDateVal - 2 \* 24 \* 60 \* 60 \* 1000,?[\s\S]*?\),?[\s\S]*?QC: Math\.max\(createdAtTime, dueDateVal - 1 \* 24 \* 60 \* 60 \* 1000\),?[\s\S]*?\};/g;

const newContent = content.replace(pattern, replacement);

if (newContent === content) {
  console.log("No matches found.");
} else {
  fs.writeFileSync(filePath, newContent, "utf8");
  console.log("File patched successfully.");
}
