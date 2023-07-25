import {Chat, User} from "../Models/User";

const TIME = 43200000;

interface IUser {
  id: number;
  login: string;
  length?: number;
  lastgrow?: number;
}

function msToTime(duration: number) {
    let seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    let Strhours = (hours < 10) ? "0" + hours : hours;
    let Strminutes = (minutes < 10) ? "0" + minutes : minutes;
    let Strseconds = (seconds < 10) ? "0" + seconds : seconds;

    return Strhours + ":" + Strminutes + ":" + Strseconds;
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

      user.length = candidate.length

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
        lastgrow: user.lastgrow
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
}

export default new UserController();
