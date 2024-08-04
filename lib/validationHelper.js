'use strict';

const config = require('config');
const {By} = require('selenium-webdriver');
const logger = require('../logging/logger');
const wait = require('./waitHelper');
const interactionHelper = require('./interactionHelper');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

class ValidationHelper {
    async validateFieldTextByClass(
        field,
        value,
        errorContext,
        driver,
        ignoreCase = false,
    ) {
        const element = By.className(field);
        await this._waitOnAndValidateElement(
            element,
            value,
            errorContext,
            driver,
            ignoreCase,
        );
    }

    async validateLinkByDataTestId(dataTestId, value, errorContext, driver) {
        const element = await driver
            .findElement(By.css(`[data-testid="${dataTestId}"]`))
            .getAttribute('href');
        await expect(element.includes(value), `${errorContext} - Expected ${element} to contain ${value}`).to.equal(true);
    }

    async validateFieldTextByCSS(
        field,
        value,
        errorContext,
        driver,
        ignoreCase = false,
    ) {
        const element = By.css(field);
        await this._waitOnAndValidateElement(
            element,
            value,
            errorContext,
            driver,
            ignoreCase,
        );
    }

    async validateVisibleFieldTextByCSS(
        field,
        value,
        errorContext,
        driver,
        ignoreCase = false,
    ) {
        const selector = By.css(field);
        const elements = await driver.findElements(selector);

        let visibleElement;
        elements.forEach(function(element) {
            if (element.isDisplayed()) {
                visibleElement = element;
            }
        });

        const elementText = await visibleElement.getAttribute('innerText');
        const actualValue = ignoreCase ?
            elementText.toLowerCase().trim() :
            elementText.trim();
        const expectationFailureMessage =
      `${errorContext ? errorContext : ''} - ${field}`;
        const expectedValue = ignoreCase ? value.toLowerCase() : value;
        await expect(actualValue, expectationFailureMessage).to.equal(expectedValue);
    }

    async validateFieldTextByPartialLinkText(
        field,
        value,
        errorContext,
        driver,
        ignoreCase = false,
    ) {
        const element = By.partialLinkText(field);
        await this._waitOnAndValidateElement(
            element,
            value,
            errorContext,
            driver,
            ignoreCase,
        );
    }

    async validateFieldTextContainsByCSS(field, valueToContain, driver) {
        const actual = await driver.findElement(By.css(field)).getText();
        await expect(actual.includes(valueToContain), `Expected ${field} to contain ${valueToContain} but it was ${actual}`).to.equal(true);
    }

    async validateCurrencyFieldTextWithinXPercentByCSS(
        field,
        value,
        percentageTolerance,
        errorContext,
        driver,
    ) {
        const element = By.css(field);
        const pattern = /(-?\d+)(\d{3})/;
        value = value.replace(pattern, '$1,$2');
        await this._validateElementWithinXPercent(
            driver,
            element,
            value,
            percentageTolerance,
            errorContext,
        );
    }

    async validateFieldTextById(
        field,
        value,
        errorContext,
        driver,
        ignoreCase = false,
    ) {
        const element = By.id(field);
        await this._waitOnAndValidateElement(
            element,
            value,
            errorContext,
            driver,
            ignoreCase,
        );
    }

    async validateOnSamePage(substrUrl, errorContext, driver) {
        await logger.verbose(`In validateOnSamePage ${errorContext}`);
        const currentUrl = (await driver.getCurrentUrl()).toLowerCase();
        await logger.info(substrUrl + '>>' + currentUrl);
        if (currentUrl.includes(substrUrl.toLowerCase())) {
            return true;
        } else {
            return false;
        }
    }

    async validateUrlContains(
        substrUrl,
        errorContext,
        driver,
        timeoutOption = 'timeout',
    ) {
        try {
            const expectedUrl = substrUrl.toLowerCase();
            const timeout = config.get(timeoutOption);
            const endTime = new Date().getTime() + timeout;
            let currentUrl = '';
            do {
                currentUrl = (await driver.getCurrentUrl()).toLowerCase();
                await wait.waitForPageToReload(driver);
                if (currentUrl.includes(expectedUrl)) {
                    break;
                }
                // currentUrl = (await driver.getCurrentUrl()).toLowerCase();
            } while (new Date().getTime() < endTime);
            const errorContextPrefix = errorContext ? `${errorContext} - ` : '';
            const errMsg = `${errorContextPrefix}Waiting for URL to ` +
        `contain: "${expectedUrl}" but was: ${currentUrl}"`;
            await expect(currentUrl.includes(expectedUrl), errMsg).to.equal(true);
            if (!currentUrl.includes(expectedUrl)) {
                await assert.fail(errMsg);
                throw errMsg;
            }
        } catch (err) {
            await logger.verbose(err);
            throw err;
        }
    }

