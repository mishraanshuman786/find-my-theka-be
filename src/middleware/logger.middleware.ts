import pinoHttp from "pino-http";

import logger from "../config/logger";

const httpLogger=pinoHttp({
    logger
});

export default httpLogger;