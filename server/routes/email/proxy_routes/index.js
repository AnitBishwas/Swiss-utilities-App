import { Router } from "express";
import path from "path";
import { sendEmail } from "../../../controllers/email/external-email.js";
import ejs from "ejs";

const emailProxyRoutes = Router();

emailProxyRoutes.post("/contact_email", async (req, res) => {
  try {
    const payload = req.body;
    if (!payload?.customerEmail || !payload.email || !payload.title) {
      throw new Error("Required params missing");
    }
    const templatePath = path.join(
      process.cwd(),
      "server",
      "templates",
      "contact-email.ejs"
    );
    const templateContent = await ejs.renderFile(templatePath, {
      title: payload.title,
      message: payload.message,
      name: payload.name,
      email: payload.customerEmail,
      phone: payload.phone,
      message: payload.message
    });
    await sendEmail(payload.email, templateContent);
    res.status(200).send({
        ok: true
    })
  } catch (err) {
    console.log("Failed to handle contact email reason -->" + err.message);
    res.status(420).send({
      ok: false,
    });
  }
});

export default emailProxyRoutes;
