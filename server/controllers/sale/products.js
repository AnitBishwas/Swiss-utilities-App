import clientProvider from "../../../utils/clientProvider.js";
import SaleModel from "../../../utils/models/Sale/Sale.js";
import VariantModel from "../../../utils/models/Sale/Variant.js";

/**
 * @param {array} variantsList - List of variants
 * @param {string} - shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const moveVariantsToMrp = async (variantList, shop) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });

    const productLevelMapping = groupVariantsByProduct(variantList);

    const reservedQueryToken = 400;
    let batchLength = 5;

    let i = 0;
    while (i < productLevelMapping.length) {
      const batch = productLevelMapping.slice(i, i + batchLength);

      const listPromises = batch.map(async (product) => {
        return updateVariantMrp(product, client);
      });

      const settledPromises = await Promise.allSettled(listPromises);
      const failed = settledPromises
        .map((res, idx) => (res.status === "rejected" ? batch[idx] : null))
        .filter(Boolean);
      if (failed.length > 0) {
        console.warn(`⚠️ Retrying ${failed.length} failed requests...`);
        const retryPromises = failed.map((el) => {
          return retry(() => updateVariantMrp(el, client), 3, 1000);
        });

        const retryResults = await Promise.allSettled(retryPromises);

        failed.forEach((failedEl, idx) => {
          const originalIndex = batch.indexOf(failedEl);
          settledPromises[originalIndex] = retryResults[idx];
        });
      }

      settledPromises.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          console.log(
            `✅ Updated product ${batch[idx].productId} with ${batch[idx].variants.length} variants`
          );
        } else {
          console.error(
            `❌ Failed updating product ${batch[idx].productId}`,
            res.reason
          );
        }
      });

      const lastRes = settledPromises.find((p) => p.status === "fulfilled");
      if (lastRes?.value?.extensions?.cost) {
        const { requestedQueryCost } = lastRes.value.extensions.cost;
        const available =
          lastRes.value.extensions.cost.throttleStatus.currentlyAvailable -
          reservedQueryToken;

        if (requestedQueryCost > 0) {
          const newBatch = Math.max(
            1,
            Math.floor(available / requestedQueryCost)
          );
          batchLength = Math.min(newBatch, productLevelMapping.length - i);
        }
      }

      console.log(
        `✅ Batch processed: products ${i} → ${i + batch.length - 1}, next batch size = ${batchLength}`
      );

      i += batch.length; // move index forward
    }

    console.log("🎉 Finished moving variants to MRP");
  } catch (err) {
    console.error("❌ Failed to move products to MRP → " + err.message);
  }
};

const updateVariantMrp = async (product, client) => {
  try {
    const query = `
          mutation productVariantBulkUpdate(
            $productId: ID!, 
            $variants: [ProductVariantsBulkInput!]!
          ) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              product { id }
            }
          }
        `;

    const variables = {
      productId: `gid://shopify/Product/${product.productId}`,
      variants: product.variants.map((el) => ({
        id: `gid://shopify/ProductVariant/${el.id}`,
        price: Number(el.mrp),
      })),
    };

    return client.request(query, { variables });
  } catch (err) {
    throw new Error("Failed to update variant mrp reason -->" + err.message);
  }
};
/**
 *
 * @param {array} variantList - List of variants
 * @param {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const moveVariantsBackToSalePrice = async (variantList, shop) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });

    const productLevelMapping = groupVariantsByProduct(variantList);

    const reservedQueryToken = 400;
    let batchLength = 1;

    let i = 0;
    while (i < productLevelMapping.length) {
      const batch = productLevelMapping.slice(i, i + batchLength);

      const listPromises = batch.map(async (product) => {
        return updateVariantPrice(product, client);
      });

      const settledPromises = await Promise.allSettled(listPromises);
      const failed = settledPromises
        .map((res, idx) => (res.status === "rejected" ? batch[idx] : null))
        .filter(Boolean);

      if (failed.length > 0) {
        console.warn(`⚠️ Retrying ${failed.length} failed requests...`);
        const retryPromises = failed.map((el) => {
          return retry(() => updateVariantPrice(el, client), 3, 1000);
        });

        const retryResults = await Promise.allSettled(retryPromises);

        failed.forEach((failedEl, idx) => {
          const originalIndex = batch.indexOf(failedEl);
          settledPromises[originalIndex] = retryResults[idx];
        });
      }
      settledPromises.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          console.log(
            `✅ Restored sale price for product ${batch[idx].productId} (${batch[idx].variants.length} variants)`
          );
        } else {
          console.error(
            `❌ Failed updating product ${batch[idx].productId}`,
            res.reason
          );
        }
      });

      const lastRes = settledPromises.find((p) => p.status === "fulfilled");
      if (lastRes?.value?.extensions?.cost) {
        const { requestedQueryCost } = lastRes.value.extensions.cost;
        const available =
          lastRes.value.extensions.cost.throttleStatus.currentlyAvailable -
          reservedQueryToken;

        if (requestedQueryCost > 0) {
          const newBatch = Math.max(
            1,
            Math.floor(available / requestedQueryCost)
          );
          batchLength = Math.min(newBatch, productLevelMapping.length - i);
        }
      }

      console.log(
        `✅ Batch processed: products ${i} → ${i + batch.length - 1}, next batch size = ${batchLength}`
      );

      i += batch.length;
    }

    console.log("🎉 Finished moving variants back to sale price");
  } catch (err) {
    throw new Error(
      "❌ Failed to move variants back to sale price → " + err.message
    );
  }
};

const updateVariantPrice = async (product, client) => {
  try {
    const query = `
          mutation productVariantBulkUpdate(
            $productId: ID!, 
            $variants: [ProductVariantsBulkInput!]!
          ) {
            productVariantsBulkUpdate(productId: $productId, variants: $variants) {
              product { id }
            }
          }
        `;

    const variables = {
      productId: `gid://shopify/Product/${product.productId}`,
      variants: product.variants.map((el) => ({
        id: `gid://shopify/ProductVariant/${el.id}`,
        price: Number(el.price),
      })),
    };

    return client.request(query, { variables });
  } catch (err) {
    throw new Error("Failed to update variant price reason -->" + err.message);
  }
};
/**
 * Store variant snapshotg in db
 * @param {array} variantsList - list of variants
 */
