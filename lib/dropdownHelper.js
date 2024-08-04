'use strict';

const {By} = require('selenium-webdriver');
const logger = require('../logging/logger');
const config = require('config');

class DropdownHelper {
    async setValue(driver, by, value, item) {
        try {
            if (item == 'null') {
                item = null;
            }
            const originalValue = value;
            const firstDate = new Date();
            let continueBool = true;
            const timeOutDate = new Date(
                firstDate.getTime() + config.get('longTimeout'),
            );
            let nowDate; let populatedValue;

            const element = await driver.findElement(by);
            await driver.executeScript('arguments[0].scrollIntoView({block: "center", inline: "center", behaviour: "smooth"}); arguments[0].focus({preventScroll: true});', element);

            while (continueBool) {
                nowDate = new Date();
                const timeBool = nowDate.getTime() > timeOutDate;
                const options = await element.findElements(By.css('option'));
                for (let i = 0; i < options.length; i++) {
                    const option = await options[i];
                    let optionText = await option.getAttribute('text');

                    if (value !== undefined && isNaN(value)) {
                        value = value.toLowerCase();
                        value = value.split(/\s+/).join('');
                    }
                    if (isNaN(optionText)) {
                        optionText = optionText.toLowerCase();
                        optionText = optionText.split(/\s+/).join('');
                    }
                    if (optionText !== undefined && optionText.toLowerCase() == value) {
                        try {
                            await option.click();
                            break;
                        } catch (err) {
                            try {
                                await driver.executeScript('document.evaluate(\'//option[text()="'+originalValue+'"]\',document).iterateNext().selected = \'selected\';');
                                break;
                            } catch (err) {
                                await logger.info(err);
                                break;
                            }
                        }
                    }
                    const optionValue = await option.getAttribute('value');
                    if (optionValue == item &&
            item != null &&
            optionText != 'pleaseselect…'
                    ) {
                        await option.click();
                        break;
                    }
                }
                populatedValue = await this.getValue(driver, by);

                if (populatedValue !== undefined && isNaN(populatedValue)) {
                    populatedValue = populatedValue.toLowerCase();
                    populatedValue = populatedValue.split(/\s+/).join('');
                }
                if (populatedValue !== undefined && populatedValue != null && populatedValue.toLowerCase() == item ||
          populatedValue != null && populatedValue.toLowerCase() == value ||
          populatedValue != null && populatedValue != '' && item != null ||
          timeBool) {
                    continueBool = false;
                }
            }
            await logger.verbose(
                `${nowDate} >> ${firstDate} >> ${value} >> ${populatedValue} >> ${item}`,
            );
        } catch (err) {
            await logger.info(err);
        }
    }
    async getValue(driver, by) {
        const element = await driver.findElement(by);
        const value = await driver.executeScript('return arguments[0].options[arguments[0].selectedIndex].text', element);
        return value;
    }
}

const dropdownHelper = new DropdownHelper();
module.exports = dropdownHelper;
