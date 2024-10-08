const common = {
    parallel: 2,
    retry: 0,
    format: [
        'html:cucumber-report.html',
        'json:reports/report.json',
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