const storeVariantSnapshotInDb = async (variantsList) => {
  try {
    const result = await VariantModel.insertMany(variantsList);
    return result;
  } catch (err) {
    throw new Error(
      "Failed to store variants snapshots in DB reason -->" + err.message
    );
  }
};

/**
 * Get the list of products in a collection on variant level
 * @param {string} collectionId
 * @param {string} shop
 */
const getCollectionsProductsOnVariantLevel = async (collectionId, shop) => {
  try {
    const id = (collectionId + "").includes("gid")
      ? collectionId
      : `gid://shopify/Collection/${collectionId}`;

    const productsList = await getProductsFromCollection(id, shop);
    console.log(
      "✅ Product fetch completed. Total products:",
      productsList.length
    );

    let finalVariantsList = [];
    let batchLength = 1;
    const reservedQueryToken = 400;

    let i = 0;
    while (i < productsList.length) {
      const batchedArray = productsList.slice(i, i + batchLength);

      const listPromises = batchedArray.map(async (el) => {
        const pid = (el + "").includes("gid")
          ? el
          : `gid://shopify/Product/${el}`;
        console.log("🔹 Fetching variants for product:", el);
        return await getVariantsFromProduct(pid, shop);
      });

      const settledPromises = await Promise.allSettled(listPromises);
      const failed = settledPromises
        .map((res, idx) =>
          res.status === "rejected" ? batchedArray[idx] : null
        )
        .filter(Boolean);

      if (failed.length > 0) {
        console.warn(`⚠️ Retrying ${failed.length} failed requests...`);
        const retryPromises = failed.map((el) => {
          const pid = (el + "").includes("gid")
            ? el
            : `gid://shopify/Product/${el}`;
          return retry(() => getVariantsFromProduct(pid, shop), 3, 1000);
        });

        const retryResults = await Promise.allSettled(retryPromises);

        failed.forEach((failedEl, idx) => {
          const originalIndex = batchedArray.indexOf(failedEl);
          settledPromises[originalIndex] = retryResults[idx];
        });
      }

      settledPromises.forEach((res, ind) => {
        if (res.status === "fulfilled") {
          let { variantList } = res.value;
          const mappedVariants = variantList.map((v) => ({
            title: v.displayName,
            id: v.id,
            productId: v.productId.replace("gid://shopify/Product/", ""),
            mrp: v.compareAtPrice,
            price: v.price,
          }));
          finalVariantsList.push(...mappedVariants);
        } else {
          console.error("❌ Variant fetch failed:", res.reason);
        }
      });

      // adjust batch length if possible
      const lastRes = settledPromises.find((p) => p.status === "fulfilled");
      if (lastRes?.value?.extensions?.cost) {
        const { requestedQueryCost } = lastRes.value.extensions.cost;
        const available =
          lastRes.value.extensions.cost.throttleStatus.currentlyAvailable -
          reservedQueryToken;

        if (requestedQueryCost > 0) {
          const newBatch = Math.max(
            1,
            Math.floor(available / requestedQueryCost)
          );
          batchLength = Math.min(newBatch, productsList.length - i);
        }
      }

      console.log(
        `✅ Batch processed: products ${i} → ${i + batchedArray.length - 1}, next batch size = ${batchLength}`
      );

      i += batchedArray.length; // ✅ move index by actual processed length
    }

    console.log(
      "🎉 Variant fetch completed. Total variants:",
      finalVariantsList.length
    );
    return finalVariantsList;
  } catch (err) {
    throw new Error(
      "Failed to fetch collection products on variant level → " + err.message
    );
  }
};

