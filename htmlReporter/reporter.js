'use strict';

const fs = require('fs');
const path = require('path');
const logging = require('selenium-webdriver/lib/logging');

// path setup
const templatePath = path.join(__dirname, 'report.html');
const fileContents = fs.readFileSync(templatePath).toString();

/** A jasmine reporter that produces an html report **/
class Reporter {
    /**
     * @constructor
     * @param {Object} options - options for the reporter
     * @param {String} options.path - Path the report.html will be written to
     * @param {Boolean} options.screenshotOnPassed=false - take screenshots for passing tests too
     * @param {Boolean} options.writeReportEachSpec=true - write the report between each spec, recommended for long running tests
     * @param {Boolean} options.showBrowser=true - show browser icon on the overview
     * @param {Boolean} options.highlightSuspectLine=true - highlight the "suspect line" in the detail dialog
     * @param {Boolean} options.isSharded=false - use if using shardOnSpec of multiCapabilities options in protractor
     */
    constructor(options) {
        this.sequence = [];
        this.counts = {specs: 0};
        this.timer = {};
        this.currentSpec = null;
        this.browserLogs = [];
        this.driver;
        this.accessibility = process.env.ACCESSIBILITY != undefined && process.env.ACCESSIBILITY == 'true';

        this.options = Reporter.getDefaultOptions();
        this.setOptions(options);

        if (!this.options.path) {
            throw new Error('Please provide options.path');
        }

        this.imageLocation = this.options.path;
        this.dataLocation = this.options.path;
        this.destination = path.join(this.options.path, 'report.html');
        this.dataFile = path.join(this.dataLocation, `${process.pid}.js`);

        this.hasWrittenReportFile = false;
        this.startReporter();
    }

    startReporter() {
        Reporter.cleanDirectory(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.options.path);
        Reporter.makeDirectoryIfNeeded(this.imageLocation);
        Reporter.makeDirectoryIfNeeded(this.dataLocation);

        this.timer.started = Reporter.nowString();
    }

    setDriverForScreenshotReporter(driver) {
        this.driver = driver;
    }

    stopReporter() {
        this.writeDataFile();

        if (this.hasWrittenReportFile) {
            return;
        }

        const resultContents = fs.readdirSync(this.dataLocation).map((file) => {
            return `<script src="${file}"></script>`;
        }).join('\n');

        const results = fileContents.replace('<!-- inject::scripts -->', resultContents);
        fs.writeFileSync(this.destination, results, 'utf8');

        this.hasWrittenReportFile = true;
    }

    jasmineStarted(suiteInfo) {
        if (!this.options.isSharded) {
            this.startReporter();
        }
    };

    async afterEachTest() {
        this.currentSpec.stopped = await Reporter.nowString();
        this.currentSpec.duration = new Date(this.currentSpec.stopped) - new Date(this.currentSpec.started);
        this.currentSpec.prefix = this.currentSpec.fullName.replace(this.currentSpec.description, '');

        // await this.driver.executeScript('window.scrollTo(0, document.body.scrollHeight/2);');

        await this.driver.takeScreenshot()
            .then((png) => {
                this.currentSpec.base64screenshot = png;
            });
        await this.driver.getCapabilities()
            .then((capabilities) => {
                this.currentSpec.browserName = capabilities.get('browserName');
                this.currentSpec.deviceName = capabilities.get('deviceName') == undefined ? capabilities.get('browserName') : capabilities.get('deviceName');
                this.currentSpec.platform = capabilities.get('platformName');
                this.currentSpec.platformVersion = capabilities.get('platformVersion') == undefined ? capabilities.get('browserVersion') : capabilities.get('platformVersion');
            });


        let browserLogs = '';
        if (this.currentSpec.browserName == 'Safari') {
            try {
                browserLogs = await this.driver.manage().logs().get('safariConsole');
            } catch (err) {
                browserLogs = '';
            }
        } else {
            try {
                browserLogs = await this.driver.manage().logs().get(logging.Type.BROWSER);
            } catch (err) {
                try {
                    browserLogs = await this.driver.manage().logs().get('syslog');
                } catch (err) {
                    browserLogs = '';
                }
            }
        }


        this.currentSpec.browserLogs = browserLogs;

        if (this.accessibility && this.currentSpec.logAccessibilityInformation != undefined && this.currentSpec.logAccessibilityInformation.length > 1) {
            await expect(true).toBe(false, 'Accessibility Check');
        }
    }

    async testDataString(dataString) {
        this.currentSpec.testDataString = dataString.replace(/ /g, '').split('\n');
        this.currentSpec.testDataString = this.currentSpec.testDataString.filter(function(item) {
            return item.indexOf('//') !== 0 && item.indexOf('newTestData()') !==0 && item.length !==0;
        });
    }

    async logAccessibilityInformationToReport(log, errorContext) {
        if (this.currentSpec != null) {
            if (this.currentSpec.logAccessibilityInformation == undefined) {
                this.currentSpec.logAccessibilityInformation = [];
            }
            const violations = this.violations(log, errorContext);
            this.currentSpec.logAccessibilityInformation.push(violations);
        }
    }


    async logInformationToReport(log) {
        if (this.currentSpec != null) {
            if (this.currentSpec.logInformation == undefined) {
                this.currentSpec.logInformation = [];
            }
            this.currentSpec.logInformation.push({'name': '', 'message': log});
        }
    }

    suiteStarted(result) {
    };

    specStarted(result) {
        this.counts.specs++;
        this.currentSpec = result;
        this.currentSpec.started = Reporter.nowString();
    };

