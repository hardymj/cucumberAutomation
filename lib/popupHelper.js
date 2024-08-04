'use strict';

const {By} = require('selenium-webdriver');
const logger = require('../logging/logger');
const interactionHelper = require('./interactionHelper');
const chai = require('chai');
const assert = chai.assert;

class PopupHelper {
    async buttonPress(
        driver,
        testData,
        methodContext,
        parentElement,
        textSearch,
        buttonPress,
    ) {
        try {
            if (typeof(parentElement) != 'object') {
                return;
            }
            const popUpText = await driver
                .findElement(parentElement)
                .getText();
            if (popUpText.includes(textSearch)) {
                await driver.findElement(buttonPress).click();
            } else {
                logger.info('No Popup in the screen');
            }
        } catch (err) {
            await logger.verboser(err);
        }
    }

    async dismissPing(methodContext, driver) {
        await this.checkNotification(
            methodContext,
            driver,
            'ping-notification-button',
        );
    }

    async dismiss(methodContext, driver) {
        await this.checkNotification(methodContext, driver, 'notification-button');
    }

    async checkNotification(methodContext, driver, buttonValue) {
        methodContext = (methodContext ? `${methodContext} - ` : '') +
      'Notification Check Popup Exists';

        try {
            const found = await interactionHelper.exists(
                driver,
                By.className('notification-container'),
            );
            if (found) {
                const notificationContainer = await driver.findElement(
                    By.className('notification-container'),
                );

                const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', notificationContainer);
                if (elementVisible) {
                    const cssDisplayValue = await notificationContainer.getCssValue('display');
                    if (cssDisplayValue === 'block') {
                        const field = By.className(buttonValue);
                        const element = await driver.findElement(field);
                        await driver.executeScript(
                            'arguments[0].scrollIntoView({block: "center", inline: "center"});',
                            element,
                        );
                        await driver.executeScript('arguments[0].focus();', element);
                        await driver.executeScript('arguments[0].click()', element);
                    }
                }
            }
        } catch (e) {
            // NoSuchElementError
            await logger.error(`${methodContext} - Unable to validate notification` +
        ` Container on URL "${await driver.getCurrentUrl()}"`, e);
        }
    }

    async _clickHelper(field, errorContext, driver, arrayNumber, attempt = 1) {
        try {
            if (arrayNumber !== undefined) {
                let elementCount = 0;
                let elementsArray;
                await driver
                    .findElements(field)
                    .then((elements) => {
                        elementCount = elements.length;
                        elementsArray = elements;
                    });

                let visible = 0;

                for (let k=0; k<elementCount; k++) {
                    const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', elementsArray[k]);
                    if (elementVisible) {
                        visible = k;
                        break;
                    }
                }
                elementsArray[visible].click();
            } else {
                try {
                    const element = await driver.findElement(field);

                    _ = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', element);
                    await driver.executeScript(
                        'arguments[0].scrollIntoView({block: "center", inline: "center"});',
                        element,
                    );
                    await driver.executeScript('arguments[0].focus();', element);
                    await element.click();
                } catch (e) {
                    await logger.info(e);

                    if (e.name === 'ElementClickInterceptedError' && attempt <= 3) {
                        const message =
              `${errorContext} - : Failed to click element, scrolling`;
                        await logger.info(message);
                        if (attempt === 1) {
                            await driver.executeScript('window.scrollTo(0, 0);');
                        } else if (attempt === 3) {
                            await driver.executeScript(
                                'window.scrollTo(0, document.body.scrollHeight);',
                            );
                        } else {
                            await driver.executeScript('window.scrollBy(0,250);');
                        }
                        await this._clickHelper(
                            field,
                            errorContext,
                            driver,
                            arrayNumber,
                            ++attempt,
                        );
                    } else if (e.name == 'StaleElementReferenceError') {
                        await logger.info(
                            '_clickHelper - StaleElementReferenceError - retrying',
                        );
                        await driver.findElement(field).click();
                    } else if (e.name == 'ElementNotInteractableError') {
                        const element = await driver.findElement(field);
                        await driver.executeScript('arguments[0].click()', element);
                    } else {
                        throw e;
                    }
                }
            }
        } catch (e) {
            const context = `${errorContext} - : Failed to click element '${field}'`;
            await logger.error(context, e);
            await assert.fail(e);
        }
    }
}

const popupHelper = new PopupHelper();
module.exports = popupHelper;
