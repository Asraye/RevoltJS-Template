const { Client } = require("revolt.js");
const config = require("./config.json");
const registerCommands = require("./utils/loader.js");

const client = new Client();
const cooldowns = new Map();

const commands = registerCommands("./commands");
client.commands = commands;

client.on("ready", () => {
  console.info(`✅ Logged in as ${client.user?.username}!`);

  client.api.patch("/users/@me", {
    status: {
      text: "Template made by Asraye",
      presence: "Online",
    },
  });
});

client.on("messageCreate", async (msg) => {
  if (!msg.content?.startsWith(config.prefix) || msg.author.bot) return;

  const args = msg.content.slice(config.prefix.length).trim().split(/\s+/);
  const cmdName = args.shift().toLowerCase();

  const command = client.commands.get(cmdName);
  if (!command) return;

  const now = Date.now();
  const key = `${msg.authorId}:${command.name}`;
  const cooldownTime = (config.cooldownSeconds || 3) * 1000;

  if (cooldowns.has(key)) {
    const timeElapsed = now - cooldowns.get(key);
    if (timeElapsed < cooldownTime) {
      const timeLeft = ((cooldownTime - timeElapsed) / 1000).toFixed(1);
      try {
        await msg.reply(`⏳ You're on cooldown! Try again in ${timeLeft}s.`);
      } catch {
        // Prevents crashes when the bot can't send messages due to missing permissions
      }
      return;
    }
  }

  cooldowns.set(key, now);
  setTimeout(() => cooldowns.delete(key), cooldownTime);

  try {
    await command.execute(msg, args, client);
  } catch (err) {
    console.error(`❌ Error running command "${cmdName}":`, err);
    try {
      await msg.reply("❌ An error occurred while executing the command.");
    } catch {
        // Prevents crashes when the bot can't send messages due to missing permissions
    }
  }
});

client.loginBot(config.token);

// Please forgive me for this cardinal sin, but, this is the only way to make the damned bot not go down randomly 24/7
process.on("unhandledRejection", (reason, p) => {
  console.log(" [Error_Handling] :: Unhandled Rejection/Catch");
  console.log(reason, p);
});
process.on("uncaughtException", (err, origin) => {
  console.log(" [Error_Handling] :: Uncaught Exception/Catch");
  console.log(err, origin);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log(" [Error_Handling] :: Uncaught Exception/Catch (MONITOR)");
  console.log(err, origin);
});
