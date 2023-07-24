const dotenv = require("dotenv");

import messages from "./senc"
import { Context } from "telegraf";
import { Telegraf } from "telegraf";
import UserController from "./Controllers/UserController"
import { getRandomLength } from "./module";
import mongoose from "mongoose";
import { message } from "telegraf/filters";

dotenv.config();

const token = process.env.TOKEN;

if(!token) {
  throw new Error("Please insert a token before")
}

console.log(`mongodb://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@127.0.0.1:${process.env.PORT}`);

mongoose.connect(`mongodb://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@127.0.0.1:${process.env.PORT}`, { })
  .then(() => console.log('⚡️ Connected to database!!!'))
  .catch(err => console.error('Error connecting to database', err));

const bot = new Telegraf(token);

bot.start((ctx: Context) => {
  // создание в базе чата
  ctx.reply(messages.welcome);
});



bot.help((ctx: Context) => {    
  ctx.reply(messages.help);
});

bot.command("count", async (ctx: Context) => {
  try {
    const id = ctx.message?.from.id;
    const login = ctx.message?.from.username;
    const chatId = ctx.chat?.id;
    
    if (!chatId) {
      console.log("Chat not fount");
      return;
    }

    if(id && login) {
      // создание пользователей именно в этом чате, добавлять еще в поле айди чата
      const user = await UserController.create({id: id, login: login}, chatId);
      if(user.status == true) {
        let change = getRandomLength();

        const ans: any = await UserController.updateLength({length: change, id: id}, chatId);

        if(ans.status == true) {
          ans.data.change > 0 
            ? ctx.reply(`Вырос на ${ans.data.change} см. Теперь ${ans.data.currentLength} см`) 
            : ctx.reply(`Уменьшился на ${Math.abs(ans.data.change)} см. Теперь ${ans.data.currentLength} см`) 
        }
      } else if(user.status == false && user.message == "time limit") {
        ctx.reply("Ты уже играл")
      } else if(user.status == false && user.message == "user exist") {
        ctx.reply("Сорян какая-то ошибка с тобой хз. лох ты какой-то")
      }
    } else {
      console.log("Not found user")
    }
    
  } catch (error) {
    console.log("Some error: ", error)
  }
})

bot.command("top", async (ctx: Context) => {
  try {
    if (ctx.chat?.id) {
      const some = await UserController.getTop(ctx.chat.id);
      if (some) {
        ctx.reply(some);
      }
    }
  } catch (error) {
    console.log("Error get top " , error);
  }
})




bot.hears

bot.launch();