import axios from "axios";

const API = "http://localhost:8080/api";

export const logViolation = async (data, token) => {
  try {
    const res = await axios.post(`${API}/violation/log`, data, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return res.data;
  } catch (err) {
    console.error("Violation API Error:", err.response?.data || err.message);
  }
};