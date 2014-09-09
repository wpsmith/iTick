/**!
 * iTick by WP Smith - github.com/wpsmith/this
 * Based on code by James Edwards:
 *    sitepoint.com/creating-accurate-time.timers-in-javascript/
 *    iTick by Mr Chimp - github.com/mrchimp/tock
 */
// Implements Date.now() for ie lt 9
Date.now = Date.now || function() {
    return +new Date();
};

// iTick object
var iTick = function(options) {
    // Handles instances
    iTick.instances = (iTick.instances || 0) + 1;
    // Internal properties/variables
    var i = {
        o: {},
        // stores merged options & default options
        running: false,
        // whether iTick is running
        defaults: {
            // default options
            interval: 10,
            countdown: false,
            onTick: null,
            onStatusChange: null,
            onStart: null,
            onEnd: null,
            onPause: null
        },
        id: "iTick_" + +new Date(),
        // ID option
        timeout: null,
        // Holds timeout ID for destroying
        missed_ticks: null,
        // Ticks missed
        time: {
            // Time object
            start: 0,
            // Time iTick started
            pause: 0,
            // Time iTick paused
            end: 0,
            // Time iTick ended
            time: 0
        },
        laps: [],
        // Internal laps
        duration_ms: 0,
        // Duration in milliseconds
        elapsed: 0,
        // Elapsed time 
        status: "initialized"
    };
    /**
     * Extend object, function from underscoreJS.
     * Properties are over-written by later arguments.
     * 
     * @param  {object} obj Destination object to be extended.
     * @return {object} obj Extended object.
     */
    function extend(obj) {
        "use strict";
        var type = typeof obj, source, sourceType, prop, i, length;
        if (!(type === "function" || type === "object" && !!obj)) {
            return obj;
        }
        for (i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            sourceType = typeof source;
            if (!(sourceType === "function" || sourceType === "object" && !!obj)) {
                continue;
            }
            for (prop in source) {
                obj[prop] = source[prop];
            }
        }
        return obj;
    }
    /**
     * Reset the clock
     */
    function reset() {
        if (i.countdown) {
            return false;
        }
        var running = false;
        if (i.running) {
            running = true;
        }
        stop();
        i.time.start = 0;
        i.time.time = 0;
        i.elapsed = "0.0";
        if (running) {
            start();
        }
        _changeStatus("reset");
    }
    /**
     * Calls a specific callback function after checking
     * to see if the function is actually a function.
     * 
     * @param  {Function} cb Function to be called.
     * @return {bool}        Whether callback was called.
     */
    function _callback(cb) {
        if ("function" === typeof i[cb]) {
            i[cb](this);
            return true;
        }
        return false;
    }
    /**
     * Start the clock.
     *
     * @param {int} duration Time in milliseconds.
     */
    function start(duration) {
        if (i.running && !duration) {
            stop();
            reset();
        } else if (i.running) {
            return;
        }
        if ("undefined" === typeof duration) {
            duration = 0;
        }
        i.time.start = duration;
        _callback("onStart");
        if (i.countdown) {
            _startCountdown(i.time.start);
        } else {
            _startTimer(i.time.start);
        }
    }
    /**
     * Called every tick for timers.
     * Interval is set via options, defaults to 10.
     */
    function _tick() {
        i.time.time += i.interval;
        i.elapsed = ~~(i.time.time / i.interval) / 10;
        if (Math.round(i.elapsed) === i.elapsed) {
            i.elapsed += ".0";
        }
        var diff = Date.now() - i.time.start - i.time.time, next_interval_in = i.interval - diff;
        _callback("onTick");
        if (i.countdown && i.duration_ms - i.time.time < 0) {
            i.time.end = 0;
            i.running = false;
            _callback("onEnd");
        }
        if (next_interval_in <= 0) {
            i.missed_ticks = ~~(Math.abs(next_interval_in) / i.interval);
            i.time.time += i.missed_ticks * i.interval;
            if (i.running) {
                _tick();
            }
        } else {
            if (i.running) {
                i.timeout = window.setTimeout(_tick, next_interval_in);
            }
        }
    }
    /**
     * Stop the clock.
     */
    function stop() {
        i.running = false;
        _changeStatus("stopped");
        window.clearTimeout(this.timeout);
        if (i.countdown) {
            i.time.end = duration_ms - i.time.time;
        } else {
            i.time.end = Date.now() - i.time.start;
            _callback("onEnd");
        }
    }
    /**
     * Stop/start the clock.
     */
    function pause() {
        _changeStatus("paused");
        _callback("onPause");
        if (i.running) {
            i.time.pause = lap();
            stop();
        } else {
            start(i.time.pause);
        }
    }
    /**
     * Get the current clock time.time in ms.
     *
     * @param {bool} formatted Whether to pretty return the current time.
     * @return {int|string} t Returned time value.
     */
    function lap(formatted) {
        var t;
        if (i.running) {
            var now;
            if (i.countdown) {
                now = i.duration_ms - (Date.now() - i.time.start);
            } else {
                now = Date.now() - i.time.start;
            }
            i.laps.push(now);
            t = now;
        } else {
            t = i.time.pause || i.time.end;
            i.laps.push(t);
        }
        if (formatted) {
            return msToTime(t);
        }
        return t;
    }
    /**
     * Formats integer with leading zeros to match length. 
     *
     * @access private
     * @param  {int} int    Integer needing leading zeroes.
     * @param  {int} length Desired length/places of number.
     * @return {str}        Formatted number as a string.
     */
    function _leadingZero(t, length) {
        var str = t.toString();
        if (str.length < length) {
            for (var i = str.length; i < length; i++) {
                str = "0" + str;
            }
        }
        return str;
    }
    /**
     * Format milliseconds as a string.
     *
     * @param {int} duration Time in milliseconds to be converted.
     */
    function msToTime(duration) {
        if (duration <= 0) {
            return "00:00:00.000";
        }
        var ms, s, m, h;
        // Do the math
        ms = ~~(duration % 1e3);
        duration = (duration - ms) / 1e3;
        s = ~~(duration % 60);
        duration = ~~((duration - s) / 60);
        m = ~~(duration % 60);
        h = ~~((duration - m) / 60);
        // Create strings
        ms = _leadingZero(ms, 1);
        ms = _leadingZero(ms, 2);
        s = _leadingZero(s, 1);
        m = _leadingZero(m, 1);
        h = _leadingZero(h, 1);
        return h + ":" + m + ":" + s + "." + ms;
    }
    /**
     * Convert a time.time string to milliseconds
     * Todo: handle this a bit better
     *
     * Possible inputs:
     * MM:SS:ms
     * yyyy-mm-dd HH:MM:SS.ms
     *
     * @param {string} time Time string to be converted to milliseconds.
     */
    function timeToMS(time) {
        var ms = new Date(time).getTime();
        if (!ms) {
            var time_split = time.split(":");
            ms = parseInt(time_split[0], 10) * 6e4;
            if (time_split.length > 1) {
                ms += parseInt(time_split[1], 10) * 1e3;
            }
            if (time_split.length > 2) {
                ms += parseInt(time_split[2], 10);
            }
        }
        return ms;
    }
    /**
     * Internal: Countdown starter method, use start() instead
     *
     * @access private
     * @param  {int} duration Duration in milliseconds
     */
    function _startCountdown(duration) {
        _changeStatus("started");
        duration_ms = duration;
        time.start = Date.now();
        end_time.time = time.start + duration_ms;
        time.time = 0;
        elapsed = "0.0";
        running = true;
        _tick();
        this.timeout = window.setTimeout(_tick, interval);
    }
    /**
     * Internal: use start() instead
     *
     * @access private
     * @param {int} offset Time to offset the start time.
     */
    function _startTimer(offset) {
        _changeStatus("started");
        i.time.start = Date.now() - offset;
        i.time.time = 0;
        i.elapsed = "0.0";
        i.running = true;
        _tick();
        i.timeout = window.setTimeout(_tick, i.interval);
    }
    /**
     * Helper function to change the status
     *
     * @todo  Trigger event
     *
     * @access private
     * @param  {string} state New state.
     */
    function _changeStatus(state) {
        i.status = state;
        _callback("onStatusChange");
    }
    /**
     * Initializes object, merging options into defaults
     * to prevent user from influencing other internal properties.
     *
     * @todo  Trigger initialized event
     * 
     * @access private
     * @param  {string} state New state.
     */
    function _init() {
        // extend(i.o, i.defaults, options);
        for (var prop in i.defaults) {
            if (options.hasOwnProperty(prop)) {
                i.o[prop] = options[prop];
            }
        }
        extend(i, i.o);
    }
    _init();
    return {
        // Options
        id: i.id,
        options: i.o,
        laps: i.laps,

        // Methods
        start: start,
        pause: pause,
        stop: stop,
        reset: reset,
        lap: lap,
        msToTime: msToTime,
        timeToMS: timeToMS
    };
};