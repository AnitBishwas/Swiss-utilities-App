import clientProvider from "../../../utils/clientProvider.js";

const getShopifyProductVariantInfo = async ({ shop, variantId }) => {
  try {
    const ownerId = variantId.includes("gid")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query GetProductVariant($ownerId : ID!){
            productVariant(id: $ownerId){
                compareAtPrice
                price
                displayName
                id
                product{
                    id
                    handle
                }
            }
        }`;
    const variables = {
      ownerId,
    };
    const { data, extensions, errors } = await client.request(query, {
      variables,
    });
    if (errors && errors.length > 0) {
      throw new Error("Failed to get shopify product variant info");
    }
    return {
      compareAtPrice: Number(data.productVariant.compareAtPrice),
      price: Number(data.productVariant.price),
      title: data.productVariant.displayName,
      id: data.productVariant.id.replace("gid://shopify/ProductVariant/", ""),
      productId: data.productVariant.product.id.replace(
        "gid://shopify/Product/",
        ""
      ),
      productHandle: data.productVariant.product.handle,
    };
  } catch (err) {
    console.log(err);
    throw new Error("Failed to get shopify product reason -->" + err.message);
  }
};

/**
 * Get variant stock availablity
 * @typedef {object} payload
 * @property {string} variantId - shopify variant id
 * @property {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 */
const getVariantAvaialability = async ({ variantId, shop }) => {
  try {
    const ownerId = variantId.includes("gid")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;
    const query = `query ProductVariantInfo($ownerId : ID!){
      productVariant(id: $ownerId){
        inventoryQuantity
        inventoryPolicy
      }
    }`;
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const { data, errors, extensions } = await client.request(query, {
      variables: {
        ownerId,
      },
    });
    if (errors && errors.length > 0) {
      throw new Error("Failed to get variant availability");
    }
    return data.productVariant.inventoryPolicy == "CONTINUE"
      ? true
      : data.productVariant.inventoryQuantity > 0;
  } catch (err) {
    throw new Error(
      "Failed to get variant availability reason -->" + err.message
    );
  }
};

/**
 * Get customer info from shopifdy
 * @typedef {object} payload
 * @property {string} shop - shopify store handle Ex - swiss-local-dev.myshopify.com
 * @property {string} customerId - customer shopify id
 * @returns {object}
 */
const getCustomerInfoFromShopify = async ({ shop, customerId }) => {
  try {
    const ownerId = customerId.includes("gid")
      ? customerId
      : "gid://shopify/Customer/" + customerId;
    const query = `query{
            customer(id: "${ownerId}"){
                firstName
                lastName
                id
                defaultEmailAddress{
                    emailAddress
                }
                defaultPhoneNumber{
                    phoneNumber
                }
            }
        }`;
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const { data, extensions, errors } = await client.request(query);
    if (errors && errors.length > 0) {
      throw new Error("Failed to fetch customer info from shopify");
    }
    return {
      firstName: data.customer.firstName,
      lastName: data.customer.lastName,
      email: data.defaultEmailAddress?.emailAddress || null,
      phone: data.defaultPhoneNumber?.phoneNumber || null,
    };
  } catch (err) {
    throw new Error(
      "Failed to get customer info from shopify reason -->" + err.message
    );
  }
};
export {
  getShopifyProductVariantInfo,
  getCustomerInfoFromShopify,
  getVariantAvaialability,
};
