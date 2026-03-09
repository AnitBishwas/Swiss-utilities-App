/**
 *
 * @param {string} shop -  shopify store handle
 * @param {string} phone - customer phone number
 */

import clientProvider from "../../../utils/clientProvider.js";

const getShopifyCustomerDetailsViaPhone = async (shop, phone) => {
  try {
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query customerByPhone($query: String!, $first: Int = 2){
            customers(first: $first, query: $query){
                edges{
                    node{
                        id
                        firstName
                        lastName
                        email
                        phone
                        lastOrder{
                            createdAt
                        }
                        defaultAddress {
                            phone
                        }
                    }
                }
            }   
        }`;
    const variables = {
      query: "customersByPhone",
      variables: {
        query: phone,
        first: 6,
      },
    };
    const { data, extensions, errors } = await client.request(query, variables);
    if (errors && errors.length > 0) {
      throw new Error(
        "Some error occured while getting shopify customer details"
      );
    }
    const edges = data?.customers?.edges || [];
    if (edges.length === 0) {
      return null;
    }

    const best = edges
      .map(({ node }) => {
        const nodePhone = node?.phone || "";
        const addrPhone = node?.defaultAddress?.phone || "";
        const matches =
          nodePhone === phone ||
          addrPhone === phone ||
          nodePhone.endsWith(phone.replace(/^\+/, "")) ||
          addrPhone.endsWith(phone.replace(/^\+/, ""));

        const lastOrderTs = node?.lastOrder?.createdAt
          ? new Date(node.lastOrder.createdAt).getTime()
          : 0;

        return { node, matches, lastOrderTs };
      })
      .sort((a, b) => {
        if (a.matches !== b.matches) return a.matches ? -1 : 1;
        return b.lastOrderTs - a.lastOrderTs;
      })[0]?.node;

    if (!best) {
      throw new Error("Customer selection failed");
    }

    return {
      shopifyId: best.id.replace("gid://shopify/Customer/", ""),
      firstName: best.firstName || "",
      lastName: best.lastName || "",
      email: best.email || "",
      phone: best.phone || best?.defaultAddress?.phone || phone,
    };
  } catch (err) {
    throw new Error(
      "Failed to get shopify customer details via phone reason -->" +
        err.message
    );
  }
};

/**
 *
 * @param {string} shop - shopify store handle
 * @param {string} variantId - variant id
 */
const getShopifyProductInfoViaVariantId = async (shop, variantId) => {
  try {
    if (!shop || !variantId) {
      throw new Error("Required params missing");
    }
    const ownerId = (variantId + "").includes("gid")
      ? variantId
      : `gid://shopify/ProductVariant/${variantId}`;
    const { client } = await clientProvider.offline.graphqlClient({ shop });
    const query = `query GetProductInfo($ownerId: ID!){
                productVariant(id: $ownerId){
                id
                title
                product{
                    id
                    title
                    featuredMedia{
                      preview{
                        image{
                          url
                        }
                      }
                    }
                }
                
            }
        }`;
    const variables = {
      ownerId,
    };
    const { data, errors, extensions } = await client.request(query, {
      variables,
    });
    if (errors && errors.length > 0) {
      throw new Error("Failed to get shopify product info");
    }
    if (!data.productVariant) {
      throw new Error("No product found for the given variant id");
    }
    return {
      variantTitle: data.productVariant.title,
      variantId: data.productVariant.id.replace(
        "gid://shopify/ProductVariant/",
        ""
      ),
      productTitle: data.productVariant.product.title,
      productId: data.productVariant.product.id.replace(
        "gid://shopify/Product/",
        ""
      ),
      imageUrl:
        data.productVariant.product?.featuredMedia?.preview?.image?.url || "",
    };
  } catch (err) {
    throw new Error(
      "Failed to get shopify product info via variant id reason -->" +
        err.message
    );
  }
};
export { getShopifyCustomerDetailsViaPhone, getShopifyProductInfoViaVariantId };
