import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  customerId: {
    type: String,
  },
  uuid: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
  },
});

const UserModel = mongoose.model("User", userSchema);

export default UserModel;
