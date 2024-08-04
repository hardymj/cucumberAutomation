'use strict';

const config = require('config');
const logger = require('../logging/logger');
const moment = require('moment');
let dataFound = false;
const axios = require('axios');
const chai = require('chai');
const expect = chai.expect;

class TDSApiHelper {
    async apiCall(testData) {
        let retryCount = config.get('getQuoteAttempts') || 2;
        try {
            do {
                const attempt = (config.get('getQuoteAttempts') || 2) - (retryCount - 1);
                await logger.info(`Calling TDS Service attempt number ${attempt}`);
                await this.readService(
                    config.get('tdsServiceUrl') + testData.tdsServiceId,
                    testData,
                );
                await logger.info('TDS ServiceReturned');
                retryCount--;
            } while (!dataFound && retryCount > 0);

            if (!dataFound) {
                throw testData.error;
            }
        } catch (e) {
            await logger.error('TDSApiHelper apiCall', e);
            await expect(e.message).to.equal('Unable to retrieve a policy from the TDS Service');
        }
    }

    async pregApiCall(testData) {
        try {
            do {
                await logger.info('Calling Preg remover');
                const pegbttools = config.get('peg-bttools');
                const preg = config.get('preg');
                const environment = config.get('environment');
                const url = `${pegbttools}${preg}?policyNumber=${testData.policyNumber}&environment=${environment}`;
                await this.removePreg(url);
                await logger.info('Preg returned');
            } while (!dataFound);
        } catch (e) {
            await logger.error('TDSApiHelper pregApiCall', e);
        }
    }

    async removePreg(url) {
        try {
            await logger.info(url);
            return new Promise(
                (resolve, reject) => {
                    axios.get(url)
                        .then(function(response) {
                            dataFound = true;
                            resolve(response);
                        })
                        .catch(function(error) {
                            reject(error);
                        });
                },
            );
        } catch (e) {
            await logger.error('TDSApiHelper removePreg', e);
        }
    }

    async readService(url, testData) {
        try {
            await logger.info('Url is ' + url);
            return new Promise(
                (resolve, reject) => {
                    axios.get(url)
                        .then(function(response) {
                            dataFound = response.data.person != null &&
                response.data.person != undefined ? true : false;
                            try {
                                testData.personName = response.data.person.firstname;
                                testData.surname = response.data.person.lastname;
                                testData.dateOfBirth = moment(
                                    response.data.person.dateofbirth,
                                    'YYYY-MM-DD',
                                ).format('DD/MM/YYYY');
                                testData.policyNumber = response.data.person.customeraccountid;
                                testData.startDate = moment(
                                    response.data.policy[0].starttimestamp,
                                    'YYYY-MM-DD',
                                ).format('DD MMM YYYY').toUpperCase();
                                const endDate = response.data.policy[0].statuscode != 'A' ?
                                    response.data.policy[0].cancellationtimestamp :
                                    response.data.policy[0].expirytimestamp;
                                testData.endDate = moment(
                                    endDate,
                                    'YYYY-MM-DD',
                                ).format('DD MMM YYYY').toUpperCase();

                                testData.policy = response.data.policy;
                                let policyCount = 0;
                                do {
                                    testData.policy[policyCount].startDate = moment(
                                        testData.policy[policyCount].starttimestamp,
                                        'YYYY-MM-DD',
                                    ).format('DD MMM YYYY').toUpperCase();
                                    const endDatePolicy = testData.policy[policyCount].statuscode != 'A' ?
                                        testData.policy[policyCount].cancellationtimestamp :
                                        testData.policy[policyCount].expirytimestamp;
                                    testData.policy[policyCount].endDate = moment(
                                        endDatePolicy,
                                        'YYYY-MM-DD',
                                    ).format('DD MMM YYYY').toUpperCase();
                                    policyCount++;
                                } while (policyCount < testData.policy.length);


                                if (testData.makeAPayment) {
                                    let notificationCount = 0;
                                    do {
                                        if (response.data.notification[notificationCount].code == 'MAKE_A_PAYMENT') {
                                            testData.notificationPolicy = response.data.notification[notificationCount].policyid;
                                            break;
                                        }
                                        notificationCount++;
                                    } while (notificationCount < response.data.notification.length);
                                }


                                const contactDetails = response.data.contactdetails;
                                let phoneNumber = '';
                                if (contactDetails.homephonecode &&
                    contactDetails.homephonenumber) {
                                    phoneNumber = contactDetails.homephonecode +
                    contactDetails.homephonenumber;
                                } else if (contactDetails.workphonecode &&
                    contactDetails.workphonenumber) {
                                    phoneNumber = contactDetails.workphonecode +
                    contactDetails.workphonenumber;
                                }

                                testData.phoneNumber = phoneNumber;
                                testData.emailAddress = response.data.contactdetails.emailaddress;
                                testData.policyStatus = response.data.customeraccount.statuscode;

                                const coverfeature=response.data.coverfeature;
                                testData.policyCover='';
                                for (let x=0; x<coverfeature.length; x++) {
                                    if (coverfeature[x].featurecode == 'buildings-cover' || coverfeature[x].featurecode == 'contents-cover') {
                                        const coverType = coverfeature[x].featurecode.replace('-cover', '');
                                        testData.policyCover = testData.policyCover == '' ? coverType : `${testData.policyCover} and ${coverType}`;
                                    }
                                }
                            } catch (e) {
                                logger.error('TDSApiHelper readService try parse data', e);
                                testData.error = e;
                                resolve(e);
                            }
                            resolve(response);
                        })
                        .catch(function(e) {
                            logger.error('TDSApiHelper readService axios.get', e);
                            testData.error = e;
                            resolve(e);
                        });
                },
            );
        } catch (e) {
            await logger.error('TDSApiHelper readService', e);
        }
    }
}

const tdsApiHelper = new TDSApiHelper;
module.exports = tdsApiHelper;
