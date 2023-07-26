import {Chat, User} from "../Models/User";
import { msToTime, spiztedPenis } from "../module";

const TIME = 3600000;
const OBREZ_TIME = 300000;

interface IUser {
  id: number;
  login: string;
  length?: number;
  lastgrow?: number;
  obrezWin?: number;
  lastObrez? : number;
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

  async spizdet(username1: string, user2id: number, chatId: number, spiztedLength: number) {
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
      spiztedLength = Math.round(spiztedLength);

      if (!foundUser || !foundUser2) {
        return { status: false, message: "User not found"}
      }

      const updateFoundUser1 = {
        telegram_id: foundUser.telegram_id,
        login: foundUser.login,
        length: foundUser.length,
        lastgrow: foundUser.lastgrow,
        obrezWin: foundUser.obrezWin,
        lastObrez: foundUser.lastObrez
      }

      const updateFoundUser2 = {
        telegram_id: foundUser2.telegram_id,
        login: foundUser2.login,
        length: foundUser2.length,
        lastgrow: foundUser2.lastgrow,
        obrezWin: foundUser2.obrezWin,
        lastObrez: time,
      }

      if (updateFoundUser2.lastObrez - foundUser2.lastObrez < OBREZ_TIME) {
        return { status: false, message: "time limit", time: msToTime(OBREZ_TIME - (updateFoundUser2.lastObrez - foundUser2.lastObrez))}
      }

      if(updateFoundUser1.length == 0 || updateFoundUser2.length == 0) {
        return { status: false, message: "Length is zero" }
      }

      if (spiztedLength > updateFoundUser2.length) {
        spiztedLength = updateFoundUser2.length;
      }

      if (spiztedLength > updateFoundUser1.length || spiztedLength > updateFoundUser2.length) {
        if (updateFoundUser1.length > updateFoundUser2.length) {
          spiztedLength = updateFoundUser2.length
        } else {
          spiztedLength = updateFoundUser1.length
        }
      }

      const { length1, length2, winnerNum } = spiztedPenis(updateFoundUser1.length, updateFoundUser2.length, spiztedLength, foundUser.telegram_id, foundUser2.telegram_id);

      updateFoundUser1.length = length1;
      updateFoundUser2.length = length2;

      if (updateFoundUser1.length > foundUser.length) {
        console.log('first win')
        updateFoundUser1.obrezWin = updateFoundUser1.obrezWin + 1;
      } else {
        console.log('second win')
        updateFoundUser2.obrezWin = updateFoundUser2.obrezWin + 1;
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
      return topUsers;
    } catch (error) {
      console.log("Error get top obrez: ", error);
    }
  }
}

export default new UserController();
