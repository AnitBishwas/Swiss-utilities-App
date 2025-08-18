import { Router } from "express";
import { getCurrentSaleData } from "../../controllers/index.js";

const saleUserRoutes = Router();

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