/**
 *
 * @param {string} collectionId - shopify collection id
 * @param {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 * @returns {array} product list
 */
const getProductsFromCollection = async (collectionId, shop) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    let nextPage = null;
    let first = 10;
    let endCursor = null;
    let productList = [];
    while (nextPage || nextPage == null) {
      const query = `query CollectionProducts($ownerId : ID!,$firstProducts : Int!, $endCursor: String){
        collection(id: $ownerId){
          products(first: $firstProducts, after: $endCursor){
            pageInfo{
              hasNextPage
              endCursor
            }
            edges{
              node{
                id
              }
            }
          }
        }
      }`;
      const { data, errors, extensions } = await client.request(query, {
        variables: {
          ownerId: collectionId,
          firstProducts: first,
          endCursor,
        },
      });
      if (errors && errors?.length > 0) {
        console.dir(
          {
            message: "Failed to get collection products",
            errors,
            extensions,
          },
          { depth: null }
        );
        throw new Error("Failed to make products list query");
      }
      nextPage = data?.collection?.products?.pageInfo?.hasNextPage
        ? true
        : false;
      endCursor = data?.collection?.products?.pageInfo?.endCursor;
      let mappedProducts =
        data?.collection?.products?.edges.map(({ node }) =>
          Number(node.id.replace("gid://shopify/Product/", ""))
        ) || null;
      productList = [...productList, ...mappedProducts];
      if (extensions?.cost?.throttleStatus?.currentlyAvailable < 600) {
        await new Promise((res, rej) => {
          setTimeout(() => {
            console.log(
              "Waited to get product list reason throttle was reached"
            );
            res(true);
          }, 1000);
        });
      }
    }
    return productList;
  } catch (err) {
    throw new Error(
      "Failed to get products from collection reason -->" + err.message
    );
  }
};

