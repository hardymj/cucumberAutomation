'use strict';

const config = require('config');
const logger = require('../logging/logger');
const axios = require('axios');

class MockPriceApiHelper {
    async setMockPrice(testData) {
        if (process.env.NODE_ENV == 'live' || process.env.NODE_ENV == 'uat') {
            return;
        }

        for (let i = 0; i < testData.policy.length; i++) {
            await logger.info(
                `Original prices for Policy ${i} is ${testData.policy[i].totalpremium}`,
            );
            testData.mockPrice.premium = testData.policy[i].totalpremium;
        }
        await logger.info(`Calling mockPrice for PolicyID ${testData.getPolicyId()} and price of ${testData.mockPrice.premium}`);
        await logger.info(`PolicyNumber :${testData.policyNumber}`);

        const url = config
            .get('mockPriceServiceUrl')
            .replace('{PolicyId}', testData.getPolicyId());
        const data = JSON.stringify(testData.mockPrice);
        return new Promise((resolve, reject) => {
            axios
                .post(
                    url,
                    data,
                    {
                        headers: {
                            'Authorization': testData.policyNumber,
                            'Content-Type': 'application/json',
                        },
                    },
                )
                .then(function(response) {
                    resolve(response);
                })
                .catch(function(e) {
                    if (e.response) {
                        logger.error(`MockPriceApiHelper returned status: ${e.response.status}, with body: ${e.response.data}`);
                    } else if (e.request) {
                        logger.error(`MockPriceApiHelper failed to return a response from the following request: ${JSON.parse(e.request)}`);
                    } else {
                        logger.error(`MockPriceApiHelper request setup failed: ${e.toJSON()}`);
                    }
                    reject();
                });
        });
    }
}

const mockPriceApiHelper = new MockPriceApiHelper;
module.exports = mockPriceApiHelper;
