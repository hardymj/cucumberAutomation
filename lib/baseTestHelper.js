'use strict';

const logger = require('../logging/logger');
const config = require('config');
const systemClients = config.get('clients');
const environment = config.get('environment');
const devTag = process.env.DEV_TAG;
const path = require('path');
const htmlReporter = require('../htmlReporter');
const tdsHelper = require('../lib/tdsAPIHelper');
const chai = require('chai');
const assert = chai.assert;

class BaseTestHelper {
    async setupReporter() {
        await logger.info('In setupReporter');
        this.screenshotReporter = new htmlReporter.Reporter({
            path: config.get('jasmineResultsPath'),
            showSuspectLine: false,
            driver: this.driver,
        });
    }

    async afterEachTest() {
        await logger.info('In afterEachTest');
        await this.screenshotReporter.afterEachTest();
    }

    async logInformation(log) {
        if (this.screenshotReporter != undefined) {
            await this.screenshotReporter.logInformationToReport(log);
        }
    }

    async logAccessibilityInformation(log, errorContext) {
        if (this.screenshotReporter != undefined) {
            await this.screenshotReporter.logAccessibilityInformationToReport(
                log,
                errorContext,
            );
        }
    }

    async testDataReport(dataString) {
        this.screenshotReporter.testDataString(dataString);
    }

    async setDriverForScreenshotReporter(driver) {
        await logger.info('In setDriverForScreenshotReporter');
        this.screenshotReporter.setDriverForScreenshotReporter(driver);
    }

    async setupJasmine() {
        await logger.info('In setupJasmine');
        await logger.info(`browser is ${config.get('browser')}`);
        await this.setupReporter();
    }

    async startTestsForClient(clientToTest) {
        const folder = await this._getBrandNameFromPath(clientToTest);
        let client = systemClients.find(
            (c) => c.folder.toLowerCase() == folder.toLowerCase(),
        );
        client = {...client};

        if (environment === 'dev') {
            const clientName = client.name == 'budget' ?
                'budgetinsurance' :
                client.name;

            client.motorQuoteApplicationPath =
        `/${clientName}_${client.baseMotorQuoteApplicationPath}_${devTag}/`;
            client.householdQuoteApplicationPath =
        `/${clientName}_${client.baseHouseholdQuoteApplicationPath}_${devTag}/`;
            client.myAccountApplicationPath =
        `/${clientName}_${client.baseMyAccountApplicationPath}_${devTag}/`;
        } else {
            client.motorQuoteApplicationPath =
        `${client.baseMotorQuoteApplicationPath}`;
            client.householdQuoteApplicationPath =
        `/${client.baseHouseholdQuoteApplicationPath}/`;
            client.myAccountApplicationPath =
        `/${client.baseMyAccountApplicationPath}/`;
        }

        if (environment === 'Live') {
            client.name = client.liveName;
        }
        Object.preventExtensions(client);

        return client;
    }

    async buildDriver() {
        await logger.info('In buildDriver');
        const browserConfig = await this._browserToRunAgainst(
            config.get('browser'),
        );
        await logger.info(`environment:${process.env.NODE_ENV},` +
      `browserConfig:${browserConfig}`);
        const d = require(`../${browserConfig}`);
        await d.buildDriver();
    }

    async createDriver() {
        await logger.info('In createDriver');
        const browserConfig = await this._browserToRunAgainst(
            config.get('browser'),
        );
        await logger.info(`environment:${process.env.NODE_ENV},` +
      `browserConfig:${browserConfig}`);
        try {
            const d = require(`../${browserConfig}`);

            this.driver = await d.returnBrowser();
            await this.setDriverForScreenshotReporter(this.driver);
        } catch (e) {
            await logger.error('baseTestHelper createDriver', e);
            await assert.fail(e);
        }
        return this.driver;
    }

    async getPage(journey, brandFolderName, pageName) {
        await logger.info('In getPage - ' + pageName);
        const brandPagesFolder = `../journeys/${journey}/${brandFolderName}/pages/`;
        const genericPagesFolder = `../features/pages/`;

        let brandSpecificPage; let genericPage;
        try {
            brandSpecificPage = require(brandPagesFolder + pageName);
            return brandSpecificPage;
        } catch (err) {
            genericPage = require(genericPagesFolder + pageName);
            return genericPage;
        }
    }

    async _getBrandNameFromPath(pathName) {
        await logger.info('In _getBrandNameFromPath');
        return pathName.split(path.sep).slice(-2)[0];
    }

    async filterItems(arr, query) {
        return arr.filter(function(el) {
            return el.toLowerCase().indexOf(query.toLowerCase()) !== -1;
        });
    }

    async _browserToRunAgainst(defaultBrowser) {
        await logger.info('In _browserToRunAgainst');
        const fs = require('fs');

        if (!process.env.BROWSER) {
            if (fs.existsSync('config/' + defaultBrowser + '.js')) {
                return 'config/' + defaultBrowser + '.js';
            }

            await logger.error('In _browserToRunAgainst error');
            await assert.fail(`Unknown Browser config: ${defaultBrowser}`);
            throw new Error(`Unknown Browser config: ${defaultBrowser}`);
        }

        if (fs.existsSync('config/' + process.env.BROWSER + '.js')) {
            return 'config/' + process.env.BROWSER + '.js';
        }

        const fullName = this.screenshotReporter.currentSpec.fullName;
        if (fullName.includes('MotorQuote 4')) {
            return 'config/activeConfig/lambda_Chrome.js';
        }

        function filterItems(arr, query) {
            return arr.filter(function(el) {
                return el.toLowerCase().indexOf(query.toLowerCase()) !== -1;
            });
        }

        const activeConfigFiles = fs.readdirSync('config/activeConfig/');
        const browserSpecificConfigFiles = filterItems(activeConfigFiles, process.env.BROWSER + '_');

        await logger.info(`DEVICEBROWSER = ${process.env.DEVICEBROWSER}`);

        if (process.env.DEVICEBROWSER) {
            const deviceBrowserFile = browserSpecificConfigFiles.find(
                (element) => element.toLowerCase().includes(process.env.DEVICEBROWSER.toLowerCase()));

            if (fs.existsSync('config/activeConfig/' + deviceBrowserFile)) {
                return 'config/activeConfig/' + deviceBrowserFile;
            }

            await logger.error('In _browserToRunAgainst error');
            await assert.fail(`Unknown Browser config: ${deviceBrowserFile}`);
            throw new Error(`Unknown Browser config: ${deviceBrowserFile}`);
        }

        const randomNumber = Math.floor(Math.random() * browserSpecificConfigFiles.length);
        return 'config/activeConfig/' + browserSpecificConfigFiles[randomNumber];
    }

    async _isValidUrl(testUrl) {
        await logger.info('In _isValidUrl');
        if (testUrl === '') {
            const errMsg = 'URL has not loaded. Test did not start.';
            await logger.error(`Error in '_isValidUrl': ${errMsg}`);
            throw errMsg;
        } else {
            return true;
        }
    }

    async runCommonTestStartup(driver, testData, testUrl) {
        this._isValidUrl(testUrl);

        try {
            driver.get(testUrl);
        } catch (e) {
            await logger.error('Error getting driver', e);
        }

        await tdsHelper.apiCall(testData);
    }
}

const baseTestHelper = new BaseTestHelper();
module.exports = baseTestHelper;
