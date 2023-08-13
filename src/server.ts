const dotenv = require("dotenv");

import messages from "./senc"
import { Context, Markup, Telegraf, session, Scenes, Composer } from "telegraf";
import UserController from "./Controllers/UserController"
import { getRandomLength, msToTime } from "./module";
import mongoose from "mongoose";
const fs = require("fs");

// добавление доступ к переменным
dotenv.config({path: '/var/www/chiken-telegram-bot/.env'});
// dotenv.config();
try {

// токен бота и айди админа в телеграме
const token = process.env.TOKEN;
const admin = 755038810;
const adminIds = [755038810]

const COMMAND_TIME_LIMIT = 1000;   // Time limit in milliseconds (1 second)
const CONSECUTIVE_COMMAND_LIMIT = 5; // Number of consecutive rapid commands required for blocking
const BLOCK_DURATION = 3600000;     

if(!token) {
  throw new Error("Please insert a token before")
}

const data = {};


// подключение к базе
mongoose.connect(`mongodb://${process.env.DB_NAME}:${process.env.DB_PASSWORD}@127.0.0.1:${process.env.PORT}`, { })
  .then(() => console.log('⚡️ Connected to database!!!'))
  .catch(err => console.error('Error connecting to database', err));



let userData: any = {};

if (fs.existsSync('user_data.json')) {
    userData = JSON.parse(fs.readFileSync('user_data.json', 'utf8'));
}





const mainMenu = Markup.keyboard([
  ['/penis', '/top'],
  ['/topObrez', '/protect']
]).resize();
// создание бота
const bot = new Telegraf(token);

let counterCall = 0;

// Middleware to handle command execution
bot.use((ctx: any, next) => {
  try {
    let userData: any = {};
    if (fs.existsSync('user_data.json')) {
        userData = JSON.parse(fs.readFileSync('user_data.json', 'utf8'));
    }
  
    const userId = ctx.from.id;
    const currentTime = Date.now();
    const user = userData[userId] || { timestamp: 0, messageCount: 0, timeLimit: 0, consecutiveCommands: 0, blockedUntil: 0 };
    const timeDifference = currentTime - user.timestamp;
    const beforeCall = user.timestamp

    if (currentTime - beforeCall < 1000) {
      return;
    }
  

    user.timestamp = currentTime;
    user.messageCount++;
    user.timeLimit = COMMAND_TIME_LIMIT;
    userData[userId] = user;
    fs.writeFileSync('user_data.json', JSON.stringify(userData, null, 2));
    
    counterCall++;
    // Continue to process the command
    next();  
  } catch (error) {
    console.log("Error timeout")
  }
  
});

// команда запуска бота /start
bot.start((ctx: Context) => {
  ctx.reply(messages.welcome);
});

bot.command('menu', (ctx) => {
  ctx.reply('Here is the menu:', mainMenu);
});


//help
bot.help((ctx: Context) => {    
  ctx.reply(messages.help);
});

// penis команда для увеленчения длины
bot.command("penis", async (ctx: Context) => {
  try {
    // взять основные данные о пользователе кто отправил команду(айди, логин) а так же айди чата
    const id = ctx.message?.from.id;
    const login = ctx.message?.from.username;
    const chatId = ctx.chat?.id;
    
    if (!chatId) {
      console.log("Chat not fount");
      return;
    }

    if(id && login) {
      
      //создание пользователя в чате, а так же добавление чата в бд(если пользователь и чат существует ничего не изменится)
      const user = await UserController.create({id: id, login: login}, chatId);
      if(user.status == true) {
        // вызов модуля который вернет с 50% вероятностью отрицательное и положительное рандомное число от -1 до -15 и от 1 до 25
        let change = getRandomLength();
        // контроллер который обновит длину в базе данных для пользователя с id на длину length в чате chatId
        const ans: any = await UserController.updateLength({length: change, id: id}, chatId);

        // вывод соотвествующего сообщения относительно того уменшилась или увеличилась длинна 
        if(ans.status == true) {
          if(ans.data.chande > 100) {
            ctx.reply("ЕЕЕЕЕЕБААААТь чел ты нахуй джекпот выбил, шанс того что сейчас случилось: 0.005%. Везучий скатына, конгратилейшонс")
            return;
          }
          ans.data.change > 0 
            ? ctx.reply(`Харош. хуй вырос на ${ans.data.change} см. Теперь ${ans.data.currentLength} см`) 
            : ctx.reply(`Ныа лох. хуй уменьшился на ${Math.abs(ans.data.change)} см. Теперь ${ans.data.currentLength} см`) 
        }
      } else if(user.status == false && user.message == "time limit") {
        // возвращается в том случае если пользователь повторно вызвал команду меньше чем через час
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



// получить топ людей которые больше всех выиграли (забрали у дргих людей длину) с помощью команды /obrez
bot.command("topObrez", async (ctx: Context) => {
  try {
    if (ctx.chat?.id) {
      const users = await UserController.getTopLengthObrez(ctx.chat.id);
      
      if (users && users.length > 0) {
        ctx.reply("top score евреев: \n" + users);
      }
    }
  } catch (error) {
    console.log("Error get top obrez ", error)
  }
})

// команда возвращает топ пользователей в чате по длине
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


// команда которая принимает в себя /obrez логин число. с 50% вероятностью либо заберет у вызвающего команду
// длину которую он указал и присвоит ее тому кого кому пренедлежит логин, либо присвоим вызывающему длину и 
// заберет ее у того кому пренадлежит логин
bot.command("obrez", async (ctx: any) => {
  const userName1 = ctx.message?.text?.split(" ")[1];
  const user2Id = ctx.from?.id;
  const user2Username = ctx.from?.username;
  const spiztedLength = Number(ctx.message?.text.split(" ")[2])

  if (spiztedLength || ctx.message?.text?.split(" ").length > 2) {
    ctx.reply("Бро команда теперь без длины, просто ```/obrez " + userName1 + "```");
    return;
  }

  const chatId = ctx.chat?.id;
  if(chatId && user2Id) {
	 if (userName1 == user2Username) {
		 ctx.reply("К сожалению самому себе обрезание делать нельзя(");
		  return;
	 }
    const data  = await UserController.spizdet(userName1, user2Id, chatId);
    
    if (!data.status) {
      if (data.message === "User not found") {
        ctx.reply("Пользователь с таким именем не найден")
      } else if (data.message === "Length is zero") {
        ctx.reply("У вас же хуя даже нет какие дуэли");
      } else if (data.message === "time limit") {
        ctx.reply("Ты больше не можешь устраивать дуэль, жди: " + data.time);
      } else if (data.message == "User is protected") {
        ctx.reply(data.data);
      }
    } else {
      const winner = data.data;
      ctx.reply(`${winner.winner.login} сделал обрезание ${winner.loser.login} на целых ${winner.length} см`)
      // ctx.replyWithDocument({  url: "https://media.tenor.com/JbnLKar05tAAAAAC/anime-girl-light-blue-hair-anime.gif",
      //     filename: 'blashing.gif'})
    }
    
    // console.log(user);
  } else {
    ctx.reply("Неправильно введена команда")
  }
})

// команда для админа которая в ручню через /set login number может изменить в бд длину любого пользователя
bot.command("set", async (ctx: any) => {
  const username1 = ctx.message?.text?.split(" ")[1];
  const user2Id = ctx.from?.id;
  const user2Username = ctx.from?.username;
  const chatId = ctx.chat?.id
  const length = Number(ctx.message?.text.split(" ")[2])

  if(user2Id !== admin || !adminIds.includes(user2Id)) {
    ctx.reply("закрыто епта");
    return;
  }

  const data = await UserController.setLength(chatId, username1, length);
  console.log(data);
  if(data) {
    if(!data.status) {
      if (data?.message === "User not found") {
        ctx.reply("Такой пользователь не найден");
        return;
      }
    }
  }

  ctx.reply(`хуй пользователя ${username1} изменен на ${length}`);
});

bot.command("protect", async (ctx: any) => {
  try {
    const userId = ctx.from?.id;
    const chatId = ctx.chat?.id;

    if (userId && chatId) {
      const data = await UserController.getProtect(userId, chatId);

      if (data) {
        if (!data.status) {
          if(data.message === "Protect already exists") {
            ctx.reply(data.data);
          } else if (data.message == "Get protect unvailable") {
            ctx.reply("Получить защиту невозможно, недостаточно средств.")
          }        
        } else {
          
          ctx.reply("Пенисный барьер установлен ✨");
          ctx.replyWithDocument({  url: "https://media.tenor.com/IPMFkyVgf1sAAAAd/arcane-shield.gif",
          filename: 'magic-bareer.gif'})
          
          // ctx.reply("🍌");
        }
      }
    }
  } catch (error) {
    console.log("Error get protect: " + error);
  }
})



// bot.command("steal", (ctx: any) => {
//   try {
//     return ctx.reply("<b>Coke</b> or <i>Pepsi?</i>", {
//       parse_mode: "HTML",
//       ...Markup.inlineKeyboard([
//         Markup.button.callback("Coke", ""),
//         Markup.button.callback("Pepsi", "Pepsi"),
//       ]),
//     });
//   } catch (error) {
//     console.log("Error steal: " + error);
//   }
// })

bot.launch();

} catch (error) {
  console.log("Error: find bug")
}
