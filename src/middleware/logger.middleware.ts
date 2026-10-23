
import pinoHttp from "pino-http";
import logger from "../config/logger";

const getSafePath = (url?: string) => {
  if (!url) return "/";

  return url.split("?")[0];
};

const httpLogger = pinoHttp({
  logger,

  customLogLevel(_req, res, err) {
    if (err || res.statusCode >= 500) {
      return "error";
    }

    if (res.statusCode >= 400) {
      return "warn";
    }

    return "info";
  },

  customSuccessMessage(req, res) {
    return `${req.method} ${getSafePath(req.url)} completed with ${res.statusCode}`;
  },

  customErrorMessage(req, res) {
    return `${req.method} ${getSafePath(req.url)} failed with ${res.statusCode}`;
  },
});

export default httpLogger;
