// controllers/index.js
const register = require('./register');
const ranking = require('./ranking');
const join = require('./join');
const leave = require('./leave');
const notify = require('./notify');
const update = require('./update');

module.exports = {
    register: register.register,
    ranking: ranking.ranking,
    join: join.join,
    leave: leave.leave,
    notify: notify.notify,
    update: update.update,
};
