import { BigQuery } from "@google-cloud/bigquery";

/**
 * Insert data into bigquery
 * @param {object} data
 */
const insertRowsAsStream = async (data) => {
  const datasetId = process.env.DATASET_ID;
  const tableId = process.env.TABLE_ID;
  const credentials = JSON.parse(process.env.CREDS);
  const projectId = process.env.PROJECT_ID;
  try {
    const rows = [data];
    const bigquery = new BigQuery({
      projectId: projectId,
      credentials: credentials,
    });
    const insertion = await bigquery
      .dataset(datasetId)
      .table(tableId)
      .insert(rows);
    console.log(`Inserted ${rows.length} rows`, insertion);
  } catch (err) {
    console.dir(err, {
      depth: null,
    });
  }
};

/**
 * transform data into bigquerySchema
 * @param {object} rawEvent - containg event details and stuff
 * @param {*} options
 * @returns
 */
const transformToBigQuerySchema = (rawEvent, options = {}) => {
  const {
    userId = null,
    deviceId = null,
    sessionId = null,
    timestamp = Date.now(), // current timestamp in ms
    event_date = new Date().toISOString(),
  } = options;
  const eventName = rawEvent?.eventName || "unknown_event";
  // Exclude top-level fields that aren't event_params
  const excludeKeys = new Set([
    "eventName",
    "timestamp",
    "user_id",
    "device_id",
    "sessionId",
  ]);

  function convertValue(value) {
    if (typeof value === "string") {
      return { string_value: value };
    } else if (typeof value === "number") {
      // Distinguish float vs int
      return Number.isInteger(value)
        ? { int_value: value }
        : { float_value: value };
    } else if (typeof value === "boolean") {
      return { string_value: value.toString() }; // Store as string
    } else {
      return { string_value: JSON.stringify(value) }; // Store nested/complex objects as JSON
    }
  }

  const eventParams = Object.entries(rawEvent)
    .filter(([key]) => !excludeKeys.has(key))
    .map(([key, value]) => ({
      key,
      value: convertValue(value),
    }));

  return {
    timestamp,
    event_name: eventName,
    user_id: userId,
    device_id: deviceId,
    session_id: sessionId,
    event_params: eventParams,
    event_date,
  };
};

/**
 * Create big query event
 * @typedef {object} payload
 * @property {string} name - Event name
 * @typedef {object} parameters - Event parameters
 * @property {string} name - parameter name
 * @property {any} value - parameter value
 */

const createServerEvent = async ({ eventName = "", params = {} }) => {
  try {
    console.log("creating server event", params, eventName);
    const parsedData = transformToBigQuerySchema({
      eventName,
      ...params,
    });
    const insertData = await insertRowsAsStream(parsedData);
    console.log("inserted server event --------->", eventName);
  } catch (err) {
    console.log("Failed to create server event reason -->" + err.message);
  }
};

export default createServerEvent;
