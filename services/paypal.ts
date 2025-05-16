import axios from "axios";

const PAYPAL_API_URL = "https://api-m.sandbox.paypal.com";
const PAYPAL_CLIENT_ID =
  "AfQlYUz6omwna7XDh1DU4thyTnvdxAOMjoSheac8tqoHHBSiVQDHausDhnw2vlLTxVopqLdMkD08MmKk";
const PAYPAL_SECRET =
  "EFb-BkX2fltQO2P7hP68hNBje0_k5A9nIxIDZ5oKRYGX7FuJWkw7KJcz6zKO0FRNqIDSq9NlkTpUWOCw";

const NGROK_URL = "https://dear-snapper-explicitly.ngrok-free.app";
const RETURN_URL = `${NGROK_URL}/success.html`;
const CANCEL_URL = `${NGROK_URL}/cancel.html`;

export const getPayPalAccessToken = async () => {
  try {
    const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`);
    const response = await axios.post(
      `${PAYPAL_API_URL}/v1/oauth2/token`,
      "grant_type=client_credentials",
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Basic ${auth}`,
        },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error("Error getting PayPal access token:", error);
    throw error;
  }
};

export const createPayPalOrder = async (
  amount: number,
  currency: string = "PHP"
) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders`,
      {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toString(),
            },
          },
        ],
        application_context: {
          return_url: RETURN_URL,
          cancel_url: CANCEL_URL,
          brand_name: "Praktisado Gym",
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw error;
  }
};

export const capturePayPalPayment = async (orderId: string) => {
  try {
    const accessToken = await getPayPalAccessToken();
    const response = await axios.post(
      `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Error capturing PayPal payment:", error);
    throw error;
  }
};
