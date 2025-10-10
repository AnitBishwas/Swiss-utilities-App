import { Router } from "express";
import {
  disableSale,
  enableSale,
  getCurrentSaleData,
  removeTags,
  updateSaleTags,
} from "../../../../controllers/sale/index.js";
import SaleModel from "../../../../../utils/models/Sale/Sale.js";

const saleUserRoutes = Router();

saleUserRoutes.get("/status", async (req, res) => {
  try {
    const saleData = await SaleModel.findOne({}).lean();
    res.status(200).send({
      ok: true,
      ...saleData,
    });
  } catch (err) {
    console.log("Failed to get sale status reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});

saleUserRoutes.post("/enable", async (req, res) => {
  try {
    const payload = req.body;
    payload.shop = res.locals.user_session.shop;
    if (!payload) {
      throw new Error("Required params missing");
    }
    const saleUpdate = await enableSale(payload);
    res.status(200).send({
      ok: true,
      ...saleUpdate,
    });
  } catch (err) {
    console.log("Failed to enable sale reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});

saleUserRoutes.post("/updateTags", async (req, res) => {
  try {
    const payload = req.body;
    payload.shop = res.locals.user_session.shop;
    if (!payload) {
      throw new Error("🧾 Required params missing");
    }
    const tagUpdate = await updateSaleTags(payload);
    res.status(200).send({
      ok: true,
      ...tagUpdate,
    });
  } catch (err) {
    console.log("❌ Failed to update tags reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});
saleUserRoutes.post("/removeTags", async (req, res) => {
  try {
    const tagUpdate = await removeTags(res.locals.user_session.shop);
    res.status(200).send({
      ok: true,
      ...tagUpdate,
    });
  } catch (err) {
    console.log("❌ Failed to update tags reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});
saleUserRoutes.post("/disable", async (req, res) => {
  try {
    const shop = res.locals.user_session.shop;
    const saleUpdate = await disableSale(shop);
    res.status(200).send({
      ok: true,
      ...saleUpdate,
    });
  } catch (err) {
    console.log("Failed to enable sale reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});
/**
 * retrieve current sale state and data
 */
saleUserRoutes.get("/", async (req, res) => {
  try {
    const saleData = await getCurrentSaleData();
    res.status(200).send({
      ok: true,
      ...saleData,
    });
  } catch (err) {
    console.log("Failed to get sale data reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});
export default saleUserRoutes;
