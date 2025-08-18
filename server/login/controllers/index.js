import fetch from "node-fetch";
import crypto from "crypto";
import { TextEncoder } from "util";

const sendGkOtp = async (phone) => {
  try {
    const gkCredentials = await generateGokwikToken();
    const { time, totp } = await parseTimeAndTotp(gkCredentials.data.keys);
    // console.log(time,totp);
    sendOtpRequestToGokwik({
      phone,
      token: gkCredentials.data.token,
      timestamp: gkCredentials.timestamp,
      time,
      totp,
    });
  } catch (err) {
    throw new Error("Failed to send otp reason -->" + err.message);
  }
};

const generateGokwikToken = async () => {
  try {
    const url = "https://gkx.gokwik.co/v3/auth/browser";
    const request = await fetch(url, {
      headers: {
        "gk-merchant-id": "19g6kl7ehjxrn",
        referer: "https://pdp.gokwik.co/",
        origin: "https://pdp.gokwik.co",
      },
    });
    const response = await request.json();
    if (!response.success) {
      throw new Error("Failed to generate token");
    }
    return response;
  } catch (err) {
    throw new Error("Failed to generate gokwik token reason -->" + err.message);
  }
};

/**
 * parse gokwik signature and timetamp
 * @param {array} keys
 */
const parseTimeAndTotp = (keys) => {
  try {
    const [e, t, o] = keys;
    let i = e + ";" + o;
    let xd = e;
    let kd = i;
    if (!xd || !kd) {
      throw new Error("missing xd and kd");
      return;
    }
    const stepSeconds = 30; // TOTP time step
    const nowMs = Date.now() + 0;
    const nowSeconds = Math.round(nowMs / 1000);
    const timeCounter = Math.floor(nowSeconds / stepSeconds);

    // Convert xd secret key into Uint8Array
    const keyBytes = Buffer.from(xd, "utf-8");

    // 8-byte buffer with counter in last 4 bytes (big-endian)
    const buffer = Buffer.alloc(8);
    buffer.writeUInt32BE(timeCounter, 4);

    // kd suffix after ";"
    const kdSuffix = kd.split(";")[1];
    const kdBytes = new TextEncoder().encode(kdSuffix);

    // Merge counter buffer and kd suffix
    const dataToSign = Buffer.concat([buffer, Buffer.from(kdBytes)]);

    // Generate HMAC-SHA256 signature
    const hmac = crypto.createHmac("sha256", keyBytes);
    hmac.update(dataToSign);
    const signature = hmac.digest();

    // Dynamic truncation
    const offset = signature[signature.length - 1] & 0x0f;
    const truncatedHash = signature.readUInt32BE(offset) & 0x7fffffff;

    // Reduce to 6 digits with digit shifting
    const baseCode = (truncatedHash % 1_000_000)
      .toString()
      .padStart(6, "0")
      .split("")
      .map((digit, index) => (parseInt(digit, 10) + index) % 10)
      .join("");

    // Add constant salt and wrap to 6 digits
    const salt = 794;
    const finalCode = (parseInt(baseCode, 10) + salt) % 1_000_000;

    return {
      time: timeCounter,
      totp: finalCode.toString().padStart(6, "0"),
    };
  } catch (err) {
    throw new Error("Failed to parse time and totp reason --->" + err.message);
  }
};

const sendOtpRequestToGokwik = async ({
  phone,
  token,
  timestamp,
  time,
  totp,
}) => {
  try {
    const url = `https://gkx.gokwik.co/v3/gkstrict/auth/otp/send`;
    const headers = {
      "Content-Type": "application/json",
      "gk-merchant-id": "19g6kl7ehjxrn",
      "kp-integration-type": "PLUGIN",
      "gk-version": "20250814112031793",
      Authorization: token,
      "gk-udf-1": new Date(timestamp).getTime() - Date.now(),
      "gk-signature": totp.toString().padStart(6, "0"),
      "gk-timestamp": time,
      Referer: "https://pdp.gokwik.co/",
      Origin: "https://pdp.gokwik.co/",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-site",
    };
    const request = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        phone,
        country: "IN",
      }),
    });
    const response = await request.json();
    console.log(response);
  } catch (err) {
    throw new Error(
      "Failed to send otp request to gokwik reason -->" + err.message
    );
  }
};
export { sendGkOtp };
