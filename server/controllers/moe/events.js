/**
 * Create moengage event
 * @typedef {object} payload - event data
 * @property {string} customerId - customer id/ phone number
 * @property {string} name - Moengage event name
 * @typedef {object} parameters - parameters
 * @property {string} name - parameter name
 * @property {any} value - parameter value
 */

const createMoengageEvent = async ({ customerId, name, parameters }) => {
  try {
  } catch (err) {
    console.log("Failed to create moengage event reason -->" + err.message);
  }
};

export default createMoengageEvent;
