import mongoose from "mongoose";

const collectionDiscontSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    title: String,
    productsCount: String,
    image: String,
    discount: Number,
  },
  {
    timestamps: true,
  }
);
const CollectionDiscount = mongoose.model(
  "Collection_Discount",
  collectionDiscontSchema
);
export default CollectionDiscount;
