'use strict';

const {By, until} = require('selenium-webdriver');
const logger = require('../logging/logger');
const wait = require(`./waitHelper`);
const config = require('config');

class DeviceHelper {
    async deviceUsed(driver) {
        try {
            await logger.info('Device Used');
            const field = By.className('burger-menu');
            const element = await driver.findElement(field);
            const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', element);
            return elementVisible;
        } catch (err) {
        }
    }
    async clickMenu(driver, testData) {
        try {
            const methodContext = 'Device Helper';
            await logger.info('Wait for Reload');
            await wait.waitForScreenToReload(driver);

            await wait.forElementToExistByClassName('nav-primary__item', methodContext, driver);

            let device = false;
            try {
                device = await this.deviceUsed(driver);
            } catch (err) {
                await logger.info(err);
            }

            const notificationField = By.id('notifications-dropdown');
            const element = await driver.findElement(notificationField);
            const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', element);
            if (elementVisible) {
                const BySnooze = By.id('snooze');
                await driver.wait(until.elementIsVisible(driver.findElement(BySnooze)), config.get('timeout'));
                await driver.findElement(BySnooze).click();
            }
            if (device) {
                const ByBurger = By.id('burger-menu');
                await driver.wait(until.elementIsVisible(driver.findElement(ByBurger)), config.get('timeout'));
                await driver.findElement(ByBurger).click();
            }
        } catch (err) {
        }
    }
    async clickTogglePolicy(driver, testData) {
        try {
            await logger.info('Wait for Reload');
            await this.waitForPageToReload(driver);
            let device = false;
            try {
                device = await this.deviceUsed(driver);
            } catch (err) {
                await logger.info(err);
            }
            if (device) {
                const ByBurger = By.id('burger-menu');
                await driver.wait(until.elementIsVisible(driver.findElement(ByBurger)), config.get('timeout'));
                await driver.findElement(ByBurger).click();
                const ByPolicyNavigator = By.css(`[data-testid='policyNavigator__toggle-policy-menu']`);
                await driver.wait(until.elementIsVisible(driver.findElement(ByPolicyNavigator)), config.get('timeout'));
                await driver.findElement(ByPolicyNavigator).click();
            } else {
                const ByPolicyNavigator = By.css(`[data-testid='policy__toggle-policy-menu']`);
                await driver.wait(until.elementIsVisible(driver.findElement(ByPolicyNavigator)), config.get('timeout'));
                await driver.findElement(ByPolicyNavigator).click();
            }
        } catch (err) {
            await logger.error(err);
        }
    }

    async waitForPageToReload(driver) {
        let loaded = false;
        let waited = false;
        const firstDate = new Date();
        const timeOutDate = new Date(firstDate.getTime() + config.get('timeout'));
        let nowDate;
        while (!loaded) {
            nowDate= new Date();
            const timeBool = nowDate.getTime() > timeOutDate;
            waited = await wait.waitForPageToReload(driver);
            if (waited || timeBool) {
                loaded = true;
            }
        }
    }
}
const deviceHelper = new DeviceHelper();
module.exports = deviceHelper;
