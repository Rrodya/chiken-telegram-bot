import { log } from "console";
import {Chat, User} from "../Models/User";
import { msToTime, spiztedPenis } from "../module";

const TIME = 36000000;
// const TIME = 1000;
// const OBREZ_TIME = 300000;
// const OBREZ_TIME = 1000;
const PROTECT_TIME = 7200000;

interface IUser {
  id: number;
  login: string;
  length?: number;
  lastgrow?: number;
  obrezWin?: number;
  lastObrez? : number;
  lengthObrez?: number;
  lastProtect?: number;
}

class UserController { 
  async create(userReq: IUser, chatId: number) {
    try {
      const {id, login} = userReq;
      const telegram_chat_id = chatId;

      let chat = await this.createChat(telegram_chat_id);

      if(!chat) {
        console.log("Chat not founrt");
      }

      chat = await Chat.findOne({telegram_id: chatId}).populate("users");

      let candidate = await User.findOne({telegram_id: id});  
      const userExistInChat = chat && chat.users.some((u: any) => {
        return u.telegram_id == id
      });


      const time = new Date().getTime(); 

      const user = {
        telegram_id: id,
        login: login,
        length: 0,
        lastgrow: time,
        obrezWin: 0,
        lastObrez: 0,
        lengthObrez: 0,
        lastProtect: 0
      } 


      if (!userExistInChat) {
        const createdUser = await new User(user);
        await createdUser.save();

        chat.users.push(createdUser._id);
        await chat.save();
        
        return { status: true, message: "user created"}
      }


      // if (!candidate || !chat.users.includes(candidate._id)) {
      //   const createdUser = await new User(user);
      //   await createdUser.save();

      //   chat.users.push(createdUser._id);
      //   await chat.save();
        
      //   return { status: true, message: "user created"}
      // }


      if (user.lastgrow - candidate.lastgrow < TIME) {
        return { status: false, message: "time limit", time: msToTime(TIME - (user.lastgrow - candidate.lastgrow))}
      }

      user.length = candidate.length;
      user.obrezWin = candidate.obrezWin;

      candidate = await User.findOneAndUpdate({telegram_id: id}, user);
      candidate.save();

      return {status: true, message: "user exist"};
      
    } catch (error) {
      console.log("Error with creating user, " + error)
      return {status: false, message: "error creating user"};
    }
  }

  async updateLength(info: {length: number, id: number}, chatId: number) {
    try {
      const { length, id } = info;
      const chat = await Chat.findOne({telegram_id: chatId}).populate("users");
      const user = chat.users.find((u: any) => u.telegram_id === id);
      const updateUser = {
        telegram_id: user.telegram_id,
        login: user.login,
        length: user.length,
        lastgrow: user.lastgrow,
        obrezWin: user.obrezWin || 0,
        lastObrez: user.lastObrez || 0,
        lengthObrez: user.lengthObrez || 0,
        lastProtect: user.lastProtect || 0,
      }
      
      let change = updateUser.length;
      change = change + length;

      if (change > 0) {
        updateUser['length'] = change;
      } else {
        updateUser['length'] = 0;
      }

      await User.updateOne({_id: user._id}, updateUser);
      return { status: true, message: "success", data: {
        currentLength: updateUser.length,
        change: length
      }}  
    } catch (error) {
      console.log('Error change length ' + error);
      return { status: false }
    }
  }

  async createChat(chatId: number) {
    try {
      let chat = await Chat.findOne({ telegram_id: chatId})

      if (!chat) {
        chat = new Chat({
          telegram_id: chatId,
          users: [],
        })

        await chat.save();
        return chat;
      }
      
      return chat;
      
    } catch (error) {
      console.log("Error with creating chat: ", error);
      return null;
    }
  }


  async getTop(chatId: number) {
    try {
      const chat = await Chat.findOne({telegram_id: chatId}).populate("users");
      const users = chat.users;
      
      users.sort((a:any,  b: any) => b.length - a.length);
      const topUsers = users.map((user: any, index: number) => `${index + 1}. ${user.login} - ${user.length} см.`).join('\n');

      return topUsers;
    } catch (error) {
      console.log("Error get top: ", error);
    }
  }

