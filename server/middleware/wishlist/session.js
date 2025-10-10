import { v4 as uuidv4 } from "uuid";
import cookie from "cookie";

const sessionMiddleware = async (req, res, next) => {
  const cookies = cookie.parse(req.headers.cookie || "");
  let sessionId = cookies.wishlist_sessionId;
  res.header(
    "Access-Control-Allow-Origin",
    process.env.NODE_ENV === "dev"
      ? "http://localhost:9292"
      : "https://swissbeauty.in"
  );
  res.header("Access-Control-Allow-Credentials", "true");
  if (!sessionId) {
    sessionId = uuidv4();
    res.setHeader(
      "Set-Cookie",
      cookie.serialize("wishlist_sessionId", sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV == "dev" ? false : true,
        sameSite: "none",
        maxAge: 60 * 60 * 24 * 90, // 90 days
        path: "/",
      })
    );
  }
  req.sessionId = sessionId;
  next();
};

export { sessionMiddleware };
