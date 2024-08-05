const common = {
    parallel: 2,
    retry: 0,
    format: ['./teamcity-cucumber-formatter',
        'html:cucumber-report.html',
        'json:reports/cucumber.json',
    ],
    require: ['features/support/*.js'],
};

module.exports = {
    default: {
        ...common,
    },
    cli: {
        ...common,
        paths: ['journeys/*/*/*.feature'],
    },
};
