import SaleModel from "../../../utils/models/Sale/Sale.js";
import VariantModel from "../../../utils/models/Sale/Variant.js";
import {
  getCollectionsProductsOnVariantLevel,
  getProductsFromCollection,
  moveVariantsBackToSalePrice,
  moveVariantsToMrp,
  removeProductMetafieldForTags,
  retrieveVariantsFromDb,
  storeVariantSnapshotInDb,
  updateProductMetafieldForTags,
} from "./products.js";

/**
 * Get the current sale data
 * @returns {obj} - sale data object
 */
const getCurrentSaleData = async () => {
  try {
    const data = await SaleModel.findOne({}).lean();
    return data;
  } catch (err) {
    throw new Error("Failed to get current sale data reason -->" + err.message);
  }
};

/**
 * Enable sale
 * @typedef {object} payload
 * @property {string} tag - tag to be added on products
 * @typedef {object} collection
 * @property {string} id - shopify collection id
 * @property {string} title - shopify collection title
 * @property {string} image - shopify collection url
 * @return {object} sale object
 */
const enableSale = async ({ tag, collection, shop }) => {
  try {
    const saleUpdates = {
      state: "enable",
      status: "pending",
      message: "Sale enable started",
      collection: {
        title: collection.title,
        id: collection.id,
        image: collection.image,
        productsCount: collection.productsCount,
      },
      tag: tag,
    };

    const update = await SaleModel.findOneAndUpdate({}, saleUpdates, {
      upsert: true,
      new: true,
    }).lean();
    startSaleEnableOperation(shop);
    return update;
  } catch (err) {
    throw new Error("Failed to enable sale reason -->" + err.message);
  }
};

/**
 * Dsiable sale
 * @param {string} shop - Shopify store handle Ex : swiss-local-dev.myshopify.com
 * @returns
 */
const disableSale = async (shop) => {
  try {
    const saleUpdates = {
      state: "disable",
      status: "pending",
      message: "Sale disable started",
    };

    const update = await SaleModel.findOneAndUpdate({}, saleUpdates, {
      upsert: true,
      new: true,
    }).lean();
    startSaleDisableOperation(shop);
    return update;
  } catch (err) {
    throw new Error("Failed to enable sale reason -->" + err.message);
  }
};
/**
 * Enable sale changes
 * @param {string} shop - Shopify store handle swiss-local-dev.myshopify.com
 */
const startSaleEnableOperation = async (shop) => {
  try {
    console.log(
      "enable sale operation started at --->",
      new Date().toISOString()
    );
    const currentSale = await SaleModel.findOne().lean();
    let collectionId = currentSale.collection.id;
    await SaleModel.findOneAndUpdate({}, { message: "Fetching products data" });
    let variantLevelData = await getCollectionsProductsOnVariantLevel(
      collectionId,
      shop
    );
    await SaleModel.findOneAndUpdate(
      {},
      { message: "Storing products data into db" }
    );
    const variantSnapshotInDb =
      await storeVariantSnapshotInDb(variantLevelData);
    await SaleModel.findOneAndUpdate(
      {},
      { message: "Moving products prices to mrp" }
    );
    const moveProductsToMrp = await moveVariantsToMrp(variantLevelData, shop);
    await SaleModel.findOneAndUpdate({}, { message: "Updating product tags" });
    const tagUpdate = await updateProductMetafieldForTags(shop);
    await SaleModel.findOneAndUpdate(
      {},
      {
        status: "completed",
        message: `Sale updates done successfully ${new Date()}`,
      }
    );
    console.log(
      "enable sale operation ended at --->",
      new Date().toISOString()
    );
  } catch (err) {
    await SaleModel.findOneAndUpdate(
      {},
      { state: "failed", message: "Sale updates failed please review" }
    );
    throw new Error(
      "Failed to start sale enable operation reason --->" + err.message
    );
  }
};

/**
 * Revert sale changes
 * @param {string} shop - Shopify store handle Ex - swiss-local-dev.myshopify.com
 */

