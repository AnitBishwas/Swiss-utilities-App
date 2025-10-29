const originalFetch = global.fetch;

global.fetch = async (url, options = {}) => {
  const method = options.method || "GET";
  console.log(`/n👉 [Shopify Fetch] ${method} ${url}`);

  if (options.headers) {
    console.log("Headers: ", options.headers);
  }
  if (options.body) {
    console.log("Body: ", options.body.slice(0, 500));
  }
  const start = Date.now();

  try {
    const response = await originalFetch(url, options);
    const duration = Date.now() - start;
    console.log(`👉 [Response] ${response.status} (${duration} ms) ${url}`);

    // Optional: clone and log short response content
    const cloned = response.clone();
    const text = await cloned.text();
    console.log("Response snippet:", text.slice(0, 200));
    return response;
  } catch (err) {
    console.error(`❌ [Fetch Error] ${method} ${url}:`, err.message);
    throw err;
  }
};
