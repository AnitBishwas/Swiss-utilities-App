import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
    },
    uuid: {
      type: String,
    },
    productId: {
      type: String,
      required: true,
    },
    productHandle: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    compare_at_price: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const ItemModel = mongoose.model("item", itemSchema);

export default ItemModel;
