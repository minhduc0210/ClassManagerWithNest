import axios from "axios"
import { jwtDecode } from "jwt-decode"

//Base URL
const BASE_URL = process.env.REACT_APP_BASE_URL

async function tokenRefresh() {
  const token = localStorage.getItem("refresh-token")
  const result = await axios.post(
    `${BASE_URL}/users/refreshtoken`,
    {},
    { headers: { refreshtoken: token } }
  );
  return result;
}

export const api = axios.create()
api.interceptors.request.use(
  async (config) => {
    let accessToken = localStorage.getItem("access-token")
    let currentDate = new Date()
    const decodedToken = jwtDecode(accessToken)
    if (decodedToken.exp * 1000 < currentDate.getTime()) {
      const res = await tokenRefresh()
      localStorage.setItem("access-token", res.data.accessToken)
      localStorage.setItem("refresh-token", res.data.refreshToken)
      config.headers.authorization = `Bearer ${res.data.accessToken}`
    } else {
      config.headers.authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error, "sss")
  }
);

export const fetchRegister = async (inputs) => {
  const result = await axios.post(`${BASE_URL}/users/register`, inputs)
  return result;
};

export const fetchLogin = async (inputs) => {
  const result = await axios.post(`${BASE_URL}/users/login`, inputs);
  return result;
};

export const fetchUser = async () => {
  const result = await api.get(`${BASE_URL}/users/loggedUser`);
  return result;
};

export const fetchLogout = async (userID) => {
  if (userID !== undefined) {
    const result = await axios.get(`${BASE_URL}/users/logout/${userID}`);
    return result;
  }
};

export const fetchUpdateUser = async (userID, inputs) => {
  if (userID !== undefined) {
    const result = await api.put(`${BASE_URL}/users/${userID}`, inputs);
    return result;
  }
};

export const fetchChangePassword = async (inputs) => {
    const result = await api.put(`${BASE_URL}/users/profile/change-password`, inputs);
    return result;
};

export const fetchResetPassword = async (inputs) => {
  const result = await axios.post(`${BASE_URL}/users/reset-password`, inputs);
  return result;
};

export const fetchVerifyPassword = async (inputs) => {
  const result = await axios.post(`${BASE_URL}/users/verify-password`, inputs);
  return result;
};