import { Router } from "express";
import { generateToken } from "../../../controllers/wishlist/token.js";

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

export default wishlistProxyRoutes;
