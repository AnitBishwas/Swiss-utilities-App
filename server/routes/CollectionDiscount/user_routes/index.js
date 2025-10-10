import { Router } from "express";
import CollectionDiscount from "../../../../utils/models/CollectionDiscount/CollectionDiscount";

const collectionDiscountUserRoutes = Router();

collectionDiscountUserRoutes.post("/update", (req, res) => {
  try {
  } catch (err) {
    res.status(420).send({
      ok: false,
      message: err.message,
    });
  }
});
collectionDiscountUserRoutes.get("/", async (req, res) => {
  try {
    const collectionDiscounts = await CollectionDiscount.find({}).lean();
    res.status(200).send({
      ok: true,
      collections: collectionDiscounts,
    });
  } catch (err) {
    res.status(420).send({
      ok: false,
    });
  }
});
