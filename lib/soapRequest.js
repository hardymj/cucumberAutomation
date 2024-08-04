'use strict';

const axios = require('axios');
const tunnel = require('tunnel');
const logger = require('../logging/logger');

module.exports = function soapRequest(url, headers, xml, timeout = 100000) {
    const agent = tunnel.httpsOverHttp({
        proxy: {
            host: 'peg-proxy01.insurance.financial.local',
            port: 80,
        },
    });

    return new Promise((resolve, reject) => {
        axios({
            method: 'post',
            url,
            headers,
            data: xml,
            timeout,
            httpsAgent: agent,
        })
            .then((response) => {
                resolve({
                    body: response.data,
                    statusCode: response.status,
                });
            })
            .catch((error) => {
                if (error.response) {
                    logger.error(`SOAP FAIL: ${error}`);
                    reject(error.response.data);
                } else {
                    logger.error(`SOAP FAIL: ${error}`);
                    reject(error);
                }
            });
    });
};
