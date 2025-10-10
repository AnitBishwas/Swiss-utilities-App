import { Router } from "express";
import UserModel from "../../../../utils/models/wishlist/User.js";
import {
  addItemToWishlist,
  clearItemsForUser,
  getWishlistItems,
  initNewUser,
  removeItemFromWishlist,
} from "../../../controllers/wishlist/index.js";
import cookie from "cookie";
import createBigQueryEvent from "../../../controllers/bigquery/index.js";
import logsStorage from "../../../controllers/logger/logsStorage.js";


const wishlistPublicRoute = Router();

wishlistPublicRoute.get("/init", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const { customerId } = req.query;
    const { uuid } = cookies;
    const shop = res.locals.user_shop;
    let conditions = {};
    if (customerId) {
      conditions["customerId"] = customerId;
    } else if (uuid) {
      conditions["uuid"] = uuid;
    }
    let user = null;
    if (customerId || uuid) {
      user = await UserModel.findOne(conditions);
    }
    if (!user) {
      user = await initNewUser({
        customerId: customerId,
        shop,
      });
      if (user.uuid) {
        res.setHeader(
          "Set-Cookie",
          cookie.serialize("uuid", user.uuid, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 60 * 60 * 24 * 90, // 90 days
            path: "/",
          })
        );
      }
    }
    let wishlistItems = await getWishlistItems({
      customerId: customerId,
      uuid: uuid,
      shop,
    });
    createBigQueryEvent({
      name: "wishlist_loaded",
      customer: customerId,
      items: wishlistItems,
    });
    res.status(200).send({
      ok: true,
      customer: customerId || false,
      items: wishlistItems,
    });
  } catch (err) {
    logsStorage({
      name: "Wishlist init issue",
      type: "error",
      message: "Failed to init wishlist reason -->" + err.message,
    });
    console.log("Failed to init wishlist reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});

wishlistPublicRoute.post("/add", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const { uuid } = cookies;
    const shop = res.locals.user_shop;
    let { productId, variantId, customerId } = req.body;
    if (!productId || !variantId) {
      throw new Error("Required parameters missing");
    }
    const addedItem = await addItemToWishlist({
      productId,
      variantId,
      customerId,
      uuid,
      shop,
    });
    if (!addedItem) {
      throw new Error("Failed to add item to wishlist");
    }
    const newItemList = await getWishlistItems({ customerId, uuid, shop });
    res
      .status(200)
      .send({ ok: true, customer: customerId || null, items: newItemList });
  } catch (err) {
    console.log("Failed to add item to wishlist reason -->" + err.message);
    logsStorage({
      name: "wishlist_add",
      type: "error",
      message: "Failed to add wishlist item reason -->" + err.message,
    });
    res.status(420).send({
      ok: false,
    });
  }
});

wishlistPublicRoute.post("/remove", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const { uuid } = cookies;
    const shop = res.locals.user_shop;
    let { productId, variantId, customerId } = req.body;
    if (!productId || !variantId) {
      throw new Error("Required params missing");
    }
    const removedItem = await removeItemFromWishlist({
      productId,
      variantId,
      uuid,
      customerId,
    });
    if (!removedItem) {
      throw new Error("Failed to remove item");
    }
    const newItemList = await getWishlistItems({ customerId, uuid, shop });
    res
      .status(200)
      .send({ ok: true, customer: customerId || null, items: newItemList });
  } catch (err) {
    console.log("Failed to remove item from wishlist reason -->" + err.message);
    logsStorage({
      name: "wishlist_remove",
      type: "error",
      message: "Failed to remove item from wishlist reason -->" + err.message,
    });
    res.status(420).send({
      ok: false,
    });
  }
});

wishlistPublicRoute.post("/bulk_remove", async (req, res) => {
  try {
    const cookies = cookie.parse(req.headers.cookie || "");
    const { uuid } = cookies;
    const { customerId } = req.body;
    const shop = res.locals.user_shop;
    if (!customerId && !uuid) {
      throw new Error("Neither customer id nor uuid found");
    }
    const removeItems = await clearItemsForUser({ customerId, uuid });
    const newItemList = await getWishlistItems({ customerId, uuid, shop });
    res
      .status(200)
      .send({ ok: true, customer: customerId || null, items: newItemList });
  } catch (err) {
    console.log("Failed to bulk remove item reason -->" + err.message);
    logsStorage({
      name: "Wishlist bulk remove",
      type: "error",
      message: "Failed to bulk remove items reason -->" + err.message,
    });
    res.status(420).send({
      ok: false,
    });
  }
});
export default wishlistPublicRoute;
