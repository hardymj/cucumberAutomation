const {CucumberConverter} = require('cucumber-to-junit');
const converter = new CucumberConverter({
    markUndefinedAsFailed: true,
});
converter.convertToJunit('reports/report.jsonn', 'reports/report.xml');
