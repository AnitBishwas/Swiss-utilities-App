import mongoose from "mongoose";

const variantSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    mrp: {
      type: Number,
    },
    price: {
      type: Number,
    },
    id: {
      type: String,
      required: true,
    },
    productId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const VariantModel = mongoose.model("Variant", variantSchema);

export default VariantModel;
