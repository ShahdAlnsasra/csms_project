// frontend/src/api/api.js
import axios from "axios";

const API = axios.create({
  baseURL: "http://127.0.0.1:8000/api/",  // same as you use in browser
});

export default API;
export async function fetchDepartments() {
  const res = await API.get("departments/");
  console.log("fetchDepartments URL =", res.request?.responseURL);
  console.log("fetchDepartments res.data =", res.data);
  return res.data;
}

export async function login(email, password) {
  const res = await API.post("login/", { email, password });
  return res.data; // user info
}
