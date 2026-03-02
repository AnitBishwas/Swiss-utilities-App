import mongoose from "mongoose";
import { parsePhoneNumberFromString } from "libphonenumber-js";

const customerSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
    },
    lastName: {
      type: String,
    },
    phone: {
      type: String,
      unique: true,
      validate: {
        validator: function (value) {
          const phoneNumber = parsePhoneNumberFromString(value);
          return phoneNumber && phoneNumber.isValid();
        },
        message: "Invalid phone number format",
      },
    },
    email: {
      type: String,
    },
    shopifyId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const CustomerModel = mongoose.model("customer", customerSchema);

export default CustomerModel;
