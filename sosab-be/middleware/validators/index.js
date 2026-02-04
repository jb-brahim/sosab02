/**
 * Central export for all validation middleware
 */

const workerValidator = require('./workerValidator');
const projectValidator = require('./projectValidator');

module.exports = {
    // Worker validators
    ...workerValidator,

    // Project validators
    ...projectValidator,
};
