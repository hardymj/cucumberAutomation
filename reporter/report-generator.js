const {CucumberConverter} = require('cucumber-to-junit');
const converter = new CucumberConverter({
    markUndefinedAsFailed: true,
});
converter.convertToJunit('reports/cucumber.json', 'reports/report.xml');
