'use strict';
const axios = require('axios');
const logger = require('../logging/logger');
class TwilioApiHelper {
    async getWorkerAvailability(url) {
        try {
            await logger.info('Url is ' + url);
            return axios.get(url)
                .then(function(response) {
                    logger.info(response.status);
                    return response.data;
                })
                .catch(function(e) {
                    logger.error('TwilioApiHelper readService workerAvailable', e);
                });
        } catch (e) {
            await logger.error('TwilioApiHelper readService workerAvailable', e);
        }
    }

    async storeWorkers(url) {
        try {
            await logger.info('Url is ' + url);
            return axios.post(url)
                .then(function(response) {
                    logger.info(response.status);
                    return response.status;
                })
                .catch(function(e) {
                    logger.error('WebChat store workers readService axios.post', e);
                });
        } catch (e) {
            await logger.error('WebChat store workers readService', e);
        }
    }
}
const twilioApiHelper = new TwilioApiHelper();
module.exports = twilioApiHelper;
