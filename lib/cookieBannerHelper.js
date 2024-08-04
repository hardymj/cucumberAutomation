'use strict';

const config = require('config');
const {By, until} = require('selenium-webdriver');
const logger = require('../logging/logger');

class CookieBannerHelper {
    async acceptAllIfVisible(driver) {
        try {
            await driver.findElement(By.id('onetrust-accept-btn-handler'));
            const acceptAllCookiesButton = await driver.wait(until.elementLocated(By.id('onetrust-accept-btn-handler')), config.get('timeout'));
            await acceptAllCookiesButton.click();
        } catch (err) {
            await logger.error(err);
        }
    }
}

const cookieBannerHelper = new CookieBannerHelper();
module.exports = cookieBannerHelper;
