import { handleApiRequest } from "../server/api.mjs";

export default async function handler(req, res) {
  return handleApiRequest(req, res);
}