/**
 *
 * @param {string} productId - shopify product id
 * @param {string}  shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 * @returns {@typedef}
 * @property {object} extensions - query cost and other details
 * @property {array} variants - list of variants
 */
const getVariantsFromProduct = async (productId, shop) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    let nextPage = null;
    let first = 10;
    let endCursor = null;
    let variantList = [];
    let queryExtensions = null;

    while (nextPage || nextPage == null) {
      const query = `query ProductVariants($ownerId : ID!, $first : Int!, $endCursor: String){
        product(id : $ownerId){
          variants(first: $first, after: $endCursor){
            pageInfo{
              hasNextPage
              endCursor
            }
            edges{
              node{
                displayName
                id
                price
                compareAtPrice 
              }
            }
          }
        }
      }`;
      const { data, errors, extensions } = await client.request(query, {
        variables: {
          ownerId: productId,
          first,
          endCursor,
        },
      });
      if (errors && errors.length > 0) {
        console.dir(
          {
            message: "Failed to get product variant",
            errors,
            extensions,
          },
          { depth: null }
        );
      }
      nextPage = data?.product?.variants?.pageInfo?.hasNextPage ? true : false;
      endCursor = data?.product?.variants?.pageInfo?.endCursor;
      let mappedVariants =
        data?.product?.variants?.edges.map(({ node }) => ({
          ...node,
          id: node.id.replace("gid://shopify/ProductVariant/", ""),
          productId: productId,
        })) || null;
      variantList = [...variantList, ...mappedVariants];
      queryExtensions = extensions;
      if (extensions?.cost?.throttleStatus?.currentlyAvailable < 600) {
        await new Promise((res, rej) => {
          setTimeout(() => {
            console.log(
              "Waited to get product list reason throttle was reached"
            );
            res(true);
          }, 1000);
        });
      }
    }
    return {
      extensions: queryExtensions,
      variantList,
    };
  } catch (err) {
    throw new Error(
      "Failed to get variants from product reason -->" + err.message
    );
  }
};

const groupVariantsByProduct = (variants) => {
  return Object.values(
    variants.reduce((acc, v) => {
      if (!acc[v.productId]) {
        acc[v.productId] = {
          productId: v.productId,
          title: v.title, // optional: keep one title
          variants: [],
        };
      }
      acc[v.productId].variants.push(v);
      return acc;
    }, {})
  );
};

