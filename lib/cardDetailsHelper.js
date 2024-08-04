'use strict';

const interactionHelper = require('./interactionHelper');
const logger = require('../logging/logger');
const textbox = require('./textboxHelper');
const dropdown = require('./dropdownHelper');
const config = require('config');
const popup = require('./popupHelper');
const {By, until} = require('selenium-webdriver');


class CardDetailsHelper {
    async enterCardDetails(driver, testData) {
        await this.populateCardDetails(driver, testData);
        return true;
    }

    async populateCardDetails(driver, testData, attempts = 1) {
        let loaded = false;
        let nowDate;
        const firstDate = new Date();
        const timeOutDate = new Date(firstDate.getTime() + config.get('timeout'));
        while (!loaded) {
            try {
                await logger.verbose('Populating Card Details');
                nowDate = new Date();
                const timeBool = nowDate.getTime() > timeOutDate;
                if (timeBool) {
                    loaded = true;
                }
                const ByCardCaptureIframe = By.id('Card-Capture-Iframe');
                await driver.wait(until.elementIsVisible(driver.findElement(ByCardCaptureIframe)),
                    config.get('timeout'));
                await this.switchToIframe(driver, 'Card-Capture-Iframe');
                const fieldExists = await interactionHelper.exists(
                    driver,
                    By.id('FullCardNumber'),
                );
                await logger.info('Field Exists>>' + fieldExists);
                if (fieldExists || timeBool) {
                    await interactionHelper.scrollToElement(
                        driver,
                        By.id('FullCardNumber'),
                    );
                    loaded = true;
                }
            } catch (err) {
                await logger.verbose('Could not find iFrame. Trying again.');
            }
        }

        const ByValue = By.id('FullCardNumber');
        await driver.wait(until.elementLocated(ByValue), config.get('timeout'));
        await driver.wait(until.elementIsVisible(driver.findElement(ByValue)), config.get('timeout'));

        await textbox.populateValueById(
            driver,
            'FullCardNumber',
            testData.cardDetails.fullCardNumber,
        );
        const ByExpiryValueYear = By.id('ExpiryDate_Value_Year');
        await driver.wait(until.elementIsVisible(driver.findElement(ByExpiryValueYear)), config.get('timeout'));
        await dropdown.setValue(driver, ByExpiryValueYear, await this._expiryYear(), null);

        const ByExpiryValueMonth = By.id('ExpiryDate_Value_Month');
        await driver.wait(until.elementIsVisible(driver.findElement(ByExpiryValueMonth)), config.get('timeout'));
        await dropdown.setValue(driver, ByExpiryValueMonth, testData.cardDetails.expiryMonth, null);

        await textbox.populateValueById(
            driver,
            'CVVNumber',
            testData.cardDetails.cVV,
        );
        try {
            await driver.findElement(By.id('continue')).click();
        } catch (err) {
            if (err.name === 'ElementClickInterceptedError' ||
            err.name === 'ElementNotInteractableError' ||
            err.name == 'StaleElementReferenceError') {
                const element = await driver.findElement(By.id('continue'));
                await driver.executeScript('arguments[0].click()', element);
            } else {
                await logger.info(err);
                throw err;
            }
        }
        await driver.switchTo().defaultContent();
    }

    async _expiryYear() {
        return new Date().getFullYear() + 1;
    }

    async switchToIframe(driver, iFrameName) {
        const timeOutDate = new Date(new Date().getTime() + config.get('timeout'));
        let loaded = false;
        while (!loaded) {
            const timeBool = new Date().getTime() > timeOutDate;
            try {
                await driver
                    .switchTo()
                    .frame(driver.findElement(By.id(iFrameName)));
                const selfName = await driver.executeScript('return self.name');
                const cardExists = await interactionHelper.exists(
                    driver,
                    By.id('FullCardNumber'),
                );
                await logger.info(
                    `Swapping to ${iFrameName} && card Exists ${cardExists}`,
                );

                if (selfName == iFrameName && cardExists || timeBool) {
                    loaded = true;
                    await driver.sleep(500);
                }
            } catch (err) {
                await driver
                    .switchTo()
                    .defaultContent();
            }
        }
    }
}

const cardDetailsHelper = new CardDetailsHelper();
module.exports = cardDetailsHelper;
