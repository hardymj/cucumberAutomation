const {Given, When, Before, After, setDefaultTimeout, Status} = require('@cucumber/cucumber');
const {By, until, Key} = require('selenium-webdriver');
const {assert, expect} = require('chai');
const config = require('config');
const topLevelFolder = '../../';
const browser = require(`${topLevelFolder}lib/browserHelper`);
const base = require(`${topLevelFolder}lib/baseTestHelper`);
const TestData = require(`${topLevelFolder}data/testData`);
const logger = require(`${topLevelFolder}logging/logger`);
const cookies = require(`${topLevelFolder}lib/cookieBannerHelper`);
const interactionHelper = require(`${topLevelFolder}/lib/interactionHelper`);
const wait = require(`${topLevelFolder}lib/waitHelper`);
const validationHelper = require('../../lib/validationHelper');
const DataHelper = require(`${topLevelFolder}lib/dataHelper`);
const dataHelper = new DataHelper();
const dropdown = require('../../lib/dropdownHelper');

setDefaultTimeout(60 * 1000);
let testData; let driver; let client; let journey; let testCaseString; let clientAppTab;
After(async function(testCase) {
    try {
        const world = this;
        if (testCase.result.status === Status.FAILED) {
            await driver.takeScreenshot().then(function(screenshot) {
                world.attach(screenshot, 'base64:image/png');
            });
        }
        if (driver !=undefined) {
            await driver.close();
            await driver.quit();
        }
    } catch (err) {
        await logger.error(`Failure on After Test run >${err}`);
    }
});
Before(function(testCase) {
    journey = '';
    testCaseString = testCase.pickle.name;
    logger.testName(testCaseString);
});
Given('I use a browser', {timeout: 180 * 1000}, async function() {
    const browserConfig = browser._browserToRunAgainst(
        config.get('browser'),
    );
    try {
        const d = require(`../../${browserConfig}`);
        await logger.info(`TestCase "${testCaseString}" is using ${browserConfig}`);
        driver = await d.returnBrowser(testCaseString);
        return driver;
    } catch (e) {
        await logger.info(`Create Driver Failed ${e}`);
        await assert.fail(e);
    }
});
Given('I choose this brand {string}', async function(brand) {
    try {
        client = await base.startTestsForClient(brand);
    } catch (e) {
        await logger.info(`Error choosing brand ${e}`);
        await assert.fail(e);
    }
});

