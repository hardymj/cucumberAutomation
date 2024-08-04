'use strict';
const __importDefault = (this && this.__importDefault) || function(mod) {
  return (mod && mod.__esModule) ? mod : {'default': mod};
};
Object.defineProperty(exports, '__esModule', {value: true});
const cucumberJs = require('@cucumber/cucumber');
const logger = require('../../logging/logger');
const filePath = __importDefault(require('path'));
let storedFeatureName = ``;

let testCaseArray = [];
let completedTestCaseArray = [];


class TeamCityFormatter extends cucumberJs.Formatter {
  constructor(options) {
    super(options);
    options.eventBroadcaster.on('envelope', (envelope) => {
      if (envelope.testCaseStarted) {
        this.logTestCaseStarted(envelope.testCaseStarted.id);
      }
      if (envelope.testCaseFinished) {
        this.logTestCaseFinished(envelope.testCaseFinished.testCaseStartedId);
      }
      if (envelope.testRunFinished) {
        for (const obj of completedTestCaseArray) {
          this.log(`##teamcity[testStarted name='${obj.name}' timestamp='${obj.startDateTime}' captureStandardOutput='true']\n`);
          logger.info(`##teamcity[testStarted name='${obj.name}' timestamp='${obj.startDateTime}' captureStandardOutput='true']\n`);
          if (obj.message !='') {
            this.log(`##teamcity[testFailed name='${obj.name}' message='${obj.message}' details='${obj.details}']\n`);
            logger.info(`##teamcity[testFailed name='${obj.name}' message='${obj.message}' details='${obj.details}']\n`);
          }
          this.log(`##teamcity[testFinished name='${obj.name}' timestamp='${obj.dateString}']\n`);
          logger.info(`##teamcity[testFinished name='${obj.name}' timestamp='${obj.dateString}']\n`);
        }
        this.log(`##teamcity[testSuiteFinished name='${storedFeatureName}']\n`);
        logger.info(`##teamcity[testSuiteFinished name='${storedFeatureName}']\n`);
      }
    });
  }
  logTestSuiteChanged(currentFeature) {
    if (currentFeature.name !== storedFeatureName) {
      if (storedFeatureName) {
        this.log(`##teamcity[testSuiteFinished name='${storedFeatureName}']\n`);
        logger.info(`##teamcity[testSuiteFinished name='${storedFeatureName}']\n`);
      }
      this.log(`##teamcity[testSuiteStarted name='${this.escape(currentFeature.name)}']\n`);
      logger.info(`##teamcity[testSuiteStarted name='${this.escape(currentFeature.name)}']\n`);
      storedFeatureName = currentFeature.name;
    }
  }

