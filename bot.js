import { Bot } from "grammy";
import Database from "better-sqlite3";
import dotenv from "dotenv";

dotenv.config();

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error("Bot token was not found.");
  process.exit(1);
}

const db = new Database("todos.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

const addTodo = db.prepare("INSERT INTO todos (user_id, text) VALUES (?, ?)");
const listTodos = db.prepare(
  "SELECT id, text, done FROM todos WHERE user_id = ? ORDER BY id",
);
const markDone = db.prepare(
  "UPDATE todos SET done = 1 WHERE id = ? AND user_id = ?",
);
const removeTodo = db.prepare("DELETE FROM todos WHERE id = ? AND user_id = ?");

// ربات
const bot = new Bot(token);

bot.command("start", (ctx) => {
  ctx.reply("Bot is up! 🍓💖");
});

bot.command("add", (ctx) => {
  const info = addTodo.run(ctx.from.id, ctx.message.text.trim().slice(5));
  console.log(info);
  ctx.reply("Done ✅");
});

bot.command("list", (ctx) => {
  const data = listTodos.all(ctx.from.id);
  let msg = "";
  data.forEach((todo) => {
    msg += `${todo.id}. ${todo.text} ${todo.done ? "✅" : "❌"}\n`;
  });
  ctx.reply(msg);
});

bot.command("done", (ctx) => {
  const id = parseInt(ctx.message.text.trim().slice(6));
  if (id == null) {
    ctx.reply("Please provide a valid ID.");
  }
  const info = markDone.run(id, ctx.from.id);
  if (info.changes === 0) {
    ctx.reply("Todo not found or already done.");
  } else {
    ctx.reply("Marked as done ✅");
  }
});

bot.command("remove", (ctx) => {
  const id = ctx.message.text.trim().slice(8);
  const info = removeTodo.run(id, ctx.from.id);
  if (info.changes === 0) {
    ctx.reply("Todo not found.");
  } else {
    ctx.reply("Removed 🗑️");
  }
});

bot.on("message", (ctx) => ctx.reply("Sorry I don't understand messages!"));

bot.catch((err) => console.error("error:", err.error));

bot.start();
console.log("Starting the bot...");
