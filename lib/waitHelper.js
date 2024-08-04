'use strict';

const {By, until} = require('selenium-webdriver');
const config = require('config');
const logger = require('../logging/logger');
const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;
let chatSize;

class WaitHelper {
    async untilElementIsVisible(field, errorContext, driver, arrayNumber) {
        await this.waitForPageToReload(driver);
        await this.forElementToExist(field, errorContext, driver);
        if (arrayNumber == undefined) {
            const fields = await driver.findElements(field);
            const fieldsCount = fields.length;
            if (fieldsCount>1) {
                arrayNumber = fieldsCount;
            }
        }
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
                for (let k=0; k<elementCount; k++) {
                    const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', elementsArray[k]);
                    if (elementVisible) {
                        break;
                    }
                }
            } else {
                try {
                    // FOR LOOP AND WAIT A CERTAIN TIME.

                    const timeCheck = new Date();
                    timeCheck.setSeconds(
                        timeCheck.getSeconds() + config.get('timeout') / 1000,
                    );
                    let boolCheck = false;
                    do {
                        try {
                            let variable = await driver.findElement(field);
                            let elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', variable);
                            if (elementVisible) {
                                boolCheck = true;
                            } else {
                                let fieldName = field.value;
                                if (fieldName.includes('[id=')) {
                                    fieldName = fieldName.replace('*[id=', '[for=');
                                    const fieldFor = By.css(fieldName);
                                    variable = await driver.findElement(fieldFor);
                                    elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', variable);
                                    if (elementVisible) {
                                        boolCheck = true;
                                    }
                                }
                            }
                        } catch (err) {
                            // await logger.info(err);
                        }

                        const timeBool = timeCheck.getTime() < new Date().getTime();
                        if (timeBool) {
                            await logger.info('Wait Helper Timer Ran out.');
                            boolCheck = true;
                        }
                    } while (!boolCheck);
                } catch (err) {
                    await logger.error(err);
                    throw err;
                }
            }
        } catch (e) {
            const context = `${errorContext ? `${errorContext} - ` : ''}Waiting for field to be ` +
        `visible "${field}" on URL "${await driver.getCurrentUrl()}"`;
            await logger.error(context, e);
            await assert.fail(e);
            return false;
        }
        return true;
    }

    async untilElementIsVisibleWithoutPageReload(field, errorContext, driver) {
        await this.forElementToExist(field, errorContext, driver);
        const startOfWait = new Date();

        try {
            await driver.wait(
                until.elementIsVisible(
                    driver.findElement(field),
                    config.get('timeout'),
                ),
                config.get('timeout'),
            );
        } catch (e) {
            const endofWait = new Date();
            const millisecondsWait = endofWait - startOfWait;
            const context = `${errorContext ? `${errorContext} - ` : ''}Waiting ${millisecondsWait}ms for field to be ` +
        `visible "${field}" on URL "${await driver.getCurrentUrl()}"`;
            await logger.error(context, e);
            await assert.fail(e);
            return false;
        }
        return true;
    }

    async untilElementIsVisibleByDataTestId(dataTypeId, errorContext, driver) {
        await this.untilElementIsVisible(
            By.css(`[data-testid="${dataTypeId}"]`),
            errorContext,
            driver,
        );
    }

    async untilElementIsVisibleByDataTestIdWithoutPageReload(
        dataTypeId,
        errorContext,
        driver,
    ) {
        await this.untilElementIsVisibleWithoutPageReload(
            By.css(`[data-testid="${dataTypeId}"]`),
            errorContext,
            driver,
        );
    }

    async untilElementIsVisibleById(id, errorContext, driver) {
        await this.untilElementIsVisible(By.id(id), errorContext, driver);
    }

    async untilElementIsVisibleByIdWithoutPageReload(id, errorContext, driver) {
        await this.untilElementIsVisibleWithoutPageReload(
            By.id(id),
            errorContext,
            driver,
        );
    }

    async untilElementIsVisibleByCss(cssSelector, errorContext, driver) {
        await this.untilElementIsVisible(
            By.css(cssSelector),
            errorContext,
            driver,
        );
    }

    async untilElementIsVisibleByCssArray(
        cssSelector,
        errorContext,
        driver,
        arrayNumber,
    ) {
        await driver.wait(until.elementIsVisible(driver.findElement(By.className(className))), 10000);
    }

    async untilElementIsVisibleByCssWithoutPageReload(
        cssSelector,
        errorContext,
        driver,
    ) {
        await driver.wait(until.elementIsVisible(driver.findElement(By.css(cssSelector))), 10000);
    }

    async untilElementIsVisibleByClassName(className, errorContext, driver) {
        await driver.wait(until.elementIsVisible(driver.findElement(By.className(className))), 10000);
    }

    async untilElementTextIsByCSS(field, driver, compare) {
        try {
            await driver.wait(
                until.elementTextIs(
                    driver.findElement(By.css(`[data-code="${field}"`)),
                    compare,
                ),
                config.get('timeout'),
            );
        } catch (e) {
            await logger.error(
                `untilElementTextIsByCSS field: ${field} | compare: ${compare}`,
                e,
            );
        }
    }

    async untilElementTextIsByStrong(driver, compare) {
        try {
            await driver.wait(
                until.elementTextIs(
                    driver.findElement(By.css('strong')),
                    compare,
                ),
                config.get('timeout'),
            );
        } catch (e) {
            await logger.error(`untilElementTextIsByStrong ${compare}`, e);
        }
    }

    async untilElementTextIsByDataTestId(field, driver, compare) {
        try {
            await driver.wait(
                until.elementTextIs(
                    driver.findElement(By.css(`[data-testid="${field}"`)),
                    compare,
                ),
                config.get('timeout'),
            );
        } catch (e) {
            await logger.error(
                `untilElementTextIsByDataTestId field: ${field} | compare ${compare}`,
                e,
            );
        }
    }

    async waitForPageToReload(driver) {
        let pageCheck;
        let delay = 100;
        while (delay > 0) {
            pageCheck = await driver.executeScript(
                'return document.readyState',
            );
            if (pageCheck == 'complete') {
                break;
            }
            delay--;
            await driver.sleep(100);
        }
        return pageCheck === 'complete';
    }

    async waitForScreenToReload(driver) {
        let delay = 100;
        while (delay > 0) {
            const pageLoad = await driver.executeScript(
                'return document.readyState === "complete"',
            );
            if (pageLoad) {
                break;
            }
            delay--;
            await driver.sleep(100);
        }
    }

    async waitingForPageToReload(driver) {
        let loaded = false;
        let waited = false;
        const firstDate = new Date();
        const timeOutDate = new Date(firstDate.getTime() + config.get('timeout'));
        let nowDate;
        while (!loaded) {
            nowDate= new Date();
            const timeBool = nowDate.getTime() > timeOutDate;
            waited = await this.waitForPageToReload(driver);
            if (waited || timeBool) {
                loaded = true;
            }
        }
    }

    async untilElementIsNotVisibleByCss(cssSelector, driver) {
        try {
            let loaded = false;
            const firstDate = new Date();
            const timeOutDate = new Date(firstDate.getTime() + config.get('timeout'));
            let nowDate;
            while (!loaded) {
                nowDate= new Date();
                const timeBool = nowDate.getTime() > timeOutDate;

                const element = await driver.findElement(By.css(cssSelector));
                const cssDisplayValue = await element.getCssValue('display');
                if (cssDisplayValue === 'none' || timeBool) {
                    loaded = true;
                }
            }
        } catch (err) {
            return false;
        }
        return false;
    }

    async untilElementIsNotVisibleById(id, driver) {
        const field = By.id(id);
        return await this.untilElementIsNotVisible(field, driver);
    }

    async untilElementIsNotVisible(field, driver) {
        try {
            let loaded = false;
            const firstDate = new Date();
            const timeOutDate = new Date(firstDate.getTime() + config.get('timeout'));
            let nowDate;
            while (!loaded) {
                nowDate= new Date();
                const timeBool = nowDate.getTime() > timeOutDate;
                const element = await driver.findElement(field);
                const cssDisplayValue = await element.getCssValue('display');
                if (cssDisplayValue === 'none' || timeBool) {
                    loaded = true;
                }
            }
        } catch (err) {
            return false;
        }
        return false;
    }

    async forElementToExistById(id, errorContext, driver) {
        await this.forElementToExist(By.id(id), errorContext, driver);
    }

    async forElementToExistByDataTestId(dataTestId, errorContext, driver) {
        await this.forElementToExist(
            By.css(`[data-testid="${dataTestId}"]`),
            errorContext,
            driver,
        );
    }

    async forElementToExistByClassName(className, errorContext, driver) {
        await this.forElementToExist(
            By.className(className),
            errorContext,
            driver,
        );
    }

    async sliderHiddenbyId(driver, fieldId) {
        const text = 'return $("#' + fieldId + '")[0].ariaHidden != 0';
        const foundIt = await driver.executeScript(text);
        return foundIt;
    }

    async untilElementDoesNotExistById(driver, id) {
        const by = By.id(id);
        await this.untilElementDoesNotExist(driver, by);
    }

    async untilElementDoesNotExist(driver, field) {
        let visible = true;
        const maxTimes = 10;
        let count = 0;
        do {
            visible = await driver.findElements(field).then((elements) => {
                if (elements.length > 0) {
                    return true;
                } else if (count >= maxTimes) {
                    return true;
                }
                {
                    count++;
                    return false;
                }
            });
        } while (visible === true);
    }

    async waitUntilElementDoesExistById(driver, field) {
        await this.untilElementDoesExist(driver, By.id(field));
    }

    async untilElementDoesExistByCss(driver, field) {
        await this.untilElementDoesExist(driver, By.css(field));
    }

    async untilElementDoesNotExistByCss(driver, field) {
        await this.untilElementDoesNotExist(driver, By.css(field));
    }

    async untilElementDoesNotExistById(driver, field) {
        await this.untilElementDoesNotExist(driver, By.id(field));
    }

    async untilElementDoesExist(driver, field) {
        let visible = false;
        const timeoutTime = new Date();
        timeoutTime.setSeconds(
            timeoutTime.getSeconds() + config.get('timeout') / 1000,
        );

        do {
            visible = await driver.findElements(field).then((elements) => {
                return elements.length > 0;
            });

            const timeBool = timeoutTime.getTime() < new Date().getTime();
            if (timeBool) {
                visible = true;
            }
        } while (!visible);
    }

    async untilSliderDoesNotExist(driver, field) {
        let visible = false;
        do {
            visible = await driver.executeScript('return $("#' + field + '")[0].ariaHidden != 0');
            await logger.verbose('Waiting for slider to "not exist"');
        } while (!visible);
    }

    async forElementToExist(field, errorContext, driver) {
        try {
            await driver.wait(
                until.elementLocated(field),
                config.get('timeout'),
            );
            return true;
        } catch (e) {
            const context = `${errorContext ? `${errorContext} - ` : ''}Waiting for field ` +
        `"${field}" on URL "${await driver.getCurrentUrl()}"`;
            await logger.error(context, e);
            await assert.fail(e);
            return false;
        }
    }

    async forElementToContainTextByDataTestId(field, text, driver, methodContext) {
        let textContains = false;
        const maxTimes = 6;
        let count = 0;

        await driver.wait(until.elementIsVisible(driver.findElement(field)), 10000);

        do {
            const element = await driver.findElement(By.css(`[data-testid="${field}"]`));

            const elementText = await element.getText();
            if (elementText.toLowerCase().includes(text.toLowerCase())) {
                textContains = true;
            }
            count++;
            await driver.sleep(100);
            if (maxTimes <= count) {
                textContains = true;
            }
        } while (!textContains);
    }

    async forElementToNotContainTextById(field, text, driver, methodContext) {
        let textContains = true;
        const maxTimes = 6;
        let count = 0;

        await driver.wait(until.elementIsVisible(driver.findElement(field)), 10000);

        do {
            const element = await driver.findElement(By.id(field));
            const elementText = await element.getText();
            if (elementText.toLowerCase() != text.toLowerCase()) {
                textContains = false;
            }
            count++;
            await driver.sleep(100);
            if (maxTimes <= count) {
                textContains = false;
            }
        } while (textContains === true);
    }

    async waitForElementToContainText(field, text, methodContext, driver) {
        try {
            await driver.wait(until.elementTextContains(driver.findElement(field), text), 10000);
        } catch (err) {
            const context = `Waiting for field ${field} to contain text "${text}" on URL "${await driver.getCurrentUrl()}"`;
            await logger.error(context, err);
            await assert.fail(err);
            return false;
        }
    };

    async waitForElementToContainSource(field, text, methodContext, driver) {
        let textContains = false;
        const maxTimes = 6;
        let count = 0;
        try {
            do {
                const element = await driver.findElement(field);
                const elementText = await element.getAttribute('src');
                if (elementText.toLowerCase().includes(text.toLowerCase())) {
                    textContains = true;
                }
                count++;
                await driver.sleep(100);
                if (maxTimes <= count) {
                    textContains = true;
                }
            } while (textContains === false);
        } catch (e) {
            const context = `${methodContext ? `${methodContext} - ` : ''}Waiting for field ` +
        `"${field}" to contain text "${text}" on URL "${await driver.getCurrentUrl()}"`;
            await logger.error(context, e);
            await assert.fail(e);
            return false;
        }
    }

    async waitForElementToContainValue(field, text, methodContext, driver) {
        try {
            const timeCheck = new Date();
            timeCheck.setSeconds(
                timeCheck.getSeconds() + config.get('timeout') / 1000,
            );
            let count = 0;
            let boolCheck = false;
            do {
                let value = '';
                await driver
                    .executeScript(
                        `return $("${field.value} option:selected").text();`,
                    )
                    .then(function(returnValue) {
                        value = returnValue;
                    });
                if (value == text) {
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
                    await driver.sleep(100);
                }
            } while (!boolCheck);
        } catch (e) {
            const context = `${methodContext ? `${methodContext} - ` : ''}Waiting for field ` +
        `"${field}" to contain "${text}" on URL "${await driver.getCurrentUrl()}"`;
            await logger.error(context, e);
            await assert.fail(e);
            return false;
        }
        return true;
    }

    async untilChatReply(field, errorContext, driver, testData) {
        try {
            const timeCheck = new Date();
            timeCheck.setSeconds(timeCheck.getSeconds() + config.get('timeout') / 1000);
            chatSize = await testData.chatSize;
            do {
                await driver.sleep(100);
                var newChatSize = (await driver.findElements(By.css(field))).length;
                if ( newChatSize > chatSize) {
                    chatSize = newChatSize;
                    break;
                }
            }
            while (newChatSize <= chatSize && timeCheck.getTime() > new Date().getTime());
            await expect(timeCheck.getTime() > new Date().getTime(), `Expect VA chat to reply`).to.equal(true);
        } catch (e) {
            await logger.info(`Error While VA Chat Reply  ${e}`);
            await assert.fail(e);
        }
    }

    async untilChatToPost(driver, chatResponse, testData) {
        const timeCheck = new Date();
        timeCheck.setSeconds(timeCheck.getSeconds() + config.get('timeout') / 1000);
        let vaResponse = '';
        do {
            await driver.sleep(100);
            const field = await By.css('[class*=Twilio-MessageBubble-Body]');
            const element = await driver.findElements(field);
            vaResponse = await element.pop().getText();
            if ( vaResponse === chatResponse) {
                testData.chatSize = (await driver.findElements(field)).length;
                break;
            }
        }
        while (vaResponse !== chatResponse && timeCheck.getTime() > new Date().getTime());
    }

    async untilAgentLocation(driver, field) {
        const timeCheck = new Date();
        timeCheck.setSeconds(timeCheck.getSeconds() + config.get('timeout') / 1000);
        let boolCheck = false;
        do {
            await driver.sleep(100);
            const buttonSize = (await driver.findElements(field)).length;
            if (buttonSize > 0) {
                boolCheck = true;
                break;
            }
        }
        while (timeCheck.getTime() > new Date().getTime());
        return boolCheck;
    }

    async exists(driver, element) {
        return await driver.wait(until.elementIsVisible(driver.findElement(element)), 10000);
    }
}

const waitHelper = new WaitHelper();
module.exports = waitHelper;
