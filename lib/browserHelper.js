'use strict';
const logger = require('../logging/logger');

class BrowserHelper {
    _browserToRunAgainst(defaultBrowser) {
        logger.info('In _browserToRunAgainst');
        const fs = require('fs');

        if (!process.env.BROWSER) {
            if (fs.existsSync('config/' + defaultBrowser + '.js')) {
                return 'config/' + defaultBrowser + '.js';
            }

            logger.error('In _browserToRunAgainst error');
            throw new Error(`Unknown Browser config: ${defaultBrowser}`);
        }

        if (fs.existsSync('config/' + process.env.BROWSER + '.js')) {
            return 'config/' + process.env.BROWSER + '.js';
        }

        function filterItems(arr, query) {
            return arr.filter(function(el) {
                return el.toLowerCase().indexOf(query.toLowerCase()) !== -1;
            });
        }

        const activeConfigFiles = fs.readdirSync('config/activeConfig/');
        const browserSpecificConfigFiles = filterItems(activeConfigFiles, process.env.BROWSER + '_');

        if (process.env.DEVICEBROWSER) {
            const deviceBrowserFile = browserSpecificConfigFiles.find(
                (element) => element.toLowerCase().includes(process.env.DEVICEBROWSER.toLowerCase()));

            if (fs.existsSync('config/activeConfig/' + deviceBrowserFile)) {
                return 'config/activeConfig/' + deviceBrowserFile;
            }

            logger.error('In _browserToRunAgainst error');
            throw new Error(`Unknown Browser config: ${deviceBrowserFile}`);
        }

        const randomNumber = Math.floor(Math.random() * browserSpecificConfigFiles.length);
        return 'config/activeConfig/' + browserSpecificConfigFiles[randomNumber];
    }
}
const browserHelper = new BrowserHelper();
module.exports = browserHelper;