/**
 * update product metafield for tags
 * @param {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const updateProductMetafieldForTags = async (shop) => {
  try {
    const { collection, tag } = await SaleModel.findOne({}).lean();

    const collectionId = (collection.id + "").includes("gid")
      ? collection.id
      : `gid://shopify/Collection/${collection.id}`;

    const collectionProducts = await getProductsFromCollection(
      collectionId,
      shop
    );
    console.log(
      "✅ Products fetched from collection:",
      collectionProducts.length
    );

    const reservedQueryToken = 400;
    let batchLength = 1;

    let i = 0;
    while (i < collectionProducts.length) {
      const batch = collectionProducts.slice(i, i + batchLength);

      const listPromises = batch.map(async (product) => {
        const pid = (product + "").includes("gid")
          ? product
          : `gid://shopify/Product/${product}`;

        return updateProductMetafieldTag(pid, shop, tag);
      });

      const settledPromises = await Promise.allSettled(listPromises);
      const failed = settledPromises
        .map((res, idx) => (res.status === "rejected" ? batch[idx] : null))
        .filter(Boolean);
      if (failed.length > 0) {
        console.warn(`⚠️ Retrying ${failed.length} failed requests...`);
        const retryPromises = failed.map((el) => {
          const pid = (el + "").includes("gid")
            ? el
            : `gid://shopify/Product/${el}`;
          return retry(
            () => updateProductMetafieldTag(pid, shop, tag),
            3,
            1000
          );
        });

        const retryResults = await Promise.allSettled(retryPromises);

        failed.forEach((failedEl, idx) => {
          const originalIndex = batch.indexOf(failedEl);
          settledPromises[originalIndex] = retryResults[idx];
        });
      }

      settledPromises.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          console.log(`✅ Metafield updated for product ${batch[idx]}`);
        } else {
          console.error(
            `❌ Failed metafield update for product ${batch[idx]}`,
            res.reason
          );
        }
      });

      const lastRes = settledPromises.find((p) => p.status === "fulfilled");
      if (lastRes?.value?.extensions?.cost) {
        const { requestedQueryCost } = lastRes.value.extensions.cost;
        const available =
          lastRes.value.extensions.cost.throttleStatus.currentlyAvailable -
          reservedQueryToken;

        if (requestedQueryCost > 0) {
          const newBatch = Math.max(
            1,
            Math.floor(available / requestedQueryCost)
          );
          batchLength = Math.min(newBatch, collectionProducts.length - i);
        }
      }

      console.log(
        `✅ Batch processed: products ${i} → ${i + batch.length - 1}, next batch size = ${batchLength}`
      );

      i += batch.length;
    }

    console.log("🎉 Finished updating product metafields for tags");
  } catch (err) {
    throw new Error(
      "Failed to update product metafield for tags → " + err.message
    );
  }
};

/**
 * Update product metafield corresponding to tags
 * @param {string} productId - shopify product id
 * @param {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const updateProductMetafieldTag = async (productId, shop, tag) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const inputs = {
      input: {
        id: productId,
        metafields: {
          key: "offers",
          type: "list.single_line_text_field",
          value: JSON.stringify([tag]),
          namespace: "custom",
        },
      },
    };
    const query = `mutation UpdateProductWithNewMedia($input: ProductInput!) {
                      productUpdate(input: $input) {
                          product {
                              id
                              metafields(first:100){
                                edges{
                                  node{
                                    type
                                    id
                                    key
                                    namespace
                                    value
                                  }
                                }
                              }
                          }
                          userErrors {
                          field
                          message
                          }
                      }
                      }`;

    const { data, errors, extensions } = await client.request(query, {
      variables: inputs,
    });
    if (errors?.length > 0) {
      console.dir(
        {
          message: "Failed to update product metafield",
          errors,
          extensions,
        },
        { depth: null }
      );
    }
    if (extensions.cost.throttleStatus.currentlyAvailable < 400) {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res("waited for throttle here");
        }, 1000);
      });
    }
    return {
      data,
      extensions,
    };
  } catch (err) {
    throw new Error(
      "Failed to update product metafield tag reason -->" + err.message
    );
  }
};

/**
 * Remove offer tag from sale collection
 * @param {string} shop - Shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const removeProductMetafieldForTags = async (shop) => {
  try {
    const { collection } = await SaleModel.findOne({}).lean();

    let collectionId = (collection.id + "").includes("gid")
      ? collection.id
      : `gid://shopify/Collection/${collection.id}`;

    const collectionProducts = await getProductsFromCollection(
      collectionId,
      shop
    );

    const reservedQueryToken = 400;
    let batchLength = 1;
    let i = 0;

    while (i < collectionProducts.length) {
      const batch = collectionProducts.slice(i, i + batchLength);

      const listPromises = batch.map(async (product) => {
        let pid = (product + "").includes("gid")
          ? product
          : `gid://shopify/Product/${product}`;
        return removeProductMetafield(pid, shop);
      });

      const settled = await Promise.allSettled(listPromises);
      const failed = settled
        .map((res, idx) => (res.status === "rejected" ? batch[idx] : null))
        .filter(Boolean);
      if (failed.length > 0) {
        console.warn(`⚠️ Retrying ${failed.length} failed requests...`);
        const retryPromises = failed.map((el) => {
          const pid = (el + "").includes("gid")
            ? el
            : `gid://shopify/Product/${el}`;
          return retry(() => removeProductMetafield(pid, shop), 3, 1000);
        });

        const retryResults = await Promise.allSettled(retryPromises);

        failed.forEach((failedEl, idx) => {
          const originalIndex = batch.indexOf(failedEl);
          settledPromises[originalIndex] = retryResults[idx];
        });
      }

      settled.forEach((res, idx) => {
        if (res.status === "fulfilled") {
          console.log(`✅ Removed metafield for product ${batch[idx]}`);
        } else {
          console.error(
            `❌ Failed removing metafield for ${batch[idx]}`,
            res.reason
          );
        }
      });

      const lastRes = settled.find((r) => r.status === "fulfilled");
      if (lastRes?.value?.extensions?.cost) {
        const { requestedQueryCost } = lastRes.value.extensions.cost;
        const available =
          lastRes.value.extensions.cost.throttleStatus.currentlyAvailable -
          reservedQueryToken;

        if (requestedQueryCost > 0) {
          const newBatch = Math.max(
            1,
            Math.floor(available / requestedQueryCost)
          );
          batchLength = Math.min(newBatch, collectionProducts.length - i);
        }
      }

      console.log(
        `Batch done → products ${i} to ${i + batch.length - 1}, next batch size = ${batchLength}`
      );

      i += batch.length; // move to next batch
    }

    console.log(
      "🎉 Finished removing metafields for all products in collection"
    );
  } catch (err) {
    throw new Error(
      "Failed to remove product metafield for tags reason --> " + err.message
    );
  }
};

/**
 * Remove offer matfield for product
 * @param {string} productId - shopify product id
 * @param {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 * @returns
 */
