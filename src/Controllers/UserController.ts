import User from "../Models/User";

const TIME = 1000;

interface IUser {
  id: number;
  login: string;
  length?: number;
  lastgrow?: number;
}

class UserController { 
  async create(userReq: IUser) {
    try {
      const {id, login} = userReq;

      let candidate = await User.findOne({telegram_id: id});

      const time = new Date().getTime(); 

      const user = {
        telegram_id: id,
        login: login,
        length: 0,
        lastgrow: time,
      } 

      if (!candidate) {
        const createdUser = await new User(user);
        await createdUser.save();
        
        return { status: true, message: "user created"}
      }

      if (user.lastgrow - candidate.lastgrow < TIME) {
        return { status: false, message: "time limit"}
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

  async updateLength(info: {length: number, id: number}) {
    try {
      const { length, id } = info;
      const user = await User.findOne({telegram_id: id})
      console.log(user);
      let change = user.length;
      change = change + length;

      if (change > 0) {
        user['length'] = change;
      } else {
        user['length'] = 0;
      }

      await User.updateOne({telegram_id: id}, user);
      return { status: true, message: "success", data: {
        currentLength: user.length,
        change: length
      }}  
    } catch (error) {
      console.log('Error change length ' + error);
      return { status: false }
    }
    
  }
}

export default new UserController();