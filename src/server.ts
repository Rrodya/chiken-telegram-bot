const dotenv = require("dotenv");

import messages from "./senc"
import { Context } from "telegraf";
import { Telegraf } from "telegraf";
import UserController from "./Controllers/UserController"
import { getRandomLength } from "./module";
import mongoose from "mongoose";
import { message } from "telegraf/filters";

// dotenv.config({path: '/var/www/chiken-telegram-bot/.env'});
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

bot.command("penis", async (ctx: Context) => {
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
            ? ctx.reply(`Харош. хуй вырос на ${ans.data.change} см. Теперь ${ans.data.currentLength} см`) 
            : ctx.reply(`Ныа лох. хуй уменьшился на ${Math.abs(ans.data.change)} см. Теперь ${ans.data.currentLength} см`) 
        }
      } else if(user.status == false && user.message == "time limit") {
        ctx.reply("А все пидар, дрочить больше нельзя, жди " + user.time)
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


bot.command("topObrez", async (ctx: Context) => {
  try {
    if (ctx.chat?.id) {
      const users = await UserController.getTopObrez(ctx.chat.id);
      if (users && users.length > 0) {
        ctx.reply("top score евреев: \n" + users);
      }
    }
  } catch (error) {
    console.log("Error get top obrez ", error)
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



bot.on("text", async (ctx: Context) => {
  console.log(ctx.message?.text);
  if (ctx.message?.text.split(" ")[0] !== "/обрезать") {
    console.log("not");
    return;
  }
  const userName1 = ctx.message?.text.split(" ")[1];
  const user2Id = ctx.from?.id;
  const spiztedLength = Number(ctx.message?.text.split(" ")[2])
  const chatId = ctx.chat?.id;
  if(chatId && user2Id && spiztedLength) {
    const data  = await UserController.spizdet(userName1, user2Id, chatId, spiztedLength);
    
    if (!data.status) {
      if (data.message === "User not found") {
        ctx.reply("Пользователь с таким именем не найден")
      } else if (data.message === "Length is zero") {
        ctx.reply("У вас же хуя даже нет какие дуэли");
      }
    } else {
      const winner = data.data;
      ctx.reply(`${winner.winner.login} сделал обрезание ${winner.loser.login} на целых ${winner.length} см`)
    }
    
    // console.log(user);
  } else {
    ctx.reply("Неправильно введена команда")
  }
})




bot.hears

bot.launch();
