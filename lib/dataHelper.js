'use strict';
const randomstring = require('randomstring');
const logger = require('../logging/logger');
const config = require('config');
const {expect} = require('chai');

class DataHelper {
    async randomSurname() {
        const surname = randomstring.generate({
            length: 20,
            charset: 'alphabetic',
        });
        return surname;
    }

    randomEmailGenerator() {
        const chars1 =
      'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789';
        const chars2 =
      'EeM8mNW56wXx9AaRr12SsTtUu34VIiJ7j0KkLlvBbCcDdYyZznOoPpQqFfGgHh';
        const domains = ['.com', '.co.uk', '.net', '.info', '.org'];
        let prefix = '';
        let suffix = '';
        for (let ii = 0; ii < 15; ii++) {
            prefix += chars1[Math.floor(Math.random() * chars1.length)];
        }
        for (let ii = 0; ii < 5; ii++) {
            suffix += chars2[Math.floor(Math.random() * chars2.length)];
        }
        const domain = domains[Math.floor(Math.random() * domains.length)];
        const emailAddress = (prefix + '@' + suffix + domain);
        return (emailAddress);
    }

    monthConvert(month) {
        let convertedMonth = '';
        switch (month) {
        case 'JAN':
            convertedMonth = 'January';
            break;
        case 'FEB':
            convertedMonth = 'February';
            break;
        case 'MAR':
            convertedMonth = 'March';
            break;
        case 'APR':
            convertedMonth = 'April';
            break;
        case 'MAY':
            convertedMonth = 'May';
            break;
        case 'JUN':
            convertedMonth = 'June';
            break;
        case 'JUL':
            convertedMonth = 'July';
            break;
        case 'AUG':
            convertedMonth = 'August';
            break;
        case 'SEP':
            convertedMonth = 'September';
            break;
        case 'OCT':
            convertedMonth = 'October';
            break;
        case 'NOV':
            convertedMonth = 'November';
            break;
        case 'DEC':
            convertedMonth = 'December';
            break;
        default:
            break;
        }
        return convertedMonth;
    }

    monthOrder(month) {
        let convertedMonth = '';
        switch (month) {
        case 'JAN':
            convertedMonth = 1;
            break;
        case 'FEB':
            convertedMonth = 2;
            break;
        case 'MAR':
            convertedMonth = 3;
            break;
        case 'APR':
            convertedMonth = 4;
            break;
        case 'MAY':
            convertedMonth = 5;
            break;
        case 'JUN':
            convertedMonth = 6;
            break;
        case 'JUL':
            convertedMonth = 7;
            break;
        case 'AUG':
            convertedMonth = 8;
            break;
        case 'SEP':
            convertedMonth = 9;
            break;
        case 'OCT':
            convertedMonth = 10;
            break;
        case 'NOV':
            convertedMonth = 11;
            break;
        case 'DEC':
            convertedMonth = 12;
            break;
        default:
            break;
        }
        return convertedMonth;
    }

    async textSplitter(text) {
        const arr = [];
        try {
            const textArray = text.split('\n');

            for (let i = 0; i < textArray.length; i++) {
                const textSplit = textArray[i].split(':');

                if (this.recognisedList(textSplit[0])) {
                    arr[textSplit[0].trim()] = textSplit[1].trim();
                }
            }
        } catch (err) {
            await logger.error(err);
        }
        return arr;
    }

    recognisedList(value) {
        const arrayList = [
            'Brand',
            'Product',
            'Policy Status',
            'Cover Level',
            'Policy Number',
            'IsSales',
            'IsSSC',
        ];
        return arrayList.includes(value);
    }

    async stringToJsonConvert(text) {
        const arrayList = [
            'Agent',
            'Processed',
            'Personalisation Attempted',
            'Personalisation Success',
            'Invocation Point',
            'Brand',
            'Product',
            'Product Variant',
            'Policy Status',
            'Cover Level',
            'Quote Number',
            'Policy Number',
            'Web Session ID',
            'BGLBrand',
            'IsSales',
            'IsSSC',
            'LP_EngagementID',
        ];
        const arr = [];
        try {
            for (let i = 0; i < arrayList.length - 1; i++) {
                const arraySplit = text.split(arrayList[i + 1]);
                const beforeArraySplit = arraySplit[0];
                const textSplit = beforeArraySplit.split(':');
                arr[arrayList[i]] = textSplit[1].trim();
                arraySplit.shift();
                text = arraySplit.join(arrayList[i + 1]);
            }
        } catch (err) {
            await logger.error(err);
        }
        return arr;
    }

    async validateData(json, testData, client) {
        try {
            await logger.info('Validate Json Data');
            const methodContext = 'Virtual Assistant Validate Data';
            await logger.info(`Brand >>${json['Brand']}>>${client.name}>>${client.folder}`);
            if (json['Brand'].toLowerCase() == client.name.toLowerCase()) {
                await expect(json['Brand'].toLowerCase(), methodContext).to.equal(client.name.toLowerCase());
            } else {
                await expect(json['Brand'].toLowerCase(), methodContext).to.equal(client.folderVA.toLowerCase());
            }
            await expect(json['Product'].toLowerCase(), methodContext).to.equal(testData.product.toLowerCase());
            const policyStatus = await this.findPolicyStatus(testData.policyStatus);
            await expect(json['Policy Status'].toLowerCase(), methodContext).to.equal(policyStatus.toLowerCase());
            if (testData.policyRecord !=0 ) {
                await expect(json['Policy Number'].toLowerCase(), methodContext).to.equal(testData.policy[testData.policyRecord].id);
            }
            if (json['IsSales']) {
                await expect(json['IsSales'].toLowerCase(), methodContext).to.equal(testData.isSales.toString());
            }
            if (json['IsSSC']) {
                await expect(json['IsSSC'].toLowerCase(), methodContext).to.equal(testData.isSSC.toString());
            }
        } catch (err) {
            await logger.verbose(err);
            throw (err);
        }
    }

    async findPolicyStatus(id) {
        const policyStatusList = config.get('policyStatus');
        const policyStatus = policyStatusList.find((c) => c.short == id);
        return policyStatus === undefined ? '' : policyStatus.full;
    }

    async onlyPriceFromText(value) {
        value = value.replace(' ', '');
        value = value.match(/£\d+(\.\d+)?/g);
        value = value[0].replace('£', '');
        return value;
    }
}

module.exports = DataHelper;
