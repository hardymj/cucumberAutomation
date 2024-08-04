'use strict';

const fs = require('fs');
const folderName = 'logs/';
const logfileName = 'log.txt';
const speciallogfileName = 'logs/special.txt';
const config = require('config');
const loggingLevels = config.get('loggingLevels');

class Logger {    
    testName(testCase){
        this._testCase = testCase;
    }
    log(type, message) {
        if (this.folderDoesNotExist(folderName)) {
            this.createFolder(folderName);
        }
        this.addToLogFile(
            folderName + logfileName,
            `${this.getDateAndTime()} - ${this._testCase} - ${type} - ${message} \n`,
        );
    }

    folderDoesNotExist(folder) {
        try {
            return !fs.statSync(folder).isDirectory();
        } catch (err) {
            if (err.code == 'ENOENT') {
                return true;
            } else {
                throw err;
            }
        }
    }

    createFolder(folder) {
        fs.mkdir(folder, {
            recuusive: true,
        }, (err) => {
            if (err) throw err;
        });
    }

    addToLogFile(logFileAndPath, message) {
        fs.appendFile(logFileAndPath, message, (err) => {
            if (err) throw err;
        });
    }

    error(context, exception) {
        if (loggingLevels.includes('error')) {
            this.log('error', `\n\n----ERROR----\n Context: ${context} ${exception ? `\n Exception: ${exception}\n` : '\n'}`);
        }
    }

    info(message) {
        if (loggingLevels.includes('info')) {
            this.log('info   ', message);
        }
    }

    verbose(message) {
        if (loggingLevels.includes('verbose')) {
            this.log('verbose', message);
        }
    }

    debug(message) {
        if (loggingLevels.includes('debug')) {
            this.log('debug  ', message);
        }
    }

    special(message) {
        fs.appendFile(
            speciallogfileName,
            `${this.getDateAndTime()} - ${message} \n`,
            (err) => {
                if (err) throw err;
            },
        );
    }

    getDateAndTime() {
        const currentDateAndTime = new Date();

        const day = ('0' + currentDateAndTime.getDate()).slice(-2);
        const month = ('0' + (currentDateAndTime.getMonth() + 1)).slice(-2);
        const year = currentDateAndTime.getFullYear();
        const hours = ('0' + currentDateAndTime.getHours()).slice(-2);
        const minutes = ('0' + currentDateAndTime.getMinutes()).slice(-2);
        const seconds = ('0' + currentDateAndTime.getSeconds()).slice(-2);

        return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`;
    }
}

const logger = new Logger();
module.exports = logger;
