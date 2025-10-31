import { Router } from "express";
import { generateToken } from "../../../controllers/wishlist/token.js";
import createServerEvent from "../../../controllers/bigquery/index.js";
import {
  addItemToWishlist,
  clearItemsForUser,
  getWishlistItems,
  initNewUser,
  removeItemFromWishlist,
} from "../../../controllers/wishlist/index.js";
import UserModel from "../../../../utils/models/wishlist/User.js";

const wishlistProxyRoutes = Router();

wishlistProxyRoutes.get("/", (req, res) => {
  console.dir(req.query, { depth: null });
  res.status(200).send({
    ok: true,
  });
});
wishlistProxyRoutes.post("/generateToken", async (req, res) => {
  try {
    const token = await generateToken(res.locals.user_shop);
    res.status(200).send({
      ok: true,
      token,
    });
  } catch (err) {
    console.log("Failed to generate token reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});
wishlistProxyRoutes.post("/init", async (req, res) => {
  try {
    const customerId =
      req.query.logged_in_customer_id.trim().length > 0
        ? req.query.logged_in_customer_id
        : null;
    let uuid =
      req.headers["x-uuid"]?.trim().length > 4 ? req.headers["x-uuid"] : null;
    let shop = req.query.shop;
    let user = null;
    if (customerId) {
      user = await UserModel.findOne({
        customerId: customerId,
      }).lean();
    }
    if (uuid && !customerId) {
      user = await UserModel.findOne({
        uuid: uuid,
      }).lean();
    }
    if (!customerId && !uuid) {
      user = await initNewUser({ customerId, shop });
      uuid = user.uuid;
    }
    let wishlistItems = await getWishlistItems({
      customerId: customerId,
      uuid: uuid,
      shop,
    });
    res.status(200).send({
      ok: true,
      customer: customerId || false,
      uuid: uuid,
      items: wishlistItems,
    });
  } catch (err) {
    console.log("Failed to initialise wishlist reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});
wishlistProxyRoutes.post("/add", async (req, res) => {
  try {
    const customerId = req.query.logged_in_customer_id;
    const uuid = req.headers["x-uuid"];
    if (!customerId && !uuid) {
      throw new Error("Required params missing");
    }
    let shop = req.query.shop;
    let { productId, variantId } = req.body;

    if (!productId || !variantId) {
      throw new Error("Required params missing");
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
    res.status(420).send({
      ok: false,
    });
  }
});
wishlistProxyRoutes.post("/remove", async (req, res) => {
  try {
    const customerId = req.query.logged_in_customer_id;
    const uuid = req.headers["x-uuid"];
    if (!customerId && !uuid) {
      throw new Error("Required params missing");
    }
    let shop = req.query.shop;
    let { productId, variantId } = req.body;

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
    res.status(420).send({
      ok: false,
    });
  }
});
wishlistProxyRoutes.post("/bulk_remove", async (req, res) => {
  try {
    const customerId = req.query.logged_in_customer_id;
    const uuid = req.headers["x-uuid"];
    if (!customerId && !uuid) {
      throw new Error("Required params missing");
    }
    const removeItems = await clearItemsForUser({ customerId, uuid });
    const newItemList = await getWishlistItems({ customerId, uuid, shop });
    res
      .status(200)
      .send({ ok: true, customer: customerId || null, items: newItemList });
  } catch (err) {
    console.log(
      "Failed to bulk remove products from wishlist reason -->" + err.message
    );
  }
});
wishlistProxyRoutes.post("/events", async (req, res) => {
  try {
    const payload = req.body;
    const customerId = req.query.logged_in_customer_id;
    const uuid = req.headers["x-uuid"];
    if (!req.body || !payload.eventName) {
      throw new Error("Required params missing");
    }
    if (customerId) {
      payload["customerId"] = customerId;
    }
    if (uuid && !customerId) {
      payload["uuid"] = uuid;
    }
    const eventInsertion = await createServerEvent({ ...payload });
    res.status(200).send({
      ok: true,
    });
  } catch (err) {
    console.log("Failed to handle events reason -->" + err.message);
    res.status(420).send({
      ok: false,
      message: err.message,
    });
  }
});
export default wishlistProxyRoutes;
