'use strict';

const fs = require('fs');
const config = require('config');
const xmlToJs = require('xml-js');
const randomstring = require('randomstring');
const moment = require('moment');
const logger = require('../logging/logger');
const WasRepository = require('../repositories/wasRepository');
const demandPriceRefresh = '&demandpricerefresh=Y';
const chai = require('chai');
const assert = chai.assert;

class WasHelper {
    constructor(systemUrl, replaceUrl, clientCode) {
        this.systemUrl = systemUrl;
        this.replaceUrl = replaceUrl;
        this.clientCode = clientCode;
        this.populateDataHub = false;
        this.leadNo = '';
    }

    async setPopulateDataHub() {
        this.populateDataHub = true;
    }

    async getWASQuoteAndPopulateData(quoteDataName, testData, clientName) {
        try {
            await logger.info('In WasHelper.getWASQuoteAndPopulateData');
            const fileName = `data/wasRequests/test${quoteDataName}.json`;
            const json = await this._readJsonFile(fileName);

            let retryCount = config.get('getQuoteAttempts') || 2;
            let quote;
            do {
                await logger.info(
                    `In WasHelper calling service Retries Left ${retryCount}`,
                );
                if (testData.updateAggregator) {
                    const aggUpdated = await this._updateAgg(
                        json,
                        retryCount,
                        testData.selectedAggregator,
                    );
                    this.clientCode = await this._checkAndUpdateClientCodeForAgg(
                        testData.selectedAggregator,
                        clientName,
                        testData.getType(),
                        aggUpdated,
                        testData,
                    );
                }

                await this._updateCommenceDate(json, testData);

                if (testData.updateSurname) {
                    await this._updateSurname(json);
                }

                if (testData.getType() == 'Motor') {
                    await this._setMotorTestData(json, testData);
                } else {
                    await this._setHomeTestData(json, testData);
                }

                const xmlToPost = await xmlToJs.json2xml(
                    json,
                    {compact: true, spaces: 4},
                );
                quote = await this._tryGetBrandQuote(xmlToPost, testData.getType());

                if (this.populateDataHub) {
                    testData.updateSurname = false;
                    testData.updateAggregator = false;
                }
                retryCount--;
            } while (quote === null && retryCount > 0);

            if (quote === null) {
                const message = `Unable to get a quote from DISC for ${quoteDataName}`;
                await logger.error(message);
                await assert.fail(message);
                return null;
            }

            if (testData.getType() == 'Motor') {
                await this._setQuoteMotorTestData(quote, testData);
            } else {
                await this._setQuoteHomeTestData(quote, testData);
            }
            return testData;
        } catch (e) {
            await logger.error('Failed in getWASQuoteAndPopulateData', e);
            await assert.fail(e);
            return null;
        }
    }

    async _tryGetBrandQuote(xmlToPost, type) {
        await logger.info('In _tryGetBrandQuote');
        try {
            return await this._getBrandQuote(xmlToPost, type);
        } catch (err) {
            await logger.error('Failed in _tryGetBrandQuote', err);
            return null;
        }
    }

