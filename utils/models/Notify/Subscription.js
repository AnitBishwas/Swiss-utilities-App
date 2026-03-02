import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: true,
    },
    shopifyCustomerId: {
      type: String,
    },
    productId: {
      type: String,
      required: true,
    },
    variantId: {
      type: String,
      required: true,
    },
    productTitle: {
      type: String,
    },
    variantTitle: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "notified", "cancelled"],
      required: true,
    },
    requestedAt: {
      type: Date,
    },
    notifiedAt: {
      type: Date,
    },
    imageUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const SubscriptionModel = mongoose.model("Subcscription", subscriptionSchema);

export default SubscriptionModel;
