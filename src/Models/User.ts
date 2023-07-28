import { model } from "mongoose";

const mongoose = require('mongoose');

// добавить чат, группу

const UserSchema = new mongoose.Schema({
  telegram_id: { type: Number, required: true },
  login: { type: String, required: true },
  length: { type: Number, required: true },
  lastgrow: { type: Number, required: false, default: 0 },
  obrezWin: { type: Number, required: false, default: 0 },  
  lastObrez: { type: Number, required: false, default: 0 },
  lengthObrez: { type: Number, required: false, default: 0}
})

const User = mongoose.model("User", UserSchema);

const ChatSchema = new mongoose.Schema({
  telegram_id: { type: Number, required: true },  
  users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User"}]
})

const Chat = mongoose.model("Chat", ChatSchema);

export { User, Chat };