import jwt from "jsonwebtoken";

/**
 * Generate hmac token
 * @param {string} shop - store name EX - swiss-local-dev.myshopify.com
 * @returns {string} - hashed token
 */
const generateToken = async (shop) => {
  try {
    const token = jwt.sign(
      {
        data: shop,
      },
      process.env.SHOPIFY_API_KEY,
      {
        expiresIn: "3m",
      }
    );
    return token;
  } catch (err) {
    throw new Error("failed to generate token reason -->" + err.message);
  }
};
/**
 * Verify hmac token
 * @param {string} token - hmac token
 * @param {string} shop - shopify store handle - swiss-local-dev.myshopify.com
 * @returns {boolean} - whether verification was successfull
 */
const verifyToken = async (token, shop) => {
  try {
    const verificationToken = await jwt.verify(
      token,
      process.env.SHOPIFY_API_KEY,
      (error, decoded) => {
        if (error) {
          throw new Error("Invalid auth token");
        }
        return decoded;
      }
    );
    if (verificationToken?.data != shop) {
      throw new Error("Incorrect auth token");
    }
    return true;
  } catch (err) {
    throw new Error("❌ Failed to verify token reason -->" + err.message);
  }
};
export { generateToken, verifyToken };