    async _readJsonFile(filename) {
        await logger.info('In _readJsonFile');
        return new Promise(function(resolve, reject) {
            fs.readFile(filename, 'utf8', async function(err, data) {
                if (err) {
                    const errMsg = `Failed to read JSON file '${this.filename}'- ${err}`;
                    await logger.error(errMsg);
                    reject(errMsg);
                }
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    const context =
            `Failed to parse JSON from file '${this.filename}'`;
                    await logger.error(context, e);
                    reject(e);
                }
            }.bind({filename: filename}));
        });
    }

    async _updateAgg(json, code, aggregator) {
        await logger.info('In _updateAgg');
        let foundAgg = aggregator;
        let aggUpdated = aggregator;
        if (foundAgg.length < 4) {
            const agg = [
                'CTMS',
                'CTM2',
                'CTM3',
                'CTM4',
                'CTMS',
            ];
            foundAgg = agg[code - 1];
            aggUpdated = foundAgg;
        }
        try {
            const type = this.returnPathwayOfRequest(json);
            if (type == 'Home') {
                json['soapenv:Envelope']['soapenv:Body']['HHQuoteRequest']
                    ['Header']['Sender']['SourceCode']['_text'] = foundAgg;
            } else {
                json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']
                    ['is:Header']['is:Sender']['is:SourceCode']['_text'] = foundAgg;
            }
        } catch (e) {
            const context = 'Failed to update JSON Agg to ' +
        `'${foundAgg}' - json: ${json}`;
            await logger.error(context, e);
            await assert.fail(e);
            throw e;
        }
        return aggUpdated;
    }

    async _checkAndUpdateClientCodeForAgg(aggregator, brand, type, aggUpdated, testData) {
        let useAgg = '';
        if (aggregator != aggUpdated) {
            await logger.verbose(
                `${aggregator} >> ${brand} >> ${type} >> ${aggUpdated}`,
            );
            useAgg = aggUpdated;
        } else if (aggregator == '') {
            return this.clientCode;
        } else {
            useAgg = aggregator;
        }

        if (useAgg == 'CTMS') {
            return this.clientCode;
        }

        const aggs = [
            this.createConfusedAggData(),
            this.createMoneySupermarketAggData(),
            this.createGoCompareAggData(),
        ];

        const agg = aggs.find((el) => {
            return el.name == useAgg;
        });

        if (brand == 'dialdirect' && type != 'Motor') {
            brand = 'dialdirectPremier';
        }

        if (brand == 'racOnline' && test.plusAggregator) {
            brand = 'racOnlinePlus';
        }
        if (brand == 'rac' && test.plusAggregator) {
            brand = 'racPlus';
        }
        const aggClientCode = agg.brandCode.find((el) => {
            return el.key == brand;
        });

        return aggClientCode.value;
    }

    createConfusedAggData() {
        return {
            name: 'CTM2',
            brandCode: [
                this.creaateBrandData('bbg', 'BM9C'),
                this.creaateBrandData('bankofscotland', 'SC9C'),
                this.creaateBrandData('budget', 'CONF'),
                this.creaateBrandData('coop', 'CS9C'),
                this.creaateBrandData('dialdirect', 'D29C'),
                this.creaateBrandData('dialdirectpremier', 'D09C'),
                this.creaateBrandData('geoffrey', 'GE9C'),
                this.creaateBrandData('halifax', 'HL9C'),
                this.creaateBrandData('lloyds', 'LT9C'),
                this.creaateBrandData('mands', 'M47C'),
                this.creaateBrandData('postoffice', 'PO6C'),
                this.creaateBrandData('ract', 'R29C'),
                this.creaateBrandData('rac', 'RA9C'),
                this.creaateBrandData('racPlus', 'RA8C'),
                this.creaateBrandData('racOnline', 'R39C'),
                this.creaateBrandData('racOnlinePlus', 'R37C'),
                this.creaateBrandData('santander', 'SI9C'),
                this.creaateBrandData('sunlife', 'SL9C'),
                this.creaateBrandData('zenith', 'ZE9C'),
                this.creaateBrandData('nutshell', 'NS9C'),
            ],
        };
    }

    createMoneySupermarketAggData() {
        return {
            name: 'CTM3',
            brandCode: [
                this.creaateBrandData('bbg', 'BM9S'),
                this.creaateBrandData('bankofscotland', 'SC9S'),
                this.creaateBrandData('coop', 'CS9S'),
                this.creaateBrandData('dialdirect', 'D29S'),
                this.creaateBrandData('dialdirectpremier', 'D09S'),
                this.creaateBrandData('budget', 'INSS'),
                this.creaateBrandData('geoffrey', 'GE9S'),
                this.creaateBrandData('halifax', 'HL9S'),
                this.creaateBrandData('lloyds', 'LT9S'),
                this.creaateBrandData('mands', 'M47S'),
                this.creaateBrandData('postoffice', 'PO6S'),
                this.creaateBrandData('ract', 'R29S'),
                this.creaateBrandData('rac', 'RA9S'),
                this.creaateBrandData('racPlus', 'RA8S'),
                this.creaateBrandData('racOnline', 'R37S'),
                this.creaateBrandData('racOnlinePlus', 'R37M'),
                this.creaateBrandData('santander', 'SI9S'),
                this.creaateBrandData('sunlife', 'SL9S'),
                this.creaateBrandData('zenith', 'ZE9S'),
                this.creaateBrandData('nutshell', 'NS9S'),
            ],
        };
    }

    createGoCompareAggData() {
        return {
            name: 'CTM4',
            brandCode: [
                this.creaateBrandData('bbg', 'BM9A'),
                this.creaateBrandData('bankofscotland', 'SC9A'),
                this.creaateBrandData('budget', 'BI9A'),
                this.creaateBrandData('coop', 'CS9A'),
                this.creaateBrandData('dialdirect', 'D29A'),
                this.creaateBrandData('dialdirectpremier', 'D09A'),
                this.creaateBrandData('geoffrey', 'GE9A'),
                this.creaateBrandData('halifax', 'HL9A'),
                this.creaateBrandData('lloyds', 'LT9A'),
                this.creaateBrandData('mands', 'M47A'),
                this.creaateBrandData('postoffice', 'PO9A'),
                this.creaateBrandData('ract', 'R29A'),
                this.creaateBrandData('rac', 'RA9A'),
                this.creaateBrandData('racPlus', 'RA8A'),
                this.creaateBrandData('racOnline', 'R39A'),
                this.creaateBrandData('racOnlinePlus', 'R37A'),
                this.creaateBrandData('santander', 'SI9A'),
                this.creaateBrandData('sunlife', 'SL9A'),
                this.creaateBrandData('zenith', 'ZE9A'),
                this.creaateBrandData('nutshell', 'NS9A'),
            ],
        };
    }

    creaateBrandData(brand, code) {
        return {key: brand, value: code};
    }

    returnPathwayOfRequest(json) {
        const body = json['soapenv:Envelope']['soapenv:Body'];
        if (body['HHQuoteRequest'] !== undefined) {
            return 'Home';
        } else {
            return 'Motor';
        }
    }

    async _updateCommenceDate(json, testData) {
        try {
            var datePlusEighteenDays = moment()
                .add(18, 'days')
                .format('YYYY-MM-DD');
            if (testData.vehicleType == 'Van') {
                json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']
                    ['is:Lead']['is:Products']['is:CommercialVehicles']['is:CommercialVehicle']['is:CommercialVehicleCover']
                    ['is:CommencementDate']['_text'] = datePlusEighteenDays;
            } else if (testData.vehicleType == 'Car') {
                json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']
                    ['is:Lead']['is:Products']['is:PrivateCars']['is:PrivateCar']['is:PrivateCarCover']
                    ['is:CommencementDate']['_text'] = datePlusEighteenDays;
            }
        } catch (e) {
            const context = 'Failed to update JSON commence date to ' +
        `'${datePlusEighteenDays}' | json: ${json}`;
            await logger.error(context, e);
            throw e;
        }
    }

    async _updateSurname(json) {
        await logger.info('In _updateSurname');
        const surnamePrefixForCreditSearchStub = 'AAAAA';
        const surnameSuffix = randomstring.generate({
            length: 15,
            charset: 'alphabetic',
        });
        const fullyRandomSurname = randomstring.generate({
            length: 20,
            charset: 'alphabetic',
        });
        let newSurname;

        try {
            const type = this.returnPathwayOfRequest(json);
            if (type == 'Home') {
                newSurname = fullyRandomSurname;
                this._setHomeQuoteSurname(json, newSurname);
            } else {
                newSurname = surnamePrefixForCreditSearchStub + surnameSuffix;
                this._setCarQuoteSurname(json, newSurname);
            }
        } catch (e) {
            const context = 'Failed to update JSON surname to ' +
        `'${newSurname}' - json: ${json}`;
            await logger.error(context, e);
            await assert.fail(e);
            throw e;
        }
    }

    async _setMotorTestData(json, testData) {
        await logger.info('In _setMotorTestData');
        try {
            testData.name =
        `Hi ${this._getFirstName(json)}, before we take you to your quote, `;
            testData.nameRac =
        `Hello ${this._getFirstName(json)}. Before we take you to your quote,`;

            if (testData.vehicleType == 'Van') {
                testData.coverType = this._coverConvert(this._getVanCoverType(json));
                testData.paymentType = this._getVanPaymentType(json);
            } else {
                testData.coverType = this._coverConvert(this._getCarCoverType);
                testData.paymentType = this._getCarPaymentType(json);
            }
            testData.surname = this._getCarQuoteSurname(json);
            testData.dateOfBirth = moment(
                this._getDateOfBirth(json),
            ).format('DD/MM/YYYY');
        } catch (e) {
            const context = 'Failed to update test data';
            await logger.error(context, e);
            await assert.fail(e);
            throw e;
        }
    }

    async _setHomeTestData(json, testData) {
        await logger.info('In _setHomeTestData');
        try {
            testData.name = `Hi ${this._getHomeFirstName(json)}, before we take you to your quote, `;
            testData.paymentType = this._getHomePaymentType(json);
            testData.surname = this._getHomeQuoteSurname(json);
            testData.dateOfBirth = moment(
                this._getHomeDateOfBirth(json),
            ).format('DD/MM/YYYY');
        } catch (e) {
            const context = 'Failed to update test data';
            await logger.error(context, e);
            await assert.fail(e);
            throw e;
        }
    }

    async _coverConvert(cover) {
        await logger.info('In _coverConvert');
        return (cover == '01') ?
            'Comprehensive' :
            (cover == '02') ?
                'Third Party Fire & Theft' :
                'Third Party Only';
    }

    async _getBrandQuote(xml, type) {
        await logger.info('In _getBrandQuote');
        const wasRepository = new WasRepository(config.get('url'));
        const quoteResponse = await wasRepository.getQuotes(xml, type);

        let quoteArray;
        try {
            if (type == 'Motor') {
                quoteArray = quoteResponse['soapenv:Envelope']['soapenv:Body']
                    ['a:QuoteResult']['a:PrivateCarQuotes']['a:Vehicle']['a:Quote'];
            } else {
                quoteArray = quoteResponse['soapenv:Envelope']['soapenv:Body']
                    ['a:QuoteResult']['a:HomeQuotes']['a:Home']['a:Quote'];
            }
        } catch (e) {
            const context = 'WAS API result is invalid, ' +
        'did not include a quote array - ' +
        `${JSON.stringify(quoteResponse)}`;
            await logger.error(context, e);
            throw e;
        }

        if (!Array.isArray(quoteArray) || quoteArray.length === 0) {
            const errMsg =
        `WAS API result is invalid, no quotes returned - ${JSON.stringify(quoteResponse)}`;
            await logger.error(errMsg);
            throw errMsg;
        }
        const quote = await this._filterClientFromQuoteArray(quoteArray);

        if (!quote) {
            const errMsg = `WAS API could not find broker ${this.clientCode} quote in quote array - ${JSON.stringify(quoteArray)}`;
            await logger.error(errMsg);
            throw errMsg;
        }

        return quote;
    }

    async _setQuoteHomeTestData(quote, testData) {
        await logger.info('In _setQuoteHomeTestData');
        try {
            const retrievalLink = quote['a:LinkDetails']['a:RetrievalLink']['_text'];
            testData.url = retrievalLink.replace(
                retrievalLink.substr(
                    0,
                    retrievalLink.indexOf('/' + this.clientCode),
                ),
                this.replaceUrl,
            ) + demandPriceRefresh;

            const premiumVal = quote['a:Premium']['a:AnnualPremium']['_text'];
            testData.price = `£${premiumVal}/year`;
            testData.priceForcedAnnual = `${premiumVal}`;
            const monthlyVal = quote['a:Premium']['a:InstalmentDetails']
                ['a:MonthlyPremium']['_text'];
            testData.monthlyPrice = `£${monthlyVal}/month`;

            let totalExcess = 0;
            testData.buildingsExcessOnly = 0;
            testData.contentsExcessOnly = 0;

            if (quote['a:Excesses']['a:BuildingsExcess']['_text'] != '.00') {
                totalExcess = parseInt(
                    quote['a:Excesses']['a:BuildingsExcess']['_text'],
                );
                testData.buildingsExcessOnly = totalExcess;
            }
            if (quote['a:Excesses']['a:ContentsExcess']['_text'] != '.00') {
                totalExcess = parseInt(
                    quote['a:Excesses']['a:ContentsExcess']['_text'],
                );
                testData.contentsExcessOnly = totalExcess;
            }

            testData.totalExcess = `Policy excess is £${testData.buildingsExcessOnly + testData.contentsExcessOnly}`;

            testData.depositAmount = quote['a:Premium']['a:InstalmentDetails']
                ['a:Deposit']['_text'];

            const expiryDate = moment(quote['a:ExpiryDate']['_text'])
                .format('DD/MM/YYYY');
            testData.validUntil = `Your quote is valid until: ${expiryDate}`;

            const underwriter = await this._returnInsurer(
                quote['a:InsurerName']['_text'],
            );
            testData.underwriter = `Your insurer for your policy: ${underwriter}`;

            return testData;
        } catch (e) {
            const context =
        `Failed to update quote test data: ${await this._returnError(e)}`;
            await logger.error(context, e);
            await assert.fail(e);
            throw e;
        }
    }

    async _setQuoteMotorTestData(quote, testData) {
        await logger.info('In _setQuoteMotorTestData');
        try {
            if (testData.vehicleType == 'Van') {
                this.replaceUrl = this.replaceUrl.replace('/Car', '/Van');
            }

            const retrievalLink = quote['a:LinkDetails']['a:RetrievalLink']['_text'];
            testData.url = retrievalLink.replace(
                retrievalLink.substr(
                    0,
                    retrievalLink.indexOf('/' + this.clientCode),
                ),
                this.replaceUrl,
            ) + demandPriceRefresh;

            const premiumVal = quote['a:Premium']['a:AnnualPremium']['_text'];
            testData.price = `£${premiumVal}/year`;
            testData.priceForcedAnnual = `${premiumVal}`;
            const monthlyVal = quote['a:Premium']['a:InstalmentDetails']
                ['a:MonthlyPremium']['_text'];
            testData.monthlyPrice = `£${monthlyVal}/month`;

            let totalExcess = 0.0;
            if (quote['a:Excesses']['a:StandardExcess']['_text'] != '.00') {
                totalExcess = parseInt(
                    quote['a:Excesses']['a:StandardExcess']['_text'],
                );
            }
            testData.totalExcess = `Policy excess is £${totalExcess}`;

            const expiryDate = moment(quote['a:ExpiryDate']['_text'])
                .format('DD/MM/YYYY');
            testData.validUntil = `Your quote is valid until: ${expiryDate}`;

            const underwriter = await this._returnInsurer(
                quote['a:InsurerName']['_text'],
            );
            testData.underwriter = `Your insurer for your policy: ${underwriter}`;

            testData.coverType = await this._coverConvert(
                quote['a:CoverType']['_text'],
            );
            return testData;
        } catch (e) {
            const context = `Failed to update quote test data: ${await this._returnError(e)}`;
            await logger.error(context, e);
            await assert.fail(e);
            throw e;
        }
    }

    async _capitalize(s) {
        await logger.info('In _capitalize');
        return typeof s === 'string' &&
      s.length > 3 ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : s;
    }

    async _filterClientFromQuoteArray(quotes) {
        await logger.info('In _filterClientFromQuoteArray');
        return await quotes.find((q) => q['a:Broker']['_text'] == this.clientCode);
    }

    async _returnInsurer(name) {
        await logger.info('In _returnInsurer');
        const insurers = await config.get('insurers');
        const insurer = await insurers.find((c) => c.code == name);
        return insurer === undefined ? name : insurer.name;
    }

    async _returnError(name) {
        await logger.info('In _returnError');
        const errors = await config.get('errors');
        const error = await errors.find((c) => c.name == name);
        return error === undefined ? name : error.returnValue;
    }

    _getCarQuoteSurname(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']
            ['is:Lead']['is:Persons']['is:Person'][0]['is:Surname']['_text'];
    }

    _setCarQuoteSurname(json, newSurname) {
        json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']
            ['is:Lead']['is:Persons']['is:Person'][0]
            ['is:Surname']['_text'] = newSurname;
    }

    _setHomeQuoteSurname(json, newSurname) {
        json['soapenv:Envelope']['soapenv:Body']['HHQuoteRequest']
            ['Lead']['Persons']['Person'][0]['Surname']['_text'] = newSurname;
    }

    _getFirstName(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']['is:Lead']
            ['is:Persons']['is:Person'][0]['is:FirstName']['_text'];
    }

    _getHomeFirstName(json) {
        return json['soapenv:Envelope']['soapenv:Body']['HHQuoteRequest']['Lead']
            ['Persons']['Person'][0]['FirstName']['_text'];
    }

    _getVanCoverType(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']['is:Lead']
            ['is:Products']['is:CommercialVehicles']['is:CommercialVehicle']
            ['is:CommercialVehicleCover']['is:Covertype']['_text'];
    }

    _getCarCoverType(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']['is:Lead']
            ['is:Products']['is:PrivateCars']['is:PrivateCar']
            ['is:PrivateCarCover']['is:Covertype']['_text'];
    }

    _getVanPaymentType(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']['is:Lead']
            ['is:Products']['is:CommercialVehicles']['is:CommercialVehicle']
            ['is:CommercialVehicleRisks']['is:AggPaymentFrequency']['_text'];
    }

    _getCarPaymentType(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']['is:Lead']
            ['is:Products']['is:PrivateCars']['is:PrivateCar']
            ['is:PrivateCarRisks']['is:AggPaymentFrequency']['_text'];
    }

    _getDateOfBirth(json) {
        return json['soapenv:Envelope']['soapenv:Body']['is:LeadMaster']['is:Lead']
            ['is:Persons']['is:Person'][0]['is:DOB']['_text'];
    }

    _getHomePaymentType(json) {
        return json['soapenv:Envelope']['soapenv:Body']['HHQuoteRequest']['Lead']
            ['Products']['Homes']['Home']['HomeRisks']
            ['AggPaymentFrequency']['_text'];
    }

    _getHomeQuoteSurname(json) {
        return json['soapenv:Envelope']['soapenv:Body']['HHQuoteRequest']
            ['Lead']['Persons']['Person'][0]
            ['Surname']['_text'];
    }

    _getHomeDateOfBirth(json) {
        return json['soapenv:Envelope']['soapenv:Body']['HHQuoteRequest']['Lead']
            ['Persons']['Person'][0]['DOB']['_text'];
    }
}

module.exports = WasHelper;
