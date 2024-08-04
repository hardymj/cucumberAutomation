'use strict';

const config = require('config');
const van = 'Van';
const logger = require('../logging/logger');

class UrlHelper {
    getHouseholdQuoteSystemUrl(client) {
        return this._getClientUrl(
            client,
            'hhSystemUrl',
            client.householdQuoteApplicationPath,
        );
    }

    getHouseholdQuoteReplaceUrl(client) {
        return this._getHHClientUrl(
            client,
            'hhReplaceUrl',
            client.householdQuoteApplicationPath,
        );
    }

    getMotorQuoteRetrieveQuoteUrl(client) {
        return this._getClientUrl(
            client,
            'retrieveQuote',
            client.motorQuoteApplicationPath,
        );
    }

    getHouseholdQuoteRetrieveQuoteUrl(client) {
        return this._getHHClientUrl(
            client,
            'hhRetrieveQuote',
            client.householdQuoteApplicationPath,
        );
    }

    getPingUrl(client) {
        return this._getClientUrl(
            client,
            'pingRedirectorUrl',
            client.motorQuoteApplicationPath,
        );
    }

    getMotorQuoteSystemUrl(client, testData) {
        return this._getClientUrl(
            client, 'systemUrl',
            client.motorQuoteApplicationPath,
            testData.vehicleType,
        );
    }

    getMotorQuoteDirectToSiteUrl(client, vehicleType) {
        return this._getClientUrl(
            client,
            'direct',
            client.motorQuoteApplicationPath,
            vehicleType,
        );
    }

    getHouseholdQuoteDirectToSiteUrl(client) {
        return this._getClientUrl(
            client,
            'OLSSdirect',
            client.householdQuoteApplicationPath,
        );
    }

    getMyAccountLoginUrl(client) {
        const loginUrl = client.myAccountLoginUrlBrandName ?
            this._getClientUrl(
                client,
                'loginUrl',
                client.myAccountApplicationPath,
                null,
                client.myAccountLoginUrlBrandName,
            ) :
            this._getClientUrl(client, 'loginUrl', client.myAccountApplicationPath);

        return loginUrl;
    }

    getSsoLoginUrl(client) {
        const loginUrl = client.myAccountLoginUrlBrandName ?
            this._getClientUrl(
                client,
                'loginUrl',
                client.myAccountApplicationPath,
                null,
                client.myAccountLoginUrlBrandName,
            ) :
            this._getClientUrl(client, 'loginUrl', client.myAccountApplicationPath);

        return loginUrl;
    }

    getTwilioFlexLogInUrl(twilioFlexLogInUrl) {
        return config.get(twilioFlexLogInUrl);
    }

    getHouseHoldQuoteReplaceUrl(client, testData) {
        return this._getClientUrl(
            client,
            'replaceUrl',
            client.motorQuoteApplicationPath,
            testData.vehicleType,
        );
    }

    getMotorQuoteReplaceUrl(client, testData) {
        return this._getClientUrl(
            client,
            'replaceUrl',
            client.motorQuoteApplicationPath,
            testData.vehicleType,
        );
    }

    getMotorQuoteUrl(client, url) {
        return this._getClientUrl(client, url, client.motorQuoteApplicationPath);
    }

    getHouseholdQuoteUrl(client, url) {
        return this._getClientUrl(
            client,
            url,
            client.householdQuoteApplicationPath,
        );
    }

    getPostSalesRegistrationUrl(client, encryption) {
        const loginUrl = client.myAccountLoginUrlBrandName ?
            this._getClientUrl(
                client,
                'postSalesRegistrationUrl',
                encryption,
                null,
                client.myAccountLoginUrlBrandName,
            ) :
            this._getClientUrl(client, 'postSalesRegistrationUrl', encryption);
        return loginUrl;
    }

    getSsoShortRegistrationUrl(client, encryption, hasEmail) {
        return this._getSsoClientUrl(client, 'ssoShortRegUrl', encryption, hasEmail);
    }

    setYourVehicleUrl(vehicleType, url) {
        return vehicleType == van ?
            config.get(url).replace('YourCar', 'YourVan') :
            config.get(url);
    }

    _getClientUrl(
        client,
        url,
        applicationPath,
        dataVehicleType,
        altUrlClientName,
    ) {
        try {
            const systemUrl = config.get(url);
            const isVan = this._checkIsVan(dataVehicleType);
            const vehicleType = isVan ? 'Van' : 'Car';
            const maskCode = isVan ?
                client.vanRetrieveQuoteCode :
                client.retrieveQuoteCode;
            const baseUrl = altUrlClientName ? altUrlClientName : client.name;

            const returnValue = systemUrl
                .replace('{Client}', baseUrl)
                .replace('{VehicleType}', vehicleType)
                .replace('{Mask}', maskCode)
                .replace('{ApplicationPath}', applicationPath);
            return returnValue;
        } catch (err) {
            logger.info(`Failed inside _getClientUrl ${err}`);
            return null;
        }
    }

    _getSsoClientUrl(
        client,
        url,
        encryptedPolicyId,
        hasEmail,
    ) {
        const systemUrl = config.get(url);
        const baseUrl = client.name;

        const returnValue = systemUrl
            .replace('{Client}', baseUrl)
            .replace('{PolicyId}', encryptedPolicyId)
            .replace('{HasEmail}', hasEmail);

        return returnValue;
    }

    _getHHClientUrl(client, url, applicationPath) {
        const systemUrl = config.get(url);

        const returnValue = systemUrl
            .replace('{Client}', client.name)
            .replace(/\/{ApplicationPath}\//i, applicationPath);

        return returnValue;
    }

    _getSSCClientUrl(client, url, applicationPath) {
        const systemUrl = config.get(url);

        const returnValue = systemUrl
            .replace('{Client}', client.name)
            .replace('{Mask}', client.retrieveQuoteCode)
            .replace(/\/{ApplicationPath}\//i, applicationPath);

        return returnValue;
    }

    _getSsoClientLoginUrl(client, accessToken) {
        const systemUrl = config.get('ssoLoginUrl');

        const returnValue = systemUrl
            .replace('{Client}', client.name)
            .replace('\/{ApplicationPath}', client.myAccountApplicationPath)
            .replace('{Token}', accessToken);
        return returnValue;
    }

    async buildSsoRegQueryString(client, testData) {
        const policy = await this.getSsoPolicyIdentifier(testData);
        await this.getShortRegQueryParams(client, apiShortRegUrl, policy, testData);
        const hasEmail = true;
        const policyIdentifier = policy.substring(10, 12);
        const customerAccountId = policy.substring(0, 9);

        const ssoQueryString = `customerAccountId=${customerAccountId}&identifier=${policyIdentifier}&hasEmail=${hasEmail}`;

        return ssoQueryString;
    }

    _getSsoClientShortRegUrl(client, encryption) {
        const systemUrl = config.get('ssoShortRegUrl');

        const returnValue = systemUrl
            .replace('{Client}', client.name)
            .replace('\/{ApplicationPath}', client.myAccountApplicationPath);


        return returnValue;
    }

    _checkIsVan(dataVehicleType) {
        return dataVehicleType == van;
    }
}
const urlHelper = new UrlHelper();
module.exports = urlHelper;
