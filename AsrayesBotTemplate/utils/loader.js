const fs = require("fs");
const path = require("path");

function registerCommands(baseDir) {
  const commands = new Map();

  function walk(dir, categoryRoot = null) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        const newCategory = categoryRoot || file;
        walk(fullPath, newCategory);
      } else if (file.endsWith(".js")) {
        try {
          const command = require(path.resolve(fullPath)); 

          if (!command.name || typeof command.execute !== "function") {
            console.warn(`⚠️ Invalid command structure in ${file}`);
            continue;
          }

          command.category = command.category || categoryRoot || "Uncategorized";
          commands.set(command.name, command);

          if (Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              if (commands.has(alias)) {
                console.warn(`⚠️ Alias "${alias}" in ${file} already exists. Skipping.`);
                continue;
              }
              commands.set(alias, command);
            }
          }
        } catch (err) {
          console.error(`❌ Failed to load command at ${fullPath}:`, err);
        }
      }
    }
  }

  walk(path.resolve(baseDir)); 
  return commands;
}

module.exports = registerCommands;