    async validateTitleContains(
        substrTitle,
        errorContext,
        driver,
        timeoutOption = 'timeout',
    ) {
        const expectedTitle = substrTitle.toLowerCase();
        const timeout = config.get(timeoutOption);
        const endTime = new Date().getTime() + timeout;
        let currentTitle = '';
        do {
            currentTitle = (await driver.getTitle()).toLowerCase();
            currentTitle = currentTitle.replace('&', 'and');
            await wait.waitForPageToReload(driver);
            if (currentTitle.includes(expectedTitle)) {
                break;
            }
            // currentTitle = (await driver.getTitle()).toLowerCase();
        } while (new Date().getTime() < endTime);
        const errorContextPrefix = errorContext ? `${errorContext} - ` : '';
        const errMsg = `${errorContextPrefix}Waiting for title to contain: ` +
      `"${expectedTitle}" but was: "${currentTitle}"`;
        await expect(currentTitle.includes(expectedTitle), errMsg).to.equal(true);
        if (!currentTitle.includes(expectedTitle)) {
            await assert.fail(errMsg);
        }
    }

    async getFieldValue(fieldName, driver) {
        const fieldExists = await interactionHelper.exists(driver, fieldName);
        let innerTextValue = null;
        if (fieldExists) {
            innerTextValue = await interactionHelper._getInnerText(fieldName, driver);
        }
        return innerTextValue;
    }

    async isNotPresent(field, errorContext, driver) {
        const errorMessage = errorContext ? `${errorContext} - ` : '' +
    `The element: "${field}" was still present when it should have disappeared.`;
        await driver.wait(
            async () => {
                const elements = await driver.findElements(field);
                if (elements.length <= 0) {
                    return true;
                }
                return false;
            },
            config.get('timeout'),
            errorMessage,
        );
    }

    async isNotPresentByCSS(field, errorContext, driver) {
        const errorMessage = errorContext ? `${errorContext} - ` : '' +
    `The element: "${field}" was still present when it should have disappeared.`;
        const element = By.css(field);
        await driver.wait(
            async () => {
                const elements = await driver.findElements(element);
                if (elements.length <= 0) {
                    return true;
                }
                return false;
            },
            config.get('timeout'),
            errorMessage,
        );
    }

    async isNotPresentByCSSRightNow(field, errorContext, driver) {
        const elements = await driver.findElements(By.css(field));
        if (elements.length > 0) {
            await expect(field).to.equal('not there but it was found.');
        }
    }

    async cssExists(field) {
        const element = By.css(field);
        return this.exists(element);
    }

    async checkUrlContainsAnyUrl(urlOne, urlTwo, driver, errorContext) {
        const timeout = config.get('longTimeout');
        const endTime = new Date().getTime() + timeout;
        let currentUrl = await driver.getCurrentUrl();
        currentUrl = currentUrl.toLowerCase();
        do {
            if (currentUrl.includes(urlOne) || currentUrl.includes(urlTwo)) {
                break;
            }
            currentUrl = await driver.getCurrentUrl();
        } while (new Date().getTime() < endTime);
        return currentUrl;
    }

    async validateUrlContainsAnyUrl(
        urlOne,
        urlTwo,
        urlThree,
        driver,
        errorContext,
    ) {
        const timeout = config.get('longTimeout');
        const endTime = new Date().getTime() + timeout;
        let currentUrl = await driver.getCurrentUrl();
        await logger.verbose(currentUrl);
        currentUrl = currentUrl.toLowerCase();
        urlOne = urlOne.toLowerCase();
        urlTwo = urlTwo.toLowerCase();
        urlThree = urlThree.toLowerCase();
        do {
            await wait.waitForPageToReload(driver);
            if (currentUrl.includes(urlOne.toLowerCase()) ||
        currentUrl.includes(urlTwo.toLowerCase()) ||
        currentUrl.includes(urlThree.toLowerCase()) && urlThree != ''
            ) {
                await logger.verbose(`Current Url ${currentUrl}`);
                break;
            }
            currentUrl = await driver.getCurrentUrl();
            currentUrl = currentUrl.toLowerCase();
        } while (new Date().getTime() < endTime);

        if (!currentUrl.includes(urlOne) &&
      !currentUrl.includes(urlTwo) &&
      !currentUrl.includes(urlThree)
        ) {
            await expect(currentUrl).to.equal(urlOne || urlTwo || urlThree);
        }
    }

