'use strict';

const config = require('config');
const logger = require('../logging/logger');
const axios = require('axios');
const https = require('https');

class IdentityServerHelper {
    async apiCall(path) {
        const maxRetries = config.get('getQuoteAttempts') || 2;
        let retryCount = 0;
        try {
            do {
                await logger.info(`Calling Identity Server attempt number ${retryCount}`);
                const response = await this.readService(
                    config.get('identityServerUrl') + path,
                );

                if (response.data.identityServerBrandNames) {
                    await logger.info('Identity Server Returned');
                    return response.data.identityServerBrandNames;
                }
                retryCount++;
            } while (retryCount < (maxRetries-1));

            await logger.error('Identity Server did not return a valid response');
            return;
        } catch (e) {
            await logger.error('Identity Server Helper apiCall', e);
        }
    }

    async readService(url) {
        try {
            await logger.info('Url is ' + url);
            return new Promise(
                (resolve, reject) => {
                    axios.get(url, {
                        httpsAgent: new https.Agent({
                            rejectUnauthorized: false,
                        }),
                    })
                        .then(function(response) {
                            return resolve(response);
                        });
                },
            );
        } catch (e) {
            await logger.error('Identity Service Helper readService', e);
        }
    }
}

const identityServerHelper = new IdentityServerHelper;
module.exports = identityServerHelper;