  logTestCaseStarted(id) {
    const {gherkinDocument: {feature: currentFeature}, pickle: {name: pickleName}} = this.eventDataCollector.getTestCaseAttempt(id);
    this.logTestSuiteChanged(currentFeature);

    let dateString = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString();
    dateString = dateString.replace('Z', '');

    const objIndex = testCaseArray.findIndex((o) => o.name === this.escape(pickleName));
    if (objIndex>=0) {
      testCaseArray = testCaseArray.filter((item) => item.name !== this.escape(pickleName));
    }
    const completedObjIndex = completedTestCaseArray.findIndex((o) => o.name === this.escape(pickleName));
    if (completedObjIndex>=0) {
      completedTestCaseArray = completedTestCaseArray.filter((item) => item.name !== this.escape(pickleName));
    }

    testCaseArray.push(
        {
          name: this.escape(pickleName),
          message: '',
          details: '',
          duration: 0,
          startDateTime: dateString,
        },
    );
  }
  logTestCaseFinished(testCaseStartedId) {
    const testCaseAttempt = this.eventDataCollector.getTestCaseAttempt(testCaseStartedId);
    const {pickle: {name: pickleName}, stepResults: currentStepResults} = testCaseAttempt;
    let errorCount=0;
    for (const step of Object.values(currentStepResults)) {
      if (step.status === cucumberJs.Status.FAILED) {
        this.logTestFailed(pickleName, testCaseAttempt, step.status);
        errorCount++;
      } else if (step.status === cucumberJs.Status.AMBIGUOUS) {
        this.logTestFailed(pickleName, testCaseAttempt, step.status);
        errorCount++;
      }
    }
    if (errorCount==0) {
      completedTestCaseArray = completedTestCaseArray.filter((item) => item.name !== this.escape(pickleName));
    }
    const testCaseDurationInSeconds = (Object.values(currentStepResults).map((obj) => obj.duration.nanos)
        .reduce((acc, curr) => acc + curr) / 1e9).toFixed(3);
    this.logTestFinished(pickleName, testCaseDurationInSeconds);
  }
  logTestFailed(pickleName, testCaseAttempt, stepStatus) {
    const details = cucumberJs.formatterHelpers.formatIssue({
      colorFns: this.colorFns,
      number: 1,
      snippetBuilder: this.snippetBuilder,
      testCaseAttempt,
      supportCodeLibrary: this.supportCodeLibrary,
    });
    const objIndex = completedTestCaseArray.findIndex((o) => o.name === this.escape(pickleName));
    if (objIndex>=0) {
      completedTestCaseArray[objIndex].message = this.escape(pickleName + ' ' + stepStatus);
      completedTestCaseArray[objIndex].details = this.escape(details);
    } else {
      const obj = testCaseArray.find((o) => o.name === this.escape(pickleName));
      obj.message=this.escape(pickleName + ' ' + stepStatus);
      obj.details=this.escape(details);
      completedTestCaseArray.push(obj);
    }
  }
  logArtifacts(pickleName) {
    if (process.env.TEAMCITY_CUCUMBER_PATH_TO_SCREENSHOTS) {
      const screeshotName = process.env.TEAMCITY_CUCUMBER_SCREENSHOT_NAME ? process.env.TEAMCITY_CUCUMBER_SCREENSHOT_NAME : pickleName;
      const screenshotExtension = process.env.TEAMCITY_CUCUMBER_SCREENSHOT_EXTENSION ? process.env.TEAMCITY_CUCUMBER_SCREENSHOT_EXTENSION : `png`;
      const pathToScreenshot = filePath.default.resolve(process.env.TEAMCITY_CUCUMBER_PATH_TO_SCREENSHOTS, `${screeshotName}.${screenshotExtension}`);
      if (process.env.TEAMCITY_CUCUMBER_PUBLISH_ARTIFACTS_RUNTIME) {
        const artifactsPathPostfix = process.env.TEAMCITY_CUCUMBER_ARTIFACTS_SUB_FOLDER ? ` => ${process.env.TEAMCITY_CUCUMBER_ARTIFACTS_SUB_FOLDER}` : ``;
        this.log(`##teamcity[publishArtifacts '${this.escape(pathToScreenshot + artifactsPathPostfix)}']\n`);
      }
      const artifactsSubFolder = process.env.TEAMCITY_CUCUMBER_ARTIFACTS_SUB_FOLDER ? `${process.env.TEAMCITY_CUCUMBER_ARTIFACTS_SUB_FOLDER}/` : ``;
      this.log(`##teamcity[testMetadata type='image' name='${this.escape(pickleName)}' value='${this.escape(artifactsSubFolder + `${screeshotName}.${screenshotExtension}`)}']\n`);
    }
  }
  logTestFinished(pickleName, durationInSeconds) {
    let dateString = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString();
    dateString = dateString.replace('Z', '');
    const objIndex = completedTestCaseArray.findIndex((o) => o.name === this.escape(pickleName));
    if (objIndex>=0) {
      completedTestCaseArray[objIndex].duration = durationInSeconds;
      completedTestCaseArray[objIndex].dateString = dateString;
    } else {
      const obj = testCaseArray.find((o) => o.name === this.escape(pickleName));
      obj.duration=durationInSeconds;
      obj.dateString = dateString;
      completedTestCaseArray.push(obj);
    }
  }
  escape(text) {
    return text
        .replace(/\|/g, '||')
        .replace(/'/g, '|\'')
        .replace(/\n/g, '|n')
        .replace(/\r/g, '|r')
        .replace(/\[/g, '|[')
        .replace(/]/g, '|]')
        .replace(/\[90m/g, '')
        .replace(/\[32m/g, '')
        .replace(/\[39m/g, '')
        .replace(/\[36m/g, '')
        .replace(/\[31m/g, '')
        .replace(/√/g, '')
        .replace(/Ã/g, '')
    ;
  }
}
exports.default = TeamCityFormatter;
