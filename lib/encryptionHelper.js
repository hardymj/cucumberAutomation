'use strict';

const axios = require('axios');
const logger = require('../logging/logger');
class EncryptionHelper {
    async apiCall(url) {
        let encryptionHash;
        await axios.get(url).then((response) =>{
            encryptionHash = response.data.encryptedHash;
        })
            .catch((error) => {
                logger.error('EncryptionHelper readService axios.get', error);
            });
        return encryptionHash;
    }
}
const encryptionHelper = new EncryptionHelper();
module.exports = encryptionHelper;
