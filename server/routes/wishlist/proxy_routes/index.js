import { Router } from "express";
import { generateToken } from "../../../controllers/wishlist/token.js";
import createServerEvent from "../../../controllers/bigquery/index.js";

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
wishlistProxyRoutes.post("/events", async (req, res) => {
  try {
    const payload = req.body;
    if (!req.body || !payload.eventName) {
      throw new Error("Required params missing");
    }
    const eventInsertion = await createServerEvent(payload);
    res.status(200).send({
      ok: true
    })
  } catch (err) {
    console.log("Failed to handle events reason -->" + err.message);
    res.status(420).send({
      ok: false,
      message: err.message,
    });
  }
});
export default wishlistProxyRoutes;
