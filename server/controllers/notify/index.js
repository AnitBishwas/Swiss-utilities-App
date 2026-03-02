import { isValidPhoneNumber } from "libphonenumber-js";
import {
  getShopifyCustomerDetailsViaPhone,
  getShopifyProductInfoViaVariantId,
} from "./shopify.js";
import CustomerModel from "../../../utils/models/Notify/Customer.js";
import SubscriptionModel from "../../../utils/models/Notify/Subscription.js";
import { createMoengageEvent } from "./moe.js";

const createNotificationSubscription = async ({ shop, phone, variants }) => {
  try {
    const isPhoneNumberValid = isValidPhoneNumber(phone, "IN");
    if (!isPhoneNumberValid) {
      throw new Error("Invalid phone number");
    }
    let normalisedPhone = phone.includes("+91") ? phone : `+91${phone}`;
    const customerInfo = await getShopifyCustomerDetailsViaPhone(
      shop,
      normalisedPhone
    );
    for(let i = 0; i < variants.length; i++){
      let variantId = variants[i];
      const productInfo = await getShopifyProductInfoViaVariantId(
        shop,
        variantId
      );
      if (!productInfo) {
        throw new Error("Failed to get product info");
      }
      const customer = await CustomerModel.findOneAndUpdate(
        { phone: normalisedPhone },
        {
          ...customerInfo,
        },
        {
          new: true,
          upsert: true,
        }
      ).lean();
      const subscription = await SubscriptionModel.create({
        variantId: productInfo.variantId,
        variantTitle: productInfo.variantTitle,
        productId: productInfo.productId,
        productTitle: productInfo.productTitle,
        imageUrl: productInfo.imageUrl,
        shopifyCustomerId: customer.shopifyId || null,
        status: "active",
        customerId: customer._id.toString(),
        requestedAt: new Date().toISOString(),
      });
      await createMoengageEvent({
        eventName: "notify_me",
        customerPhone: normalisedPhone,
        params: {
          variantId: productInfo.variantId,
          variantTitle: productInfo.variantTitle,
          productId: productInfo.productId,
          productTitle: productInfo.productTitle,
          shopifyCustomerId: customer.shopifyId || null,
          imageUrl: productInfo.imageUrl,
          requestedAt: new Date().toISOString(),
          ...customer,
        },
      });
    }
  } catch (err) {
    throw new Error(
      "Failed to create notification subscription reason -->" + err.message
    );
  }
};
export { createNotificationSubscription };
