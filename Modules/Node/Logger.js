global.info = function(text) {
    log(text, "info");
}

global.error = function(error) {
    if (typeof error == "string") {
        log(error, "error");
        return;
    }
    log({ message: error.message, stack: error.stack }, "error");
}

global.debug = function(text) {
    log(text, "debug");
}

global.warn = function(text) {
    log(text, "warn");
}


global.log = function(value, type) {
    if (!type) {
        type = "?";
    }
    value = { content: value, datetime: new Date(), type: type };
    if (global.Channels) {
        Channels.emit("log." + type, value);
    }
    else {
        console.log(value);
    }
}

module.exports = function(ChannelPrefix) {
    return {
        info: function(text) {
            this.localLog(text, "info");
        },

        error: function(error) {
            if (typeof error == "string") {
                localLog(error, "error");
                return;
            }
            this.localLog({ message: error.message, stack: error.stack }, "error");
        },

        warn: function(text) {
            this.localLog(text, "debug");
        },

        debug: function(text) {
            this.localLog(text, "debug");
        },

        localLog: function(value, type) {
            if (!type) {
                type = "?";
            }
            value = { content: value, datetime: new Date(), type: type };
            Channels.emit(ChannelPrefix + "." + type, value);
        }
    }
};