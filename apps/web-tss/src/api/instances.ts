import ky from "ky";
import { BASE_URL, BASE_URL_V2 } from "./config";

const mainApi = ky.create({
  prefixUrl: BASE_URL,
  hooks: {
    beforeRequest: [
      async (request) => {
        // request.headers.set("Authorization", `Bearer ${token}`);
      },
    ],
  },
});
const mainApiV2 = ky.create({ prefixUrl: BASE_URL_V2 });

export default mainApi;
export { mainApi, mainApiV2 };
