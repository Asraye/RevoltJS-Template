const config = require("../../config.json");

module.exports = {
  name: "help",
  aliases: ["commands"],
  description: "Display help for a specific command category.",
  category: "Utility",

  execute: async (msg, args, client) => {
    const commands = client.commands;
    const prefix = config.prefix;

    const categories = new Set();
    for (const cmd of commands.values()) {
      categories.add(cmd.category || "Uncategorized");
    }

    const categoryList = Array.from(categories)
      .map(cat => `• ${cat}`)
      .join("\n");

    const exitKeywords = new Set(["exit", "quit", "stop", "cancel"]);

    const askCategory = async () => {
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          client.off("messageCreate", onMessage);
          reject(new Error("timeout"));
        }, 30000);

        const onMessage = (response) => {
          if (
            response.authorId === msg.authorId &&
            response.channelId === msg.channelId
          ) {
            clearTimeout(timeout);
            client.off("messageCreate", onMessage);
            resolve(response.content.trim());
          }
        };

        client.on("messageCreate", onMessage);
      });
    };

    const findCategory = (input) => {
      input = input.toLowerCase();
      for (const cat of categories) {
        if (cat.toLowerCase() === input) return cat;
      }
      return null;
    };

    await msg.reply(
      `🧾 Please type a category to get help for, or type "exit" to quit:\n\n${categoryList}`
    );

    while (true) {
      let chosenInput;
      try {
        chosenInput = await askCategory();
      } catch (err) {
        if (err.message === "timeout") {
          await msg.reply("⌛ You took too long to respond. Please run the command again.");
          break;
        } else {
          console.error("Error during help command interaction:", err);
          await msg.reply("❌ An error occurred while fetching help.");
          break;
        }
      }

      if (!chosenInput) break;

      if (exitKeywords.has(chosenInput.toLowerCase())) {
        await msg.reply("👋 Exiting help.");
        break;
      }

      const chosenCategory = findCategory(chosenInput);
      if (!chosenCategory) {

        await msg.reply(
          `❌ Invalid category input detected. Exiting help command.`
        );
        break;
      }

      const filteredCommands = [];
      for (const cmd of commands.values()) {
        if (
          cmd.category === chosenCategory &&
          !filteredCommands.some(c => c.name === cmd.name)
        ) {
          filteredCommands.push(cmd);
        }
      }

      if (filteredCommands.length === 0) {
        await msg.reply(`No commands found for category: **${chosenCategory}**.`);
        continue;
      }

      const responseText =
        `📂 __**${chosenCategory} Commands**__\n` +
        "────────────────────\n" +
        filteredCommands
          .map(
            c =>
              `• \`${prefix}${c.name}\`` +
              (c.aliases?.length ? ` _(aliases: ${c.aliases.join(", ")})_` : "") +
              `\n  ↳ ${c.description}`
          )
          .join("\n") +
        "\n";

      await msg.reply(responseText);

      await msg.reply(
        `Would you like help with another category? Type a category name or "exit" to quit.`
      );
    }
  },
};