    specDone(result) {
        this.currentSpec.status = result.status;
        // this.counts[this.currentSpec.status] = (this.counts[this.currentSpec.status] || 0) + 1;

        if (this.currentSpec.status !== 'disabled' && this.currentSpec.status !== 'pending' && this.currentSpec.status !== 'excluded') {
            this.sequence.push(this.currentSpec);

            // Handle screenshot saving
            if (this.currentSpec.status !== 'disabled' && this.currentSpec.status !== 'pending' && this.currentSpec.status !== 'excluded' && (this.currentSpec.status !== 'passed' || this.options.screenshotOnPassed)) {
                this.currentSpec.screenshotPath = `${process.pid}-${this.counts.specs}.png`;

                // Only attempts to save the screenshot if one was successfully taken.
                if (this.currentSpec.base64screenshot) {
                    this.writeImage(this.currentSpec.base64screenshot);
                }
            }

            // remove this from the payload that is written to report.html;
            delete this.currentSpec.base64screenshot;

            // suspectLine
            result.failedExpectations.forEach((failure) => {
                failure.hasSuspectLine = failure.stack.split('\n').some(function(line) {
                    const match = line.indexOf('Error:') === -1 && line.indexOf('node_modules') === -1;

                    if (match) {
                        failure.suspectLine = line;
                    }

                    return match;
                });
            });

            if (this.currentSpec.logAccessibilityInformation != undefined) {
                this.currentSpec.logAccessibilityInformation.forEach((failure) =>{
                    failure.forEach((issues) =>{
                        const failed = {};
                        failed.hasSuspectLine = true;
                        // failed.message = issues.screen + " " + issues.object + " has the accessibility issue [" + issues.failureSummary + " " + issues.html +"]";
                        failed.message = issues;
                        failed.suspectLine = issues.url;
                        this.currentSpec.status = result.status = 'failed';

                        // });

                        if (result.failedAccessibilityExpectations == undefined) {
                            result.failedAccessibilityExpectations = [];
                        }
                        const alreadyPresent = result.failedAccessibilityExpectations.some((fail) => fail.message.failureSummary === failed.message.failureSummary);
                        if (!alreadyPresent) {
                            result.failedAccessibilityExpectations.push(failed);
                        }
                    });
                });
                this.currentSpec.failedAccessibilityExpectations = result.failedAccessibilityExpectations;
            }

            this.counts[this.currentSpec.status] = (this.counts[this.currentSpec.status] || 0) + 1;
        }

        if (this.options.writeReportEachSpec) {
            this.jasmineDone();
        }
    };

    suiteDone(result) {
    };

    jasmineDone() {
        this.timer.stopped = Reporter.nowString();
        this.timer.duration = new Date(this.timer.stopped) - new Date(this.timer.started);
        this.stopReporter();
    };

    setOptions(options) {
        this.options = Object.assign(this.options, options);
    };

    writeDataFile() {
        const logEntry = {
            options: this.options,
            timer: this.timer,
            counts: this.counts,
            sequence: this.sequence,
            accessibility: this.accessibility,
        };

        const json = JSON.stringify(logEntry, null, !this.options.debugData ? null : 4);

        fs.writeFileSync(this.dataFile, `window.RESULTS.push(${json});`, 'utf8');
    }

    writeImage(img) {
        const stream = fs.createWriteStream(path.join(this.options.path, this.currentSpec.screenshotPath));
        stream.write(new Buffer.from(img, 'base64'));
        stream.end();
    }

    static getDefaultOptions() {
        return {
            screenshotOnPassed: false,
            writeReportEachSpec: true,
            showBrowser: true,
            highlightSuspectLine: true,
            driver: null,
        };
    }

    static cleanDirectory(dirPath) {
        let files = [];
        try {
            files = fs.readdirSync(dirPath);
        } catch (e) {
            return;
        }
        if (files.length > 0) {
            for (let i = 0; i < files.length; i++) {
                const filePath = dirPath + '/' + files[i];

                if (fs.statSync(filePath).isFile()) {
                    fs.unlinkSync(filePath);
                } else {
                    Reporter.cleanDirectory(filePath);
                }
            }
        }
        fs.rmdirSync(dirPath);
    }

    static makeDirectoryIfNeeded(path) {
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }
    }

    static nowString() {
        return (new Date()).toISOString();
    }

    violations(results, errorContext) {
        let i;
        let j;
        let k;
        let node;
        let nodeCount;
        let nodes;
        let target;
        let targetCount;
        let targets;
        let violation;
        let violationCount;
        const violations = results.violations;

        const violationsArray = [];

        if (typeof violations !== 'undefined') {
            violationCount = violations.length;

            if (violationCount > 0) {
                for (i = 0; i < violationCount; i += 1) {
                    violation = violations[i];
                    nodes = violation.nodes;

                    if (typeof nodes !== 'undefined') {
                        nodeCount = nodes.length;

                        for (j = 0; j < nodeCount; j += 1) {
                            node = nodes[j];

                            if (typeof node !== 'undefined') {
                                targets = node.target;
                                if (typeof targets !== 'undefined') {
                                    targetCount = targets.length;
                                    for (k = 0; k < targetCount; k += 1) {
                                        target = targets[k];
                                    }
                                }

                                const violationClass = {};
                                violationClass.failureSummary = node.failureSummary;
                                violationClass.impact = node.impact;
                                violationClass.help = violation.help;
                                violationClass.description = violation.description;
                                violationClass.screen = errorContext;
                                violationClass.id = target;

                                violationsArray.push(violationClass);
                            } else {
                                console.log('');
                            }
                        }
                    }
                }
            }
        }
        return violationsArray;
    }
}

module.exports = Reporter;
