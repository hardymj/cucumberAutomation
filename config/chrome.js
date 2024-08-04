'use strict';

const {Capabilities, Builder} = require('selenium-webdriver');
const topLevelFolder = '../';
const {Options, ServiceBuilder} = require('selenium-webdriver/chrome');
const logging = require('selenium-webdriver/lib/logging');
const logger = require(`${topLevelFolder}logging/logger`);
const path = require('path');

module.exports = {

    returnBrowser: async function() {
        try {
            const chromedriverDirectory = path.join(__dirname, '\\chromedriver\\lib\\chromedriver');
            const chromeBinaryDirectory = path.join(__dirname, '..\\chrome\win64*\chrome-win64\Chrome.exe');
            process.env.PATH = chromedriverDirectory + path.delimiter + process.env.PATH;

            const chromeOptions = new Options();
            chromeOptions.addArguments('start-maximized');
            chromeOptions.addArguments('enable-automation');
            chromeOptions.addArguments('--no-sandbox');
            chromeOptions.addArguments('--disable-infobars');
            chromeOptions.addArguments('--disable-dev-shm-usage');
            chromeOptions.addArguments('--disable-browser-side-navigation');
            chromeOptions.addArguments('--disable-gpu');
            chromeOptions.addArguments('--ignore-certificate-errors');
            chromeOptions.addArguments('--test-type');
            chromeOptions.addArguments('--disable-popup-blocking');
            chromeOptions.addArguments('--incognito');
            chromeOptions.setChromeBinaryPath(chromeBinaryDirectory);

            const windowSize = process.env.CHROME_WINDOW_SIZE;
            if (windowSize) {
                chromeOptions.addArguments(`--window-size=${windowSize}`);
            }
            const capabilities = Capabilities.chrome();
            const prefs = new logging.Preferences();
            prefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);

            try {
                const seleniumDriver = new Builder()
                    .setLoggingPrefs(prefs)
                    .setChromeOptions(chromeOptions)
                    .setChromeService(new ServiceBuilder())
                    .withCapabilities(capabilities)
                    .build();
                return seleniumDriver;
            } catch (e) {
                await logger.error('Chrome, returnSeleniumDriver', e);
            }
        } catch (e) {
            await logger.error('Chrome, returnBrowser', e); ;
        }
    },
};
