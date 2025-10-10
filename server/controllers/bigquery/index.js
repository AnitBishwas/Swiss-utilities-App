/**
 * Create big query event
 * @typedef {object} payload
 * @property {string} name - Event name
 * @typedef {object} parameters - Event parameters
 * @property {string} name - parameter name
 * @property {any} value - parameter value
 */

const createBigQueryEvent = async ({ name, parameters }) => {
  try {
  } catch (err) {
    console.log("Failed to create big query event reason -->" + err.message);
  }
};

export default createBigQueryEvent;
