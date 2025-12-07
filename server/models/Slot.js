const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const SlotSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    content: String,
    posts: [
      {
        type: mongoose.Types.ObjectId,
        ref: "Post",
      },
    ],
    startTime: {
        type: Date,
        required: true,
      },
      endTime: {
        type: Date,
        required: true,
      },
  },
  { timestamps: true } 
);

const Slot = mongoose.model("Slot", SlotSchema);

module.exports = Slot;
