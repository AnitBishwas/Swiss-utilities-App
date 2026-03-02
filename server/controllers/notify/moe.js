import nodebase64 from "nodejs-base64-converter";

/**
 * create moengage events
 * @typedef {object} payload
 * @property {string} eventName - event name
 * @property {string} customerPhone - customer phone number
 * @property {object} params - data parameters
 */
const createMoengageEvent = async ({ eventName, customerPhone, params }) => {
  try {
    console.log("trying to create moengage event : ", eventName, customerPhone);
    if (!customerPhone) {
      throw new Error("Phone number missing");
    }
    const moeUrl = process.env.MOE_URL;
    const username = process.env.MOE_WORKSPACE_ID;
    const endpoint = `${moeUrl}/v1/event/${username}`;
    const payload = {
      type: "event",
      customer_id: customerPhone,
      actions: [
        {
          action: eventName,
          attributes: { ...params },
        },
      ],
    };
    const request = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${generateMoenagageEncodedAuthKey()}`,
        "X-Forwarded-For": null,
      },
      body: JSON.stringify(payload),
    });
    const response = await request.json();
    console.log("Create moengage event --> " + eventName);
  } catch (err) {
    console.log("Failed to cretae moengage event reason -->" + err.message);
  }
};

const createMoengageBackInStockBusinessEvent = async () => {
  try {
    const moeUrl = process.env.MOE_URL;
    const username = process.env.MOE_WORKSPACE_ID;
    const endpoint = `${moeUrl}/v1.0/business_event`;
    const payload = {
      event_name: "back_in_stock",
      event_attributes: [
        {
          attribute_name: "variantId",
          attribute_data_type: "int",
        },
        {
          attribute_name: "productId",
          attribute_data_type: "int",
        },
        {
          attribute_name: "productTitle",
          attribute_data_type: "string",
        },
        {
          attribute_name: "variantTitle",
          attribute_data_type: "string",
        },
        {
          attribute_name: "imageUrl",
          attribute_data_type: "string",
        },
      ],
      created_by: "anit.biswas@swissbeauty.in",
    };
    const request = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${generateMoenagageBusinessEncodedAuthKey()}`,
        "X-Forwarded-For": null,
      },
      body: JSON.stringify(payload),
    });
    const response = await request.json();
    console.dir(response, { depth: null });
  } catch (err) {
    console.log(
      "Failed to create moengage business event reason -->" + err.message
    );
  }
};
/**
 * Generate base64 encoded auth key
 * @returns {string} - auth key
 */
const generateMoenagageEncodedAuthKey = () => {
  try {
    const username = process.env.MOE_WORKSPACE_ID;
    const password = process.env.MOE_API_KEY;
    if (!username || !password) {
      throw new Error("Required parameter missing");
    }
    const base64Pass = nodebase64.encode(`${username}:${password}`);
    return base64Pass;
  } catch (err) {
    throw new Error("failed to generate encoded auth key -->" + err.message);
  }
};

/**
 * Generate base64 encoded auth key
 * @returns {string} - auth key
 */
const generateMoenagageBusinessEncodedAuthKey = () => {
  try {
    const username = process.env.MOE_WORKSPACE_ID;
    const password = process.env.MOE_BUSINESS_KEY;
    if (!username || !password) {
      throw new Error("Required parameter missing");
    }
    const base64Pass = nodebase64.encode(`${username}:${password}`);
    return base64Pass;
  } catch (err) {
    throw new Error("failed to generate encoded auth key -->" + err.message);
  }
};

export {
  createMoengageEvent,
  createMoengageBackInStockBusinessEvent,
  generateMoenagageBusinessEncodedAuthKey,
};
