const reporter = require('cucumber-html-reporter');
const options = {
    theme: 'hierarchy',
    jsonFile: 'reports/cucumber.json',
    output: 'reports/cucumber_report.html',
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true,
    launchReport: false,
    failedSummaryReport: false,
};

reporter.generate(options);