    async validatefinalUrlList(urlOne, urlTwo, urlThree, driver) {
        const finalUrlList = [
            config.get('preRegistrationUrl'),
            config.get('myAccountUrl'),
            config.get('siteUnavailableUrl'),
            config.get('policyCreationPending'),
            config.get(urlOne),
            config.get(urlTwo),
            config.get(urlThree),
        ];

        const intermediateUrlWhiteList = [
            'paymentcardverification',
            'processingpayments',
            'ProcessingPaymentSuccessful',
        ];

        await this.validateJourneyGoesToFinalUrlAndIntermediateUrlsInWhiteList(
            finalUrlList,
            intermediateUrlWhiteList,
            driver,
        );
    }

    async validateJourneyGoesToFinalUrlAndIntermediateUrlsInWhiteList(
        finalUrlList,
        intermediateUrlWhiteList,
        driver,
    ) {
        const timeout = config.get('policyCreationTimeout');
        const endTime = new Date().getTime() + timeout;

        do {
            const currentUrl = (await driver.getCurrentUrl()).toLowerCase();

            let inFinalUrlList = false;
            finalUrlList.forEach((finalUrl) => {
                if (currentUrl.includes(finalUrl.toLowerCase())) {
                    inFinalUrlList = true;
                }
            });
            if (inFinalUrlList === true) {
                return;
            }

            let inIntermediateList = false;
            intermediateUrlWhiteList.forEach((intermediateUrl) => {
                if (currentUrl.includes(intermediateUrl.toLowerCase())) {
                    inIntermediateList = true;
                }
            });
            if (inIntermediateList === false) {
                await expect(false, `${currentUrl} not in intermediate list`).to.equal(true);
                await assert.fail(e);
            }
        } while (new Date().getTime() < endTime);
        await expect(false, `timed out waiting for final url`).to.equal(true);
        await assert.fail(e);
    }

    async _waitOnAndValidateElement(
        element,
        value,
        errorContext,
        driver,
        ignoreCase,
    ) {
        await wait.forElementToExist(element, errorContext, driver);
        await this._validateElement(
            element,
            value,
            errorContext,
            driver,
            ignoreCase,
        );
    }

    async _validateElement(field, value, errorContext, driver, ignoreCase) {
        let textContains = false;
        const maxTimes = 6;
        let count = 0;
        let elementText = '';
        let element;
        do {
            element = await driver.findElement(field);
            elementText = await element.getText();
            if (elementText.toLowerCase() == value.toLowerCase()) {
                await logger.info('elementText using getText was fine');
                textContains = true;
            } else {
                await logger.info('elementText using getText did not work');
                elementText = await driver.executeScript(`return arguments[0].value`, element);
                try {
                    if (elementText == null || elementText.toString().toLowerCase() != value.toLowerCase()) {
                        await logger.info('elementText using innerHTML');
                        elementText = await driver.executeScript(`return arguments[0].innerHTML`, element);
                    }
                    elementText = elementText.toString().trim();
                    if (elementText.toLowerCase() == value.toLowerCase()) {
                        textContains = true;
                    }
                } catch (err) {
                    await logger.info('');
                }
            }
            count++;
            await driver.sleep(100);
            if (maxTimes <= count) {
                textContains = true;
            }
        } while (textContains === false);

        const elements = await driver.findElements(field);
        await logger.info('elementText length >>' + elements.length + '>>' + elementText);


        if (elements.length > 1 && elementText == '') {
            for (let i = 0; i < elements.length; i++) {
                element = await elements[i];
                elementText = await element.getText();
                if (elementText.toLowerCase() == value.toLowerCase()) {
                    break;
                }
            }
        }
        await logger.info('elementText >>' + elementText);


        const expectationFailureMessage =
    `${errorContext ? errorContext : ''} - ${field}`;
        await expect(value.toLowerCase(), expectationFailureMessage).to.equal(elementText.toLowerCase());
    }

    async _validateElementWithinXPercent(
        driver,
        field,
        value,
        percentageTolerance,
        errorContext,
    ) {
        const regex = / /gi;
        const element = await driver.findElement(field);
        const elementText = await element.getText();
        await expect(elementText.replace(regex, ''))
            .toBeWithinXPercent(value, percentageTolerance, errorContext);
    }

    async validateValueWithinXPercent(value1, value2, percentageTolerance) {
        expect(value1).toBeWithinXPercent(value2, percentageTolerance);
    }

    async compareData(dataOne, dataTwo) {
        await expect(dataOne.toLowerCase()).to.equal(dataTwo.toLowerCase());
    }

    async compareDataValue(
        actualValue,
        expectedValue,
        expectationFailureMessage,
    ) {
        await expect(actualValue, expectationFailureMessage).to.equal(expectedValue);
    }
}

const validationHelper = new ValidationHelper();
module.exports = validationHelper;