const startSaleDisableOperation = async (shop) => {
  try {
    console.log(
      "disable sale operation started at --->",
      new Date().toISOString()
    );
    await SaleModel.findOneAndUpdate(
      {},
      { message: "Fetching products data from DB" }
    );
    const variantLevelData = await retrieveVariantsFromDb();
    await SaleModel.findOneAndUpdate({}, { message: "Updating product price" });
    const variantsPriceUpdate = await moveVariantsBackToSalePrice(
      variantLevelData,
      shop
    );
    await SaleModel.findOneAndUpdate({}, { message: "Removing offer tag" });
    const offerTagUpdate = await removeProductMetafieldForTags(shop);
    await SaleModel.findOneAndUpdate({}, { message: "Clearing DB" });
    const dbUpdate = await VariantModel.deleteMany();
    await SaleModel.findOneAndUpdate(
      {},
      {
        message: `Sale revert done succefully at ${new Date()}`,
        status: "completed",
      }
    );
    console.log(
      "disable sale operation ended at --->",
      new Date().toISOString()
    );
  } catch (err) {
    await SaleModel.findOneAndUpdate(
      {},
      { status: "failed", message: "Sale revert updates failed please review" }
    );
    throw new Error(
      "Failed to start disable operation reason -->" + err.message
    );
  }
};

/**
 * update sale tag
 * @typedef {object} payload
 * @property {string} tag - tag to be added on products
 * @typedef {object} collection
 * @property {string} id - shopify collection id
 * @property {string} title - shopify collection title
 * @property {string} image - shopify collection url
 * @return {object} sale object
 */
const updateSaleTags = async ({ tag, collection, shop }) => {
  try {
    const saleUpdates = {
      message: "Tag updates started",
      status: "progress",
      collection: {
        title: collection.title,
        id: collection.id,
        image: collection.image,
        productsCount: collection.productsCount,
      },
      tag: tag,
    };
    const update = await SaleModel.findOneAndUpdate({}, saleUpdates, {
      upsert: true,
      new: true,
    }).lean();
    startTagUpdateOperation(shop);
    return update;
  } catch (err) {
    throw new Error("❌ Failed to update tags reason -->" + err.message);
  }
};

const removeTags = async (shop) => {
  try {
    const saleUpdates = {
      message: "Tags removal started",
      tag: null,
      status: "progress",
    };
    const update = await SaleModel.findOneAndUpdate({}, saleUpdates, {
      new: true,
    });
    startTagRemoveOperation(shop);
    return update;
  } catch (err) {
    throw new Error("❌ Failed to remove tags reason -->" + err.message);
  }
};
/**
 * start tag update
 * @param {string} shop - shopify store handle Ex : swiss-local-dev.myshopify.com
 */
const startTagUpdateOperation = async (shop) => {
  try {
    await SaleModel.findOneAndUpdate({}, { message: "Updating Tags" });
    let tagUpdate = await updateProductMetafieldForTags(shop);
    await SaleModel.findOneAndUpdate(
      {},
      {
        status: "completed",
        message: "Tag updates finished on" + new Date().toISOString(),
      }
    );
  } catch (err) {
    throw new Error(
      "❌ Failed to start tag update operation reason -->" + err.message
    );
  }
};

/**
 * Start tag removal operation
 * @param {string} shop - shopify store handle Ex: swiss-local-dev.myshopify.com
 */
const startTagRemoveOperation = async (shop) => {
  try {
    await SaleModel.findOneAndUpdate({}, { message: "Removing Tags" });
    const tagRemoval = await removeProductMetafieldForTags(shop);
    await SaleModel.findOneAndUpdate(
      {},
      {
        status: "completed",
        message: "Tag removal finished on" + new Date().toISOString(),
      }
    );
  } catch (err) {
    throw new Error(
      "❌ Failed to start tag remove operation reason -->" + err.message
    );
  }
};
export {
  getCurrentSaleData,
  enableSale,
  startSaleDisableOperation,
  disableSale,
  updateSaleTags,
  removeTags,
};