  async spizdet(username1: string, user2id: number, chatId: number) {
    try {
      const chat = await Chat.findOne({telegram_id: chatId}).populate("users");
      const users = chat.users;
      const foundUser = users.find((user: any) => user.login === username1);      
      const foundUser2 = users.find((user: any) => user.telegram_id === user2id);
      const time = new Date().getTime();
      const winner: any = {
        winner: {},
        loser: {},
        length: 0,
      }

      if (!foundUser || !foundUser2) {
        return { status: false, message: "User not found"}
      }

      const updateFoundUser1 = {
        telegram_id: foundUser.telegram_id,
        login: foundUser.login,
        length: foundUser.length,
        lastgrow: foundUser.lastgrow,
        obrezWin: foundUser.obrezWin,
        lastObrez: foundUser.lastObrez,
        lengthObrez: foundUser.lengthObrez,
        lastProtect: foundUser.lastProtect
      }

      const updateFoundUser2 = {
        telegram_id: foundUser2.telegram_id,
        login: foundUser2.login,
        length: foundUser2.length,
        lastgrow: foundUser2.lastgrow,
        obrezWin: foundUser2.obrezWin,
        lastObrez: time,
        lengthObrez: foundUser2.lengthObrez,
        lastProtect: foundUser2.lastProtect
      }

      const useObrezTime = foundUser2.length * 10000

      if (updateFoundUser2.lastObrez - foundUser2.lastObrez < useObrezTime) {
        return { status: false, message: "time limit", time: msToTime(useObrezTime - (updateFoundUser2.lastObrez - foundUser2.lastObrez))}
      }

      if(updateFoundUser1.length == 0 || updateFoundUser2.length == 0) {
        return { status: false, message: "Length is zero" }
      }

      if (time - foundUser.lastProtect < PROTECT_TIME) {        
        return { status: false, message: "User is protected", data: `${foundUser.login} под пенисным барьером еще ${msToTime(PROTECT_TIME - (time - foundUser.lastProtect))}`} 
      }

      

      // if (spiztedLength > updateFoundUser2.length) {
      //   spiztedLength = updateFoundUser2.length;
      // }

      // if (spiztedLength > updateFoundUser1.length || spiztedLength > updateFoundUser2.length) {
      //   if (updateFoundUser1.length > updateFoundUser2.length) {
      //     spiztedLength = updateFoundUser2.length
      //   } else {
      //     spiztedLength = updateFoundUser1.length
      //   }
      // }

      const { winnerNum } = spiztedPenis(updateFoundUser1.length, updateFoundUser2.length, foundUser.telegram_id, foundUser2.telegram_id);


      let length1 = updateFoundUser1.length;
      let length2 = updateFoundUser2.length;

      let winLength = winnerNum == 1 ? length2 : length1

      const minValue = winLength * 0.1;
      const maxValue = winLength * 0.5;

      const spiztedLength = Math.round((Math.random() * (maxValue - minValue + 1)) + minValue);
      console.log(spiztedLength);

      if (winnerNum == 1) {
        length1 = length1 + spiztedLength;
        length2 = length2 - spiztedLength;
      } else {
        length1 = length1 - spiztedLength;
        length2 = length2 + spiztedLength
      }
      

      updateFoundUser1.length = length1;
      updateFoundUser2.length = length2;

      if (updateFoundUser1.length > foundUser.length) {
        console.log(updateFoundUser1.lengthObrez);
        console.log(spiztedLength);
        updateFoundUser1.obrezWin = updateFoundUser1.obrezWin + 1;
        updateFoundUser1.lengthObrez = updateFoundUser1.lengthObrez + spiztedLength
      } else {
        updateFoundUser2.obrezWin = updateFoundUser2.obrezWin + 1;
        updateFoundUser2.lengthObrez = updateFoundUser2.lengthObrez + spiztedLength

      }

      const newUser1 = await User.findOneAndUpdate({_id: foundUser._id}, updateFoundUser1);
      const newUser2 = await User.findOneAndUpdate({_id: foundUser2._id}, updateFoundUser2);
      if (winnerNum == 1) {
        winner.winner = newUser1;
        winner.loser = newUser2;  
      } else {
        winner.winner = newUser2;
        winner.loser = newUser1;
      }
      winner.length = spiztedLength;

      return { status: true, message: "ok", data: winner};
    } catch (error) {
      console.log("Error, cannot found user: " + error);
      return { status: false, message: "in error"}
    }
  }

