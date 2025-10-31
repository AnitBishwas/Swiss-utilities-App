import { Router } from "express";
import clientProvider from "../../../utils/clientProvider.js";
import wishlistProxyRoutes from "../wishlist/proxy_routes/index.js";
import emailProxyRoutes from "../email/proxy_routes/index.js";

const proxyRouter = Router();

/**
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 */
proxyRouter.get("/json", async (req, res) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({
      shop: res.locals.user_shop,
    });
    return res.status(200).send({ content: "Proxy Be Working" });
  } catch (e) {
    console.error(e);
    return res.status(400).send({ error: true });
  }
});
proxyRouter.use("/wishlist", wishlistProxyRoutes);
proxyRouter.use("/email", emailProxyRoutes);
export default proxyRouter;
