module.exports = {
  name: "ping",
  aliases: [],
  description: "Check bot latency",
  category: "Utility",

  execute: async (msg) => {
    const latency = Date.now() - new Date(msg.createdAt).getTime();
    await msg.reply(`🏓 Pong! Latency: ${latency}ms`);
  },
};