  async getTopObrez(chatId: number) {
    try {
      const chat = await Chat.findOne({telegram_id: chatId}).populate("users");
      const users = chat.users;
      
      users.sort((a:any,  b: any) => b.obrezWin - a.obrezWin);
      const topUsers = users.map((user: any, index: number) => `${index + 1}. ${user.login}: ${user.obrezWin} обрезаний`).join('\n');
      return topUsers;
    } catch (error) {
      console.log("Error get top obrez: ", error);
    }
  }

  async setLength (chatId: number, username: string, length: number) {
    try {
      const chat = await Chat.findOne({telegram_id: chatId}).populate("users");
      const user = chat.users.find((user: any) => user.login == username);
      if (!user) {
        return { status: false, message: "User not found"}
      }

      user.length = length;
      await user.save();

      // await User.updateOne({_id: user._id}, newUser);
      return { status: true, message: "User updated"}
    } catch (error) {
      console.log("Error set length: ", error);
    }
  }

  async getTopLengthObrez (chatId: number) {
    try {
      const chat = await Chat.findOne({telegram_id: chatId}).populate("users");
      const users = chat.users;
      
      users.sort((a:any,  b: any) => b.lengthObrez - a.lengthObrez);
      const topUsers = users.map((user: any, index: number) => `${index + 1}. ${user.login} - ${user.obrezWin} выиграл, ${user.lengthObrez} см. обрезал`).join('\n');

      return topUsers;
    } catch (error) {
      console.log("Error getTopLengthObrez: ", error);
    }
  }

  async getProtect (userId: number, chatId: number) {
    try {
      const chat = await Chat.findOne({telegram_id: chatId}).populate('users');
      const users = chat.users;
      const user = users.find((user: any) => user.telegram_id === userId);
      
      const time = new Date().getTime();

      if (!user) {
        return { status: false, message: "User not found"}
      }
      
      // console.log(user.lastProtect);
      // console.log(time);
      // console.log(time - user.lastProtect);
      // console.log(time - user.lastProtect < PROTECT_TIME);
      console.log("--------")
      console.log(time);
      if (user.lastProtect && time - user.lastProtect < PROTECT_TIME) {
        console.log(user.lastProtect);
        console.log(time);
        console.log(time - user.lastProtect)
        return { status: false, message: "Protect already exists", data: `Защите все еще установленна. Действие закончится через ${msToTime(PROTECT_TIME - (time - user.lastProtect))}`}
      }

      if (user.length < 10) {
        return { status: false, message: "Get protect unvailable"};
      }

      const newLength = Math.round(user.length * 0.9);

      const newUser = {
        telegram_id: user.telegram_id,
        login: user.login,
        length: newLength,
        lastgrow: user.lastgrow,
        obrezWin: user.obrezWin,
        lastObrez: user.lastObrez,
        lengthObrez: user.lengthObrez,
        lastProtect: time
      }

      console.log(newUser);
      
      const some = await User.findOneAndUpdate({telegram_id: newUser.telegram_id}, newUser);
      console.log(some);

      await user.save();

      return { status: true, message: "Set protect", data: newUser}
    } catch (error) {
      console.log("Error getDef: ", error);
    }
  }


}

export default new UserController();

// 400
// 800
// 900

// 800 - 1000 = -200
