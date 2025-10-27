import StoreModel from "../../../utils/models/StoreModel.js";
import { verifyToken } from "../../controllers/wishlist/token.js";

const wishlistPublicAuthenticator = async (req, res, next) => {
  try {
    console.log("public rout was hit");
    const storeDomain = req.headers["x-shopify-domain"];
    const authToken = req.headers["authorization"]
      ?.replace("Bearer", "")
      ?.trim();
    if (!storeDomain || !authToken) {
      throw new Error("Required headers missing");
    }
    const token = verifyToken(authToken, storeDomain);
    const checkStore = await StoreModel.findOne({
      shop: storeDomain,
    }).lean();
    if (!checkStore) {
      throw new Error("No matching store found");
    }
    res.locals.user_shop = storeDomain;
    next();
  } catch (err) {
    console.log(err);
    res.status(403).send({
      ok: false,
      message: "Bad Auth",
    });
  }
};

export { wishlistPublicAuthenticator };
