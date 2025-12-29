import axios from "axios";

const api = axios.create({
  baseURL: "/api/",
});

export default async function API(
  url,
  method = "GET",
  data = null,
  isFile = false
) {
  const response = await api({
    url,
    method,
    data,
    responseType: isFile ? "blob" : "json",
  });

  return response.data;
}
