import { v4 as uuidv4 } from "uuid";
import UserModel from "../../../utils/models/wishlist/User.js";
import ItemModel from "../../../utils/models/wishlist/Item.js";
import {
  getCustomerInfoFromShopify,
  getShopifyProductVariantInfo,
  getVariantAvaialability,
} from "./shopify.js";

/**
 * Initialise new customer
 * @typedef {object}
 * @property {string} customerId - shopify customer id
 * @property {string} shop - shopify store handle EX - swiss-local-dev.myshopify.com
 * @returns {object} user object
 */

const initNewUser = async ({ customerId, shop }) => {
  try {
    let user = null;
    if (!customerId) {
      console.log('intialising new user here')
      user = new UserModel({
        uuid: uuidv4(),
      });
      (await user.save()).toObject();
    }
    if (customerId) {
      const customerInfo = await getCustomerInfoFromShopify({
        shop,
        customerId,
      });
      user = new UserModel({
        customerId,
        firstName: customerInfo.firstName,
        lastName: customerInfo.lastName,
        phone: customerInfo.phone,
        email: customerInfo.email,
      });
      await user.save().toObject();
    }
    return user;
  } catch (err) {
    throw new Error("Failed to init new customer reason -->" + err.message);
  }
};

/**
 * Get wishlit items for user
 * @typedef {object}
 * @property {string} uuid - unique user id
 * @property {string} customerId - shopify customer id
 * @property {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 * @return {array} - list of wishlised items
 */
const getWishlistItems = async ({ uuid, customerId, shop }) => {
  try {
    if (!uuid && !customerId) {
      throw new Error(
        "To get wishlist items either uuid or customerId is required"
      );
    }
    let condition = {};
    if (customerId) {
      condition["customerId"] = customerId;
    } else {
      condition["uuid"] = uuid;
    }
    let wishlistItems = await ItemModel.find(condition)
      .lean()
      .sort({ updatedAt: -1 });
    let items = [];
    for (let i = 0; i < wishlistItems.length; i++) {
      let item = wishlistItems[i];
      const variantAvailable = await getVariantAvaialability({
        variantId: item.variantId,
        shop,
      });
      let updatedItem = {
        ...item,
        available: variantAvailable,
      };
      items.push(updatedItem);
    }
    return items;
  } catch (err) {
    throw new Error("Failed to get wishlisted items reason -->" + err.message);
  }
};

/**
 * Add item to wishlist
 * @typedef {object} payload
 * @property {string} productId - shopify product id
 * @property {string} variantId - shopify variant id
 * @property {string} uuid - uuid for customer identification
 * @property {string} customerId - shopify customer id Note : either customerId or uuid (one must be there)
 * @property {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const addItemToWishlist = async ({
  productId,
  variantId,
  customerId,
  uuid,
  shop,
}) => {
  try {
    const variantInfo = await getShopifyProductVariantInfo({ shop, variantId });
    let conditions = {
      productId,
      variantId,
    };
    if (customerId) {
      conditions["customerId"] = customerId;
    } else {
      conditions["uuid"] = uuid;
    }
    let updates = {
      productId: variantInfo.productId,
      variantId: variantInfo.id,
      title: variantInfo.title,
      compare_at_price: variantInfo.compareAtPrice,
      productHandle: variantInfo.productHandle,
      price: variantInfo.price,
      customerId: customerId || null,
      uuid: uuid || null,
    };
    const item = await ItemModel.findOneAndUpdate(conditions, updates, {
      upsert: true,
      new: true,
    }).lean();
    return item;
  } catch (err) {
    console.log(err);
    throw new Error("Failed to add item to wishlistb reason -->" + err.message);
  }
};

const removeItemFromWishlist = async ({
  customerId,
  uuid,
  productId,
  variantId,
}) => {
  try {
    let conditions = {
      productId,
      variantId,
    };
    if (customerId) {
      conditions["customerId"] = customerId;
    }
    if (uuid) {
      conditions["uuid"] = uuid;
    }
    const removeItem = await ItemModel.findOneAndDelete(conditions).lean();
    return removeItem;
  } catch (err) {
    console.log(err);
    throw new Error(
      "Failed to remove item from wishlist reason -->" + err.message
    );
  }
};

/**
 * Clear items for user
 * @typedef {object} payload
 * @property {string} customerId - shopify customer id
 * @property {string} uuid - uuid for customer identification
 */
const clearItemsForUser = async ({ customerId, uuid }) => {
  try {
    let condition = {};
    if (customerId) {
      condition["customerId"] = customerId;
    } else {
      condition["uuid"] = uuid;
    }
    const deleteItems = await ItemModel.deleteMany(condition);
    return deleteItems;
  } catch (err) {
    throw new Error("Failed to clear items for user reason -->" + err.message);
  }
};
export {
  initNewUser,
  getWishlistItems,
  addItemToWishlist,
  removeItemFromWishlist,
  clearItemsForUser,
};
