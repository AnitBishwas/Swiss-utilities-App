/**
 *
 * @typedef {object} param0
 * @property {string} name - name of the log
 * @property {string} type - enums for type Ex - info,error
 * @property {string} message - message associated with the logs
 */

const logsStorage = async ({ name, type, message }) => {
  try {
    const payload = {
      event_name: "logs",
    };
  } catch (err) {
    throw new Error("Failed to store logs");
  }
};

export default logsStorage;
