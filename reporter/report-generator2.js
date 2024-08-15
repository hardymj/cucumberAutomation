const cucumberJunitConvert = require('cucumber-junit-convert');

const options = {
    inputJsonFile: 'reports/report.json',
    outputXmlFile: 'reports/report2.xml',
    featureNameAsClassName: true, // default: false
    failOnUndefinedStep: false, // default: false
};

cucumberJunitConvert.convert(options);