When('I switch back to previous tab', async function() {
    await logger.info(`switching to ${client.name} insurance `);
    try {
        await driver.switchTo().window(clientAppTab);
    } catch (e) {
        await logger.info(`Error while swiching back to default page  ${e}`);
        await assert.fail(e);
    }
});
When('I go to this url {string}', {timeout: 180 * 1000}, async function(url) {
    await logger.info(`I go to this url {${url}}`);
    try {
        await logger.info(url);
        await driver.get(url);
        return true;
    } catch (e) {
        await logger.error('Error getting driver', e);
        await assert.fail(e);
    }
});
When('I go to {string}', {timeout: 180 * 1000}, async function(pageName) {
    try {
        const page = await base.getPage(journey, client.folder, pageName);
        await page.page(driver, testData);
    } catch (err) {
        await logger.error(err, `I go to ${pageName}`);
        await assert.fail(err);
    }
});
Given('I set up the test data with {string}', async function(string) {
    try {
        const value = await convertTestData(string);
        let testDataString;
        if (value == '') {
            testDataString = `new TestData()`;
        } else {
            testDataString = `new TestData().${value}`;
        }

        testData = await eval(testDataString);
    } catch (err) {
        await logger.error(err);
        await assert.fail(err);
    }
});
async function convertTestData(value) {
    if (value.includes('testData')) {
        return value.replaceAll('testData', 'testData');
    } else {
        return value;
    }
}
async function useTestData(string, testData) {
    try {
        if (string.includes('testData')) {
            let newString = string;
            while (newString.includes('testData')) {
                const startOf = newString.indexOf('testData');
                const endOfString = newString.substring(startOf, newString.length);
                const findLastLineOfTestData = endOfString.indexOf(' ') == -1 ?
                    newString.length : endOfString.indexOf(' ');
                const fullTestData = endOfString.substring(0, findLastLineOfTestData);
                const convert = await eval(fullTestData);
                await logger.info(`Convert <<${convert}>>${string}>>${fullTestData}>>${startOf}>>${endOfString}>>${findLastLineOfTestData}>>`);
                if (convert.includes('$$')) {
                    string = convert;
                } else {
                    string = string.replace(fullTestData, convert);
                }
                string = string.replace(' - ', '-').replace(' + \'-\' + ', '-');
                newString = endOfString.substring(findLastLineOfTestData, endOfString.length);
            }
            return string;
        } else {
            return string;
        }
    } catch (err) {
        await logger.info(err);
        await assert.fail(err);
    }
}
Given('I accept cookies', async function() {
    await cookies.acceptAllIfVisible(driver);
});
When('I click on this button/link data-testid {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-testid='${value}']`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link data-testid {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-testid='${value}']`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link id {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.id(`${value}`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link id {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.id(`${value}`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link href {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`a[href*="${value}" i]`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link href {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`a[href*="${value}" i]`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link class {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.className(`${value}`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link class {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.className(`${value}`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link for {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[for='${value}']`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link for {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[for='${value}']`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link data-code {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-code='${value}']`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link data-code {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-code='${value}']`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link value {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[value="${value}"]`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link value {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[value="${value}"]`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link css {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`${value}`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link css {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`${value}`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link data-item-id {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-item-id='${value}']`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});
When('I click on this button/link data-item-id {string} option {string}', async function(string, number) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-item-id='${value}']`);
        await clickElements(field, number);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});

async function waitForPageToReload() {
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

async function clickElements(field, number) {
    try {
        await logger.info(`Click on Element ${field}`);
        await waitForElement(field);
        const elements = await driver.findElements(field);
        const numberInt = parseInt(number)-1;
        elements[numberInt].click();
    } catch (err) {
        if (err.name === 'ElementClickInterceptedError' ||
        err.name === 'ElementNotInteractableError' ||
        err.name == 'StaleElementReferenceError') {
            const element = await driver.findElement(field);
            await driver.executeScript('arguments[0].click()', element);
        } else {
            await logger.info(err);
            throw err;
        }
    }
}

async function clickElement(field) {
    try {
        await logger.info(`Click on Element ${field}`);
        await waitForElement(field);
        await driver.findElement(field).click();
    } catch (err) {
        if (err.name === 'ElementClickInterceptedError' ||
        err.name === 'ElementNotInteractableError' ||
        err.name == 'StaleElementReferenceError') {
            const element = await driver.findElement(field);
            await driver.executeScript('arguments[0].click()', element);
        } else {
            await logger.info(err);
            throw err;
        }
    }
}
async function enterText(field, value) {
    try {
        await waitForElement(field);
        const element = await driver.findElement(field);
        await element.clear();
        await element.sendKeys(value);
        const populatedValue = await element.getAttribute('value');
        if (populatedValue == null || populatedValue == '' || populatedValue != value) {
            await driver.executeScript(`arguments[0].value = "${value}"`, element);
        }
    } catch (err) {
        throw (err);
    }
}
When('I enter {string} on the textbox data-testid {string}', async function(valueString, dataTestid) {
    try {
        const value = await useTestData(valueString, testData);
        const field = By.css(`[data-testid='${dataTestid}']`);
        await enterText(field, value);
    } catch (e) {
        await logger.info(`Error entering data onto a textbox ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the textbox id {string}', async function(valueString, testId) {
    try {
        const value = await useTestData(valueString, testData);
        const field = By.id(`${testId}`);
        await enterText(field, value);
    } catch (e) {
        await logger.info(`Error entering data onto a textbox ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the textbox class {string}', async function(valueString, classString) {
    try {
        const value = await useTestData(valueString, testData);
        const field = By.className(`${classString}`);
        await enterText(field, value);
    } catch (e) {
        await logger.info(`Error entering data onto a textbox ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the textbox for {string}', async function(string, stringB) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[for='${stringB}']`);
        await enterText(field, value);
    } catch (e) {
        await logger.info(`Error entering data onto a textbox ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the dropdown data-testid {string}', async function(string, stringB) {
    try {
        const value = await useTestData(string, testData);
        const field = By.css(`[data-testid='${stringB}']`);
        await waitForElement(field);
        await dropdown.setValue(driver, field, value, null);
    } catch (e) {
        await logger.info(`Error entering data onto a dropdown ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the dropdown id {string}', async function(enteredValued, dropdownId) {
    try {
        const value = await useTestData(enteredValued, testData);
        const field = By.id(dropdownId);
        await waitForElement(field);
        await dropdown.setValue(driver, field, value, null);
    } catch (e) {
        await logger.info(`Error entering data onto a dropdown ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the dropdown class {string}', async function(enteredValued, dropdownClass) {
    try {
        const value = await useTestData(enteredValued, testData);
        const field = By.className(`${dropdownClass}`);
        await waitForElement(field);
        await dropdown.setValue(driver, field, value, null);
    } catch (e) {
        await logger.info(`Error entering data onto a dropdown ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the dropdown for {string}', async function(valueString, dropdownId) {
    try {
        const value = await useTestData(valueString, testData);
        const field = By.css(`[for='${dropdownId}']`);
        await waitForElement(field);
        await dropdown.setValue(driver, field, value, null);
    } catch (e) {
        await logger.info(`Error entering data onto a dropdown ${e}`);
        await assert.fail(e);
    }
});
When('I enter {string} on the dropdown data-testid {string} and the data is {string}',
    async function(valueString, dropdownId, dataString) {
        try {
            const value = await useTestData(valueString, testData);
            const field = By.css(`[data-testid='${dropdownId}']`);
            await waitForElement(field);
            await dropdown.setValue(driver, field, value, dataString);
        } catch (e) {
            await logger.info(`Error entering data onto a dropdown ${e}`);
            await assert.fail(e);
        }
    });
When('I enter {string} on the dropdown id {string} and the data is {string}',
    async function(valueString, dropdownId, dataString) {
        try {
            const value = await useTestData(valueString, testData);
            const field = By.id(dropdownId);
            await waitForElement(field);
            await dropdown.setValue(driver, field, value, dataString);
        } catch (e) {
            await logger.info(`Error entering data onto a dropdown ${e}`);
            await assert.fail(e);
        }
    });
When('I enter {string} on the dropdown class {string} and the data is {string}',
    async function(valueString, dropdownId, dataString) {
        try {
            const value = await useTestData(valueString, testData);
            const field = By.className(dropdownId);
            await waitForElement(field);
            await dropdown.setValue(driver, field, value, dataString);
        } catch (e) {
            await logger.info(`Error entering data onto a dropdown ${e}`);
            await assert.fail(e);
        }
    });
When('I enter {string} on the dropdown for {string} and the data is {string}',
    async function(valueString, dropdownId, dataString) {
        try {
            const value = await useTestData(valueString, testData);
            const field = By.css(`[for='${dropdownId}']`);
            await waitForElement(field);
            await dropdown.setValue(driver, field, value, dataString);
        } catch (e) {
            await logger.info(`Error entering data onto a dropdown ${e}`);
            await assert.fail(e);
        }
    });

When('I wait for field/form to be visible data-testid {string}', async function(string) {
    try {
        const field = By.css(`[data-testid='${string}']`);
        await waitForElement(field);
    } catch (e) {
        await logger.info(`Error waiting for field to be visible ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field/form to be visible id {string}', async function(string) {
    try {
        const field = By.id(`${string}`);
        await waitForElement(field);
    } catch (e) {
        await logger.info(`Error waiting for field to be visible ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field/form to be visible css {string}', async function(string) {
    try {
        const field = By.css(`${string}`);
        await waitForElement(field);
    } catch (e) {
        await logger.info(`Error waiting for field to be visible ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field/form to be visible class {string}', async function(string) {
    try {
        const field = By.className(`${string}`);
        await waitForElement(field);
    } catch (e) {
        await logger.info(`Error waiting for field to be visible ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field/form to be visible for {string}', async function(string) {
    try {
        const field = By.css(`[for='${string}']`);
        await waitForElement(field);
    } catch (e) {
        await logger.info(`Error waiting for field to be visible ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field to not be visible data-testid {string}', {timeout: 70 * 1000}, async function(string) {
    try {
        const field = By.css(`[data-testid='${string}']`);
        await isNotPresent(field);
    } catch (e) {
        await logger.info(`Error waiting for field to not be visible ${e}`);
    }
});
When('I wait for field to not be visible id {string}', {timeout: 70 * 1000}, async function(string) {
    try {
        const field = By.id(`[${string}`);
        await isNotPresent(field);
    } catch (e) {
        await logger.info(`Error waiting for field to not be visible ${e}`);
    }
});
When('I wait for field to not be visible class {string}', {timeout: 70 * 1000}, async function(string) {
    try {
        const field = By.className(`${string}`);
        await isNotPresent(field);
    } catch (e) {
        await logger.info(`Error waiting for field to not be visible ${e}`);
    }
});
When('I wait for field to not be visible for {string}', {timeout: 70 * 1000}, async function(string) {
    try {
        const field = By.css(`[for='${string}']`);
        await isNotPresent(field);
    } catch (e) {
        await logger.info(`Error waiting for field to not be visible ${e}`);
    }
});
async function isNotPresent(locator) {
    await driver.wait(() => {
        return driver.findElements(locator).then((elements) => {
            if (elements.length <= 0) {
                return true;
            }
            return false;
        });
    }, config.get('timeout'), 'The element was still present when it should have disappeared.');
}
When(`I check I'm on the right page {string}`, {timeout: 90 * 1000}, async function(string) {
    try {
        await logger.info(`Right Page >${config.get(string)}>${string}>`);
        await driver.wait(
            until.urlContains(config.get(string)),
        );
        await waitForPageToReload();
    } catch (e) {
        await logger.info(`Error checking for right page ${e}`);
        await assert.fail(e);
    }
});
async function waitForElement(field, tryAgain=true) {
    try {
        await waitForPageToReload();
        await scrollToElement(field);
        const elements = await driver.findElements(field);
        if (elements.length >1) {
            let fieldSelector;
            for (i=0; i<elements.length; i++) {
                const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth && arguments[0].offsetHeight && arguments[0].getClientRects().length );', elements[i]);
                if (elementVisible) {
                    fieldSelector = elements[i];
                    break;
                }
            }
            await driver.wait(until.elementIsVisible(fieldSelector), config.get('timeout'));
        } else {
            await driver.wait(until.elementIsVisible(driver.findElement(field)), config.get('timeout'));
        }
    } catch (err) {
        if (err.name == 'StaleElementReferenceError' && tryAgain) {
            await driver.sleep(1000);
            await waitForElement(field, arrayNumber, false);
        } else {
            await logger.info(err);
            throw err;
        }
    }
}
async function waitUntilElementContains(field, expectedTextContent, tryAgain=true) {
    try {
        await waitForElement(field);
        await driver.wait(function() {
            return driver.findElement(field).getText().then(function(text) {
                logger.info(`${text} >>${expectedTextContent}`);
                return text.includes(expectedTextContent);
            });
        }, config.get('timeout'));
    } catch (err) {
        if (err.name == 'StaleElementReferenceError' && tryAgain) {
            await driver.sleep(1000);
            await waitUntilElementContains(field, expectedTextContent, false);
        } else {
            await logger.info(`waitUntilElementContains3 ${err}`);
            throw err;
        }
    }
}
When('I wait for field data-testid {string} to contain {string}', async function(fieldId, expectedTextContent) {
    try {
        const ByField = By.css(`[data-testid='${fieldId}']`);
        await waitUntilElementContains(ByField, expectedTextContent);
    } catch (e) {
        await logger.info(`Error waiting for field to contain ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field id {string} to contain {string}', async function(fieldId, expectedTextContent) {
    try {
        const ByField = By.id(`${fieldId}`);
        await waitUntilElementContains(ByField, expectedTextContent);
    } catch (e) {
        await logger.info(`Error waiting for field to contain ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field class {string} to contain {string}', async function(fieldId, expectedTextContent) {
    try {
        const ByField = By.className(`${fieldId}`);
        await waitUntilElementContains(ByField, expectedTextContent);
    } catch (e) {
        await logger.info(`Error waiting for field to contain ${e}`);
        await assert.fail(e);
    }
});
When('I wait for field for {string} to contain {string}', async function(fieldId, expectedTextContent) {
    try {
        const ByField = By.css(`[for='${fieldId}']`);
        await waitUntilElementContains(ByField, expectedTextContent);
    } catch (e) {
        await logger.info(`Error waiting for field to contain ${e}`);
        await assert.fail(e);
    }
});
When('I scroll to the bottom of the page', async function() {
    try {
        await driver.executeScript(
            'window.scrollTo(0, document.body.scrollHeight);',
        );
    } catch (e) {
        await logger.info(`Error scrolling to the bottom of the page ${e}`);
        await assert.fail(e);
    }
});
When('I check the url is {string}', async function(string) {
    try {
        await driver.wait(until.urlContains(config.get(string)));
    } catch (e) {
        await logger.info(`Error checking the url ${e}`);
        await assert.fail(e);
    }
});
When('If I find data-testid field get its value {string} and store in {string}', async function(string, stringB) {
    const field = By.css(`[data-testid='${string}']`);
    await waitForElement(field);
    const element = await driver.findElement(field);
    const elementValue = await element.getText();
    try {
        await eval(`testData.${stringB}='${elementValue}'`);
    } catch (err) {
        await logger.info(err);
    }
});
When('If I find id field get its value {string} and store in {string}', async function(string, stringB) {
    const field = By.id(`${string}`);
    await waitForElement(field);
    const element = await driver.findElement(field);
    const elementValue = await element.getText();
    try {
        await eval(`testData.${stringB}='${elementValue}'`);
    } catch (err) {
        await logger.info(err);
    }
});
When('If I find class field get its value {string} and store in {string}', async function(string, stringB) {
    const field = By.className(`${string}`);
    await waitForElement(field);
    const element = await driver.findElement(field);
    const elementValue = await element.getText();
    try {
        await eval(`testData.${stringB}='${elementValue}'`);
    } catch (err) {
        await logger.info(err);
    }
});
When('If I find for field get its value {string} and store in {string}', async function(string, stringB) {
    const field = By.css(`[for='${string}']`);
    await waitForElement(field);
    const element = await driver.findElement(field);
    const elementValue = await element.getText();
    try {
        await eval(`testData.${stringB}='${elementValue}'`);
    } catch (err) {
        await logger.info(err);
    }
});
When('I compare the value from a field data-testid {string} with {string}', async function(string, stringB) {
    try {
        const value = await useTestData(stringB, testData);
        const field = By.css(`[data-testid='${string}']`);
        await waitForElement(field);
        await validationHelper._validateElement(field, value, 'Compare the value from a field', driver, true);
    } catch (err) {
        await assert.fail(err);
    }
});
When('I compare the value from a field id {string} with {string}', async function(string, stringB) {
    try {
        const value = await useTestData(stringB, testData);
        const field = By.id(`${string}`);
        await waitForElement(field);
        await validationHelper._validateElement(field, value, 'Compare the value from a field', driver, true);
    } catch (err) {
        await assert.fail(err);
    }
});
When('I compare the value from a field class {string} with {string}', async function(string, stringB) {
    try {
        const value = await useTestData(stringB, testData);
        const field = By.className(`${string}`);
        await waitForElement(field);
        await validationHelper._validateElement(field, value, 'Compare the value from a field', driver, true);
    } catch (err) {
        await assert.fail(err);
    }
});
When('I compare the value from a field for {string} with {string}', async function(string, stringB) {
    try {
        const value = await useTestData(stringB, testData);
        const field = By.css(`[data-testid='${string}']`);
        await waitForElement(field);
        await validationHelper._validateElement(field, value, 'Compare the value from a field', driver, true);
    } catch (err) {
        await assert.fail(err);
    }
});
When('I compare the value from a field css {string} with {string}', async function(string, stringB) {
    try {
        const value = await useTestData(stringB, testData);
        const field = By.css(`${string}`);
        await waitForElement(field);
        await validationHelper._validateElement(field, value, 'Compare the value from a field', driver, true);
    } catch (err) {
        await assert.fail(err);
    }
});
When(`I check I'm on either page {string} or {string}`, async function(urlOne, urlTwo) {
    try {
        await validationHelper.validateUrlContainsAnyUrl(
            urlOne,
            urlTwo,
            '',
            driver,
            'I check I\'m on either page',
        );
    } catch (e) {
        await logger.info(`Error checking you are on a page ${e}`);
        await assert.fail(e);
    }
});
When(`I check I'm on any page {string}, {string} or {string}`, async function(urlOne, urlTwo, urlThree) {
    try {
        await validationHelper.validatefinalUrlList(urlOne, urlTwo, urlThree, driver);
    } catch (e) {
        await logger.info(`Error checking you are on a page ${e}`);
        await assert.fail(e);
    }
});
async function scrollToElement(field) {
    try {
        await driver.wait(until.elementsLocated(field), config.get('timeout'));
        const elements = await driver.findElements(field);
        for (i=0; i<elements.length; i++) {
            const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth && arguments[0].offsetHeight && arguments[0].getClientRects().length );', elements[i]);
            if (elementVisible) {
                await driver.executeScript('arguments[0].scrollIntoView({block: "center", inline: "center", behaviour: "smooth"}); arguments[0].focus({preventScroll: true});', elements[i]);
                break;
            }
        }
    } catch (err) {
        await logger.info(`Erroring when ScrollingToElement ${err.name}`);
        throw err;
    }
}
When('I scroll to element data-testid {string}', async function(string) {
    try {
        const field = By.css(`[data-testid='${string}']`);
        await scrollToElement(field);
    } catch (e) {
        await logger.info(`Error scrolling to element ${e}`);
        await assert.fail(e);
    }
});
When('I scroll to element id {string}', async function(string) {
    try {
        const field = By.id(`${string}`);
        await scrollToElement(field);
    } catch (e) {
        await logger.info(`Error scrolling to element ${e}`);
        await assert.fail(e);
    }
});
When('I scroll to element class {string}', async function(string) {
    try {
        const field = By.className(`${string}`);
        await scrollToElement(field);
    } catch (e) {
        await logger.info(`Error scrolling to element ${e}`);
        await assert.fail(e);
    }
});
When('I scroll to element for {string}', async function(string) {
    try {
        const field = By.css(`[for='${string}']`);
        await scrollToElement(field);
    } catch (e) {
        await logger.info(`Error scrolling to element ${e}`);
        await assert.fail(e);
    }
});
When('I expect the number of elements of data-testid {string} to be {string}', async function(elementName, count) {
    try {
        const element = By.css(`[data-testid='${elementName}']`);
        await waitForElement(element);
        const elements = await driver.findElements(element);
        const matches = elements.length == count || elements.length == count+1;
        await expect(matches).to.equal(true, `${elementName} should be ${count} but was ${elements.length}`);
    } catch (e) {
        await logger.info(`Error expect the number of elements ${e}`);
        await assert.fail(e);
    }
});
When('I expect the number of elements of id {string} to be {string}', async function(elementName, count) {
    try {
        const element = By.id(`${elementName}`);
        await waitForElement(element);
        const elements = await driver.findElements(element);
        const matches = elements.length == count || elements.length == count+1;
        await expect(matches).to.equal(true, `${elementName} should be ${count} but was ${elements.length}`);
    } catch (e) {
        await logger.info(`Error expect the number of elements ${e}`);
        await assert.fail(e);
    }
});
When('I expect the number of elements of class {string} to be {string}', async function(elementName, count) {
    try {
        const element = By.className(elementName);
        await waitForElement(element);
        const elements = await driver.findElements(element);
        const matches = elements.length == count || elements.length == count+1;
        await expect(matches).to.equal(true, `${elementName} should be ${count} but was ${elements.length}`);
    } catch (e) {
        await logger.info(`Error expect the number of elements ${e}`);
        await assert.fail(e);
    }
});
When('I expect the number of elements of for {string} to be {string}', async function(elementName, count) {
    try {
        const element = By.css(`[for='${elementName}']`);
        await waitForElement(element);
        const elements = await driver.findElements(element);
        const matches = elements.length == count || elements.length == count+1;
        await expect(matches).to.equal(true, `${elementName} should be ${count} but was ${elements.length}`);
    } catch (e) {
        await logger.info(`Error expect the number of elements ${e}`);
        await assert.fail(e);
    }
});
When('I expect the number of elements of css {string} to be {string}', async function(elementName, count) {
    try {
        const element = By.css(`[${elementName}]`);
        await waitForElement(element);
        const elements = await driver.findElements(element);
        const matches = elements.length == count || elements.length == parseInt(count)+1;
        await expect(matches).to.equal(true, `${elementName} should be ${count} but was ${elements.length}`);
    } catch (e) {
        await logger.info(`Error expect the number of elements ${e}`);
        await assert.fail(e);
    }
});
When('I select a date {string} from the list {string}', async function(date, element) {
    const value = await useTestData(date);
    await interactionHelper.selectDateFromList(element, value - 1, 'methodContext', driver);
});
When('I wait for the spinner', async function() {
    try {
        const field = By.className('spinner');
        await wait.untilElementDoesExist(driver, field);
        await wait.untilElementDoesNotExist(driver, field);
    } catch (err) {
        await logger.info(
            `Could not find spinner, but available to continue`,
        );
    }
});
When('I wait for page to reload', async function() {
    try {
        await wait.waitingForPageToReload(driver);
    } catch (e) {
        await logger.info(`Waiting for page to reload ${e}`);
        await assert.fail(e);
    }
});
When('I switch to an iframe {string}', async function(string) {
    const iFrame = By.css(`[data-testid=${string}']`);
    await waitForElement(iFrame);
    await driver
        .switchTo()
        .frame(driver.findElement(By.css(`[data-testid=${string}]`)));
});
When('I select interactive value {string} for class {string}', async function(value, fieldName) {
    const field = By.className(fieldName);
    await enterText(field, value);
    await waitForPageToReload();
    await driver.wait(until.elementIsVisible(driver.findElement(field)), 10000);
    await driver.sleep(1000);
    await driver.findElement(field).sendKeys(Key.DOWN);
    await driver.findElement(field).sendKeys(Key.TAB);
});
When('I switch to a different frame id {string}', async function(frame) {
    await driver.switchTo().frame(driver.findElement(By.id(frame)));
});
When('I switch to a the default frame', async function() {
    await driver.switchTo().defaultContent();
});
When('I wait for title to be {string}', {timeout: 70 * 1000}, async function(title) {
    await validationHelper.validateTitleContains(title, 'I wait for title to be', driver);
});
When('I get the text from a dropdown class {string} and it goes into {string}', async function(field, option) {
    const fieldBy = By.className(field);
    const element = await driver.findElement(fieldBy);
    let value = await driver.executeScript('return arguments[0].options[arguments[0].selectedIndex].text', element);
    value = await dataHelper.onlyPriceFromText(value);
    try {
        await eval(`testData.${option}='${value}'`);
    } catch (err) {
        await logger.info(err);
    }
});
When('I get the text from a field class {string} and it goes into {string}', async function(field, option) {
    try {
        const fieldBy = By.className(field);
        const element = await driver.findElement(fieldBy);
        let value = await element.getText();
        value = await dataHelper.onlyPriceFromText(value);
        await eval(`testData.${option}='${value}'`);
    } catch (err) {
        await logger.info(err);
    }
});
When('I validate the data {string} is equal to {string}', async function(value, oldValue) {
    try {
        const newValue = await useTestData(value, testData);
        const originalValue = await useTestData(oldValue, testData);
        await expect(newValue.toLowerCase()).to.equal(
            originalValue.toLowerCase(), `${newValue} does not equal ${originalValue} when using ${value} and ${oldValue}`);
    } catch (err) {
        await logger.info(err);
    }
});
When('I validate the checkbox data-testid {string} is checked', async function(elementName) {
    try {
        const elementId = By.css(`[data-testid='${elementName}']`);
        const element = await driver.findElement(elementId);
        await expect(await element.isSelected()).to.equal(true);
    } catch (err) {
        await assert.fail(err);
    }
});
When('I switch browser tab to {string}', async function(tabNumber){
    try {
		var tabs;
        await driver.getAllWindowHandles().then(function(windowHandles) {
            tabs = windowHandles;
        });
		var tabNumberInt = parseInt(tabNumber);
		await driver.switchTo().window(tabs[tabNumberInt]);
    } catch (err) {
        await logger.info(err);
    }
});
When('I switch to recaptcha', async function() {
    await driver.switchTo().frame(driver.findElement(By.css('[title="reCAPTCHA"]')));
});

When('I click on this button/link xpath {string}', async function(string) {
    try {
        const value = await useTestData(string, testData);
        const field = By.xpath(`${value}`);
        await clickElement(field);
    } catch (e) {
        await logger.info(`Error click on the button ${e}`);
        await assert.fail(e);
    }
});

When('I wait for field xpath {string} to contain {string}', async function(fieldId, expectedTextContent) {
    try {
        const ByField = By.xpath(`${fieldId}`);
        await waitUntilElementContains(ByField, expectedTextContent);
    } catch (e) {
        await logger.info(`Error waiting for field to contain ${e}`);
        await assert.fail(e);
    }
});