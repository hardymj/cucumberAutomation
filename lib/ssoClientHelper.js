'use strict';

const axios = require('axios');
const tunnel = require('tunnel');
const https = require('https');

class SsoClientHelper {
    async getAccessToken(client, apiTokenUrl, testData) {
        let subjectToken = null;
        const agent = tunnel.httpsOverHttp({
            proxy: {
                host: 'peg-mcweb01',
                port: 3128,
            },
        });

        const axiosClient = axios.create({
            httpsAgent: agent,
            proxy: false,
        });

        const apiConfig = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': '*/*',
        };

        let data = new URLSearchParams();
        data.append('grant_type', 'password');
        data.append('username', testData.emailAddress);
        data.append('password', testData.userPassword);
        data.append('client_id', client.lbgTokenClientId);
        data.append('client_secret', client.ssoClientSecret);

        await axiosClient.post(
            apiTokenUrl,
            data,
            apiConfig, {
                httpsAgent: new https.Agent({
                    rejectUnauthorized: false,
                }),
            },
        ).then(function(response) {
            subjectToken = response.data.access_token;
        }).catch(function(error) {
            throw (error);
        });

        data = new URLSearchParams();
        data.append(
            'grant_type', 'urn:ietf:params:oauth:grant-type:token-exchange',
        );
        data.append('subject_token', subjectToken);
        data.append(
            'subject_token_type', 'urn:ietf:params:oauth:token-type:access_token',
        );
        data.append('client_id', client.exchangeTokenClientId);
        data.append('client_secret', client.ssoClientSecret);

        return await axiosClient.post(
            apiTokenUrl,
            data,
            apiConfig,
        ).then(function(response) {
            return response.data.access_token;
        }).catch(function(error) {
            throw (error);
        });
    }
}
const ssoClientHelper = new SsoClientHelper();
module.exports = ssoClientHelper;
