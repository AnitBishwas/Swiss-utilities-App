import { Router } from "express";
import { sendGkOtp } from "../controllers/index.js";

const loginProxyRoutes = Router();

loginProxyRoutes.post("/", async (req, res) => {
  try {
    const payload = req.body;
    const sendOtp = await sendGkOtp(payload.phone);
    res.status(200).send({
      ok: true,
    });
  } catch (err) {
    console.log("Failed to handle customer login reason -->" + err.message);
  }
});

export default loginProxyRoutes;
