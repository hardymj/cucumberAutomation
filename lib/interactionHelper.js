'use strict';

const logger = require('../logging/logger');
const chai = require('chai');
const expect = chai.expect;

class InteractionHelper {
    async selectDateFromList(field, value, errorContext, driver) {
        await driver.executeScript(`$(".${field}")[${value}].click()`);
    }

    async clickFirstValidDateFromCalendar(driver) {
        return await driver.executeScript(`
    var arrayOfDates = [...document.getElementsByTagName("td")];
    var validDates = arrayOfDates.filter(date => date.attributes["data-handler"]?.value == "selectDay" && !date.className.includes("current-day"));
    if (validDates.length > 0) {
      validDates[0].click();
    }
    else {
      var datePickerPrevious = document.getElementsByClassName("ui-datepicker-prev")[0];
      var datePickerNext = document.getElementsByClassName("ui-datepicker-next")[0];

      var canSelectPreviousMonth = !datePickerPrevious.className.includes("disabled");
      if (canSelectPreviousMonth) {
        datePickerPrevious.click();
      } else {
        datePickerNext.click();
      }

      arrayOfDates = [...document.getElementsByTagName("td")];
      validDates = arrayOfDates.filter(date => !date.className.includes("disabled") && !date.className.includes("current-day"));
      validDates[0].click(); 
    }
    `);
    }

    async scrollToBottom(driver) {
        return await driver.executeScript(
            'window.scrollTo(0, document.body.scrollHeight);',
        );
    }

    async scrollToElement(driver, element) {
        try {
            const elementVar = await driver.findElement(element);
            let script = '';
            const testX = await elementVar.getRect();
            const offSetPosition2 = testX.y;
            const height = 'return arguments[0].scrollHeight;';
            await driver.sleep(250);
            const heightPosition = await driver.executeScript(height, elementVar);
            const offSetPositionInt = parseInt(offSetPosition2);
            const heightPositionInt = parseInt(heightPosition);
            for (let i=offSetPositionInt; i<offSetPositionInt+heightPositionInt;) {
                script = `window.scrollTo(0,${i})`;
                await driver.executeScript(script);
                await driver.sleep(200);
                i = i+150;
            }
            script = `window.scrollTo(0,${offSetPositionInt+heightPositionInt})`;
            await driver.executeScript(script);
            await driver.sleep(250);
        } catch (err) {
            await logger.info(`ScrollToElement ${err}`);
            return false;
        }
    }

    async exists(driver, element) {
        try {
            const variable = await driver.findElement(element);
            const elementVisible = await driver.executeScript('return !!( arguments[0].offsetWidth || arguments[0].offsetHeight || arguments[0].getClientRects().length );', variable);

            if (!elementVisible) {
                return false;
            }
            return await driver
                .findElement(element)
                .then(
                    function() {
                        return true;
                    },
                    function() {
                        return false;
                    },
                );
        } catch (err) {
            return false;
        }
    }

    async scrollDown(driver, pixelsToScrollDown) {
        const script = `window.scrollBy(0, ${pixelsToScrollDown})`;
        return await driver.executeScript(script);
    }

    async _getInnerText(field, driver) {
        let element = await driver.findElement(field);
        let text = await element.getText();

        const elements = await driver.findElements(field);
        if (elements.length > 1 && text == '') {
            for (let i = 0; i < elements.length; i++) {
                element = await elements[i];
                text = await element.getText();

                if (text != '') {
                    break;
                }
            }
        }
        return text;
    }

    async openAndCloseAllToolTips(element, driver) {
        try {
            const elementVar = driver.findElement(element);
            const scrollToElement = 'arguments[0].scrollIntoView({ behavior: "smooth"}); arguments[0].focus({preventScroll: true});';
            await driver.executeScript(scrollToElement, elementVar);
            const allElementsByClassName = 'return arguments[0].getElementsByClassName("ui-icon ui-icon-question-circle uil-tooltip__icon").length;';
            const numberOfToolTips = await driver.executeScript(allElementsByClassName, elementVar);
            for (let i=0; i<numberOfToolTips; i++) {
                const scrollIntoView = `arguments[0].getElementsByClassName("ui-icon ui-icon-question-circle uil-tooltip__icon")[${i}].scrollIntoView({ behavior: "smooth"}); arguments[0].focus({preventScroll: true});`;
                await driver.executeScript(scrollIntoView, elementVar);
                const clickElement = `arguments[0].getElementsByClassName("ui-icon ui-icon-question-circle uil-tooltip__icon")[${i}].click();`;
                await driver.executeScript(clickElement, elementVar);
            }
        } catch (err) {
            await logger.info(`openAndCloseAllToolTips ${err}`);
            return false;
        }
    }

    async countNumberOfElements(element, count, methodContext, driver) {
        const elements = await driver.findElements(element);
        const matches = elements.length == count || elements.length == count+1;
        await logger.info(`countNumberOfElements >>${matches}>>${elements.length}>>${count}>>`);
        await expect(matches).to.equal(true, methodContext);
    }
}

const interactionHelper = new InteractionHelper();
module.exports = interactionHelper;
