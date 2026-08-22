const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
  _id: { type: String },
  seq: { type: Number, default: 0 },
});

counterSchema.statics.next = async function (key) {
  const counter = await this.findByIdAndUpdate(
    key,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );

  return counter.seq;
};

module.exports = mongoose.model("Counter", counterSchema);
