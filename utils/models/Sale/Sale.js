import mongoose from "mongoose";

const saleSchema = new mongoose.Schema({
  state: {
    type: String,
    enums: ["active", "disabled"],
    required: true,
  },
  status: {
    type: String,
    enums: ["progress", "completed", "failed"],
    required: true,
  },
  message: {
    type: String,
  },
  collection: {
    title: {
      type: String,
      required: true,
    },
    image: String,
    id: {
      type: Number,
      required: true,
    },
    productsCount: Number,
  },
  tag: {
    type: String,
  },
});

const SaleModel = mongoose.model("Sale", saleSchema);

export default SaleModel;
