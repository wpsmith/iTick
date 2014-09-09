/*jslint browser: true, white: true */
/**!
 * ITick by WP Smith - https://github.com/wpsmith/this
 * Based on code by James Edwards:
 *    http://sitepoint.com/creating-accurate-time.timers-in-javascript/
 *    ITick by Mr Chimp - https://github.com/mrchimp/tock
 */

// Implements Date.now() for ie lt 9
Date.now = Date.now || function() {
    return +new Date();
};

var ITick = (function(options) {

    ITick.instances = (ITick.instances || 0) + 1;

    var i = {
        o: {},
        go: false,
        defaults: {
            interval: 10,
            countdown: false,
            onTick: null,
            onStatusChange: null,
            onStart: null,
            onEnd: null,
            onPause: null
        },
        id: 'iTick_' + +new Date(),
        timeout: null,
        missed_ticks: null,
        time: {
            start: 0,
            pause: 0,
            end:   0,
            time:  0
        },
        laps: [],
        duration_ms: 0,
        elapsed: 0,
        status: 'initialized'
    };

    /**
     * Extend this.borrowed = function from underscoreJS
     * @link https://github.com/jashkenas/underscore
     */
    function extend(obj) {
        'use strict';

        var type = typeof obj,
            source, sourceType, prop, i, length;

        if (!(type === 'function' || type === 'object' && !!obj)) {
            return obj;
        }

        for (i = 1, length = arguments.length; i < length; i++) {
            source = arguments[i];
            sourceType = typeof source;
            if (!(sourceType === 'function' || sourceType === 'object' && !!obj)) {
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
        var go = false;
        if ( i.go ) {
            go = true;
        }
        stop();
        i.time.start = 0;
        i.time.time = 0;
        i.elapsed = '0.0';
        if ( go ) {
            start();
        }
        _changeStatus('reset');
    }

    function _callback(cb) {
        
        if ( 'function' === typeof i[cb]) {
            i[cb](this);
        }
    }

    /**
     * Start the clock.
     */
    function start(duration) {
        
        if (i.go && !duration) {
            stop();
            reset();
        } else if (i.go) {
            return;
        }

        if ( 'undefined' === typeof duration ) {
            duration = 0;
        }

        i.time.start = duration;
        _callback('onStart');

        if (i.countdown) {
            _startCountdown(i.time.start);
        } else {
            _startTimer(i.time.start);
        }
    }

    /**
     * Called every tick for countdown clocks.
     * i.e. once every this.interval ms
     */
    function _tick() {
        i.time.time += i.interval;
        i.elapsed = ~~(i.time.time / i.interval) / 10;

        if (Math.round(i.elapsed) === i.elapsed) {
            i.elapsed += '.0';
        }

        var diff = (Date.now() - i.time.start) - i.time.time,
            next_interval_in = i.interval - diff;

        _callback('onTick');

        if (i.countdown && (i.duration_ms - i.time.time < 0)) {
            i.time.end = 0;
            i.go = false;
            _callback('onEnd');
        }

        if (next_interval_in <= 0) {
            i.missed_ticks = ~~(Math.abs(next_interval_in) / i.interval);
            i.time.time += i.missed_ticks * i.interval;

            if (i.go) {
                _tick();
            }
        } else {
            if (i.go) {
                i.timeout = window.setTimeout(_tick, next_interval_in);
            }
        }
    }

    /**
     * Stop the clock.
     */
    function stop() {
        i.go = false;
        _changeStatus('stopped');

        window.clearTimeout(this.timeout);

        if (i.countdown) {
            i.time.end = duration_ms - i.time.time;
        } else {
            i.time.end = (Date.now() - i.time.start);
            _callback('onEnd');
        }
    }

    /**
     * Stop/start the clock.
     */
    function pause() {
        _changeStatus('paused');
        _callback('onPause');

        if (i.go) {
            i.time.pause = lap();
            stop();
        } else {
            start(i.time.pause);
            // if (i.time.pause) {
            //     if (i.countdown) {
            //         _startCountdown(i.time.pause);
            //     } else {
            //         _startTimer(i.time.pause);
            //     }
            // }
        }
    }

    /**
     * Get the current clock time.time in ms.
     * Use with ITick.msToTime() to make it look nice.
     */
    function lap(formatted) {
        var t;
        if (i.go) {
            var now;

            if (i.countdown) {
                now = i.duration_ms - (Date.now() - i.time.start);
            } else {
                now = (Date.now() - i.time.start);
            }

            i.laps.push(now);
            t = now;
        } else {
            t = (i.time.pause || i.time.end);
            i.laps.push(t);
        }

        if ( formatted ) {
            return msToTime(t);
        }
        return t;
    }

    /**
     * Formats integer with leading zeros to match length. 
     * @param  {int} int    Integer needing leading zeroes.
     * @param  {int} length Desired length/places of number.
     * @return {str}        Formatted number as a string.
     */
    function _leadingZero(t, length) {
        var str = t.toString();
        if (str.length < length) {
            for (var i = str.length; i < length; i++) {
                str = '0' + str;
            }
        }
        return str;
    };

    /**
     * Format milliseconds as a string.
     */
    function msToTime(duration) {
        if (duration <= 0) {
            return "00:00:00.000";
        }

        var ms, s, m, h;

        // Do the math
        ms = ~~ (duration % 1000);
        duration = (duration - ms) / 1000;
        s = ~~ (duration % 60);
        duration = ~~ ((duration - s) / 60);
        m = ~~ (duration % 60);
        h = ~~ ((duration - m) / 60);

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
     * MM:SS
     * MM:SS:ms
     * yyyy-mm-dd HH:MM:SS.ms
     */
    function timeToMS(time) {
        var ms = new Date(time).getTime();

        if (!ms) {
            var time_split = time.split(':');

            ms = parseInt(time_split[0], 10) * 60000;

            if (time_split.length > 1) {
                ms += parseInt(time_split[1], 10) * 1000;
            }

            if (time_split.length > 2) {
                ms += parseInt(time_split[2], 10);
            }
        }

        return ms;
    }

    /**
     * Called by ITick internally - use start() instead
     */
    function _startCountdown(duration) {
        _changeStatus('started');
        duration_ms = duration;
        time.start = Date.now();
        end_time.time = time.start + duration_ms;
        time.time = 0;
        elapsed = '0.0';
        go = true;
        _tick();
        this.timeout = window.setTimeout(_tick, interval);
    }

    /**
     * Called by ITick internally - use start() instead
     */
    function _startTimer(offset) {
        _changeStatus('started');
        i.time.start = Date.now() - offset;
        i.time.time = 0;
        i.elapsed = '0.0';
        i.go = true;
        _tick();
        i.timeout = window.setTimeout(_tick, i.interval);
    }

    function _changeStatus(state) {
        i.status = state;
        _callback('onStatusChange');
    }

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
        id: i.id,
        options: i.o,
        start: start,
        pause: pause,
        stop: stop,
        reset: reset,
        lap: lap,
        msToTime: msToTime,
        timeToMS: timeToMS
    };
});