const removeProductMetafield = async (productId, shop) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const inputs = {
      input: {
        id: productId,
        metafields: {
          key: "offers",
          type: "list.single_line_text_field",
          value: JSON.stringify([]),
          namespace: "custom",
        },
      },
    };
    const query = `mutation UpdateProductWithNewMedia($input: ProductInput!) {
                      productUpdate(input: $input) {
                          product {
                              id
                              metafields(first:100){
                                edges{
                                  node{
                                    type
                                    id
                                    key
                                    namespace
                                    value
                                  }
                                }
                              }
                          }
                          userErrors {
                          field
                          message
                          }
                      }
                      }`;

    const { data, errors, extensions } = await client.request(query, {
      variables: inputs,
    });
    if (errors?.length > 0) {
      console.dir(
        {
          message: "Failed to update product metafield",
          errors,
          extensions,
        },
        { depth: null }
      );
    }
    if (extensions.cost.throttleStatus.currentlyAvailable < 400) {
      await new Promise((res, rej) => {
        setTimeout(() => {
          res("waited for throttle here");
        }, 1000);
      });
    }
    return {
      data,
      extensions,
    };
  } catch (err) {
    throw new Error(
      "Failed to remove product metafield reason -->" + err.message
    );
  }
};
/**
 * Get list of variants updated for sale from DB
 * @returns {array} - list of variants
 */
const retrieveVariantsFromDb = async () => {
  try {
    const variants = await VariantModel.find({}).lean();
    return variants;
  } catch (err) {
    throw new Error(
      "Failed to retrieve variants from DB reason -->" + err.message
    );
  }
};
/**
 * Retry function run with backoff
 * @param {*} fn
 * @param {*} retries
 * @param {*} delay
 * @returns
 */
const retry = async (fn, retries = 3, delay = 1000) => {
  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await new Promise((r) => setTimeout(r, delay));
      return await fn();
    } catch (err) {
      lastError = err;
      console.warn(
        `⚠️ Attempt ${attempt} failed: ${err.message}. Retrying in ${delay}ms...`
      );
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, delay));
        delay *= 2;
      }
    }
  }
  throw lastError;
};
export {
  getCollectionsProductsOnVariantLevel,
  moveVariantsToMrp,
  storeVariantSnapshotInDb,
  updateProductMetafieldForTags,
  retrieveVariantsFromDb,
  moveVariantsBackToSalePrice,
  removeProductMetafieldForTags,
  getProductsFromCollection,
};
