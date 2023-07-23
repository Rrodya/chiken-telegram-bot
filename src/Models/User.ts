const mongoose = require('mongoose');

// добавить чат, группу 

const UserSchema = new mongoose.Schema({
  telegram_id: { type: Number, required: true },
  login: { type: String, required: true },
  length: { type: Number, required: true },
  lastgrow: { type: Number, required: false, default: 0 },
})

export default mongoose.model("User", UserSchema);