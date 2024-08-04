'use strict';

const logger = require('../logging/logger');
const {until, By, Key} = require('selenium-webdriver');
const wait = require('../lib/waitHelper');
const config = require('config');

class TextboxHelper {
    async setValueByCss(driver, cssSelector, value) {
        await this.setValue(driver, By.css(cssSelector), value);
    }

    async setValueByDataTestId(driver, cssSelector, value) {
        await this.setValueByCss(driver, `[data-testid="${cssSelector}"]`, value);
    }

    async setValueByClass(driver, cls, value) {
        await this.setValue(driver, By.className(cls), value);
    }

    async setInteractiveValueByClass(
        driver,
        methodContext,
        cls,
        valueCls,
        value,
    ) {
        await this.setValue(driver, By.className(cls), value);
        await wait.waitForScreenToReload(driver);
        await driver.wait(until.elementIsVisible(driver.findElement(By.className(cls))), 10000);
        await driver.sleep(1000);
        await driver
            .findElement(By.className(cls))
            .sendKeys(Key.DOWN);
        await driver
            .findElement(By.className(cls))
            .sendKeys(Key.TAB);
    }

    async setValueById(driver, id, value) {
        await this.setValue(driver, By.id(id), value);
    }

    async setValue(driver, by, value) {
        try {
            const timeCheck = new Date();
            timeCheck.setSeconds(
                timeCheck.getSeconds() + config.get('timeout') / 1000,
            );
            let count = 0;
            let boolCheck = false;
            do {
                try {
                    await logger.info(value + '>>' + by.value);

                    let element = await driver.findElement(by);
                    try {
                        await element.clear();
                    } catch (err) {
                        element = await driver.findElement(by);
                        const capabilities = await driver.getCapabilities();
                        const platformName = capabilities.get('platformName');
                        if (platformName.includes('iOS') ) {
                            await element.sendKeys(Key.chord(Key.COMMAND, 'a'));
                        } else {
                            await element.sendKeys(Key.chord(Key.CONTROL, 'a'), '55');
                        }
                    }
                    await element.sendKeys(value);
                    let populatedValue = await this.getValue(driver, by, value);
                    await logger.info(populatedValue + '>>' + value);

                    if (populatedValue == '' && value != '' || populatedValue != value) {
                        await driver.executeScript(`arguments[0].value = "${value}"`, element);
                        populatedValue = await this.getValue(driver, by);
                        await logger.info(populatedValue + '>>' + value);
                    }

                    if (value == populatedValue) {
                        boolCheck = true;
                    } else {
                        const timeBool = timeCheck.getTime() < new Date().getTime();
                        if (timeBool) {
                            boolCheck = true;
                        }

                        if (count > 10) {
                            boolCheck = true;
                        }
                        count++;
                    }
                } catch (err) {
                    await logger.info('Error setting a value, Trying again');
                    await logger.info(err);
                    const timeBool = timeCheck.getTime() < new Date().getTime();
                    if (timeBool) {
                        boolCheck = true;
                    }
                }
            } while (!boolCheck);
        } catch (err) {
            await logger.info(err);
        }
    }

    async getValueByDataTestId(driver, id) {
        return await this.getValue(
            driver,
            By.css(`[data-testid="${id}"]`),
        );
    }

    async getValueById(driver, id) {
        return await this.getValue(driver, By.id(id));
    }

    async getValueByCSS(driver, css) {
        return await this.getValue(driver, By.css(css));
    }

    async getValue(driver, by, passedValue=null) {
        const element = await driver.findElement(by);
        let value = await element.getAttribute('value');
        if (value == null || value == '' || value != passedValue) {
            value = await driver.executeScript(`return arguments[0].value`, element);
            await logger.verbose(value);
        }
        return value;
    }

    async populateValueById(driver, id, value) {
        let check = 0;
        do {
            await this.setValueById(driver, id, value);
            const populatedValue = await this.getValueById(driver, id);
            await logger.info(populatedValue + '>>' + value);
            if (populatedValue == value) {
                break;
            }
            check++;
        } while (check < 3);
    }

    async getCheckedValueByDataTestIdByElements(driver, id) {
        let value = 0;
        const field = By.css(`[data-testid="${id}"`);
        const elementsArray = await driver
            .findElements(field)
            .then((elements) => {
                return elements;
            });

        for (let i = 0; i < elementsArray.length; i++) {
            const checked = await elementsArray[i].getAttribute('checked');
            if (checked == 'true') {
                value = await elementsArray[i].getAttribute('value');
            }
        }

        return value;
    }
}

const textboxHelper = new TextboxHelper();
module.exports = textboxHelper;
