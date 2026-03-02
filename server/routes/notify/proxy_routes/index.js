import { Router } from "express";
import { createNotificationSubscription } from "../../../controllers/notify/index.js";

const notifyProxyRoutes = Router();

notifyProxyRoutes.post("/subscribe", async (req, res) => {
  try {
    const { phone, variants } = req.body;
    if (!phone || variants?.length == 0) {
      throw new Error("Required parameters missing");
    }
    const subscription = await createNotificationSubscription({
      shop: res.locals.user_shop,
      phone,
      variants,
    });
    res.status(200).json({
      ok: true,
    });
  } catch (err) {
    console.log(
      "Failed to create notification subscription reason -->" + err.message
    );
    res.status(400).json({
      ok: false,
      message: err.message,
    });
  }
});

export default notifyProxyRoutes;
