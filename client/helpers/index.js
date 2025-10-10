const getSaleData = async () => {
  try {
    const url = "/api/apps/sale/status";
    const request = await fetch(url);
    const data = await request.json();
    if (!data.ok) {
      throw new Error("Failed to get sale data");
    }
    return data;
  } catch (err) {
    throw new Error("Failed to get salesm data reason -->" + err.message);
  }
};

const enableSale = async (payload) => {
  try {
    const url = `/api/apps/sale/enable`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const resposne = await request.json();
    console.log(resposne);
  } catch (err) {
    throw new Error("Failed to enable sale reason -->" + err.message);
  }
};
const disableSale = async () => {
  try {
    const url = `/api/apps/sale/disable`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const resposne = await request.json();
    console.log(resposne);
  } catch (err) {
    throw new Error("Failed to enable sale reason -->" + err.message);
  }
};
const updateTags = async (payload) => {
  try {
    const url = `/api/apps/sale/updateTags`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const resposne = await request.json();
    console.log(resposne);
  } catch (err) {
    throw new Error("Failed to update tags reason -->" + err.message);
  }
};
const removeTags = async () => {
  try {
    const url = `/api/apps/sale/removeTags`;
    const request = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    const resposne = await request.json();
    console.log(resposne);
  } catch (err) {
    throw new Error("Failed to remove tags reason -->" + err.message);
  }
};
export { getSaleData, enableSale, disableSale, updateTags, removeTags };
