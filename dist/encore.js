/**
 * Copyright (c) 2017-present, Visual Data Systems, Inc. All rights reserved.
 *
 * You are hereby granted a non-exclusive, worldwide, royalty-free license to use,
 * copy, modify, and distribute this software in source code or binary form for use
 * in connection with the web services and APIs provided by Facebook.
 *
 * As with any software that integrates with the Facebook platform, your use of
 * this software is subject to the VDS Platform Policy. This copyright notice shall be
 * included in all copies or substantial portions of the software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
 * FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
 * IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
;(function (window) {
    "use strict";
    /* Wrap code in an IIFE */
    var jQueryNC;
    //revenue
    var revenue = {
        _revenueEndpoint: "http://getencore.com/api/js/revenue/",
        _readyInterval: "",
        _revenueid: "",
        _params: {},
        _debug: false,
        send: function () {
            if (!this._revenueid || Object.keys(this._params).length == 0)return;
            var pdata = jQueryNC.param(this._params);
            if(EncoreCookie.base64Encrypt(pdata) == EncoreCookie.get("encoreRevenue"))return;
            var url = this._revenueEndpoint + this._revenueid;
            var request = EncoreAjax.send({url: url, data: pdata});
            EncoreCookie.set("encoreRevenue",pdata);
            this._params = {};//reset
        },
        set: function (key, value) {
            key = key || "";
            if (!key)return;
            value = value || "";
            this._params[key] = value;
            this._console(key+":"+ value);
        },
        setAll: function (params) {
            params = params || "";
            if (!jQueryNC.isPlainObject(params))return;
            var self = this;
            jQueryNC.each(params, function (key, value) {
                self.set(key,value);
            });
        },
        setRevenueid: function (value) {
            value = value || "";
            this._revenueid = value;
            this._console("Revenueid:"+value);
        },
        debug: function (value) {
            value = value || false;
            this._debug = value;
        },
        _console: function (value) {
            value = value || "";
            if (this._debug === true) {
                console.log(value);
            }
        },
        _urlencode: function (str) {
            str = (str + '');
            return encodeURIComponent(str)
                .replace(/!/g, '%21')
                .replace(/'/g, '%27')
                .replace(/\(/g, '%28')
                .replace(/\)/g, '%29')
                .replace(/\*/g, '%2A')
                .replace(/%20/g, '+');
        },
        _urldecode: function (str) {
            return decodeURIComponent((str + "")
                .replace(/%(?![\da-f]{2})/gi, function () {
                    return '%25';
                })
                .replace(/\+/g, '%20'));
        },
        //ready function and Check for presence of required DOM elements or other JS your widget depends on
        _encoreReady: function () {
            jQueryNC(document).ready(function () {
                window.clearInterval(revenue._readyInterval);
                (function init() {
                    try {
                        var gb = window.EncoreObject || "encore";
                        var encoreOb = window[gb], method, params;
                        encoreOb = encoreOb && encoreOb.q; //reinitial the namespace from queue array
                        if (encoreOb.length > 0) {
                            jQueryNC.each(encoreOb, function (index, arg) {
                                if (arg.length < 2 || arg[1].charAt(0) == "_") return true;
                                method = arg[0];
                                params = Array.prototype.slice.call(arg).slice(2);
                                if (method == "revenue") {
                                    revenue[arg[1]] && revenue[arg[1]].apply(revenue, params);
                                }
                            });
                        }
                    } catch (e) {
                        console.log(e);
                    }
                }());
            });
        },
    };
    var EncoreAjax = {
        send: function (options) {
            options = options || {};
            if (!options.url)return;
            options.data = options.data || {};
            options.dataType = options.dataType || "jsonp";
            options.cache = options.cache || false;
            options.done = options.done || "";
            options.fail = options.fail || "";
            options.always = options.always || "";
            var request = jQueryNC.ajax({
                type: "GET",
                url: options.url,
                data: options.data,
                dataType: options.dataType,
                cache: options.cache,
                jsonp: "",
            }).done(options.done).fail(options.fail).always(options.always);
            return request;
        }
    }

    var EncoreCookie = {
        set: function (name, value, options) {
            options = options || {};
            options.path = options.path || '/';
            options.domain = options.domain || window.location.hostname.split('.').slice(-2).join('.');
            options.expires = options.expires || 1;
            if (value === null) {
                value = '';
                options.expires = -1;
            }
            var expires = '';
            if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
                var date;
                if (typeof options.expires == 'number') {
                    date = new Date();
                    date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
                } else {
                    date = options.expires;
                }
                expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
            }
            var path = '; path=' + (options.path);
            var domain = options.domain ? '; domain=' + (options.domain) : '';
            var secure = options.secure ? '; secure' : '';
            document.cookie = [name, '=', this.base64Encrypt(value), expires, path, domain, secure].join('');
        },
        get: function (name,parsed) {
            parsed = parsed || false;
            var cookieValue = "";
            if (document.cookie && document.cookie != '') {
                var allCookie = '' + document.cookie;
                var index = allCookie.indexOf(name);
                if (name === undefined || name === '' || index === -1) return '';
                var ind1 = allCookie.indexOf(';', index);
                if (ind1 == -1) ind1 = allCookie.length;
                if(parsed) {
                    return this.base64Decrypt(allCookie.substring(index + name.length + 1, ind1));
                }else{
                    return allCookie.substring(index + name.length + 1, ind1);
                }
            }
            return cookieValue;
        },
        remove: function (name) {
            if (this.get(name)) {
                this.set(name, null);
            }
        },
        base64Encrypt: function (str) {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var encoded = [];
            var c = 0;
            while (c < str.length) {
                var b0 = str.charCodeAt(c++);
                var b1 = str.charCodeAt(c++);
                var b2 = str.charCodeAt(c++);
                var buf = (b0 << 16) + ((b1 || 0) << 8) + (b2 || 0);
                var i0 = (buf & (63 << 18)) >> 18;
                var i1 = (buf & (63 << 12)) >> 12;
                var i2 = isNaN(b1) ? 64 : (buf & (63 << 6)) >> 6;
                var i3 = isNaN(b2) ? 64 : (buf & 63);
                encoded[encoded.length] = chars.charAt(i0);
                encoded[encoded.length] = chars.charAt(i1);
                encoded[encoded.length] = chars.charAt(i2);
                encoded[encoded.length] = chars.charAt(i3)
            }
            return encoded.join('');
        },
        base64Decrypt: function (str) {
            var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
            var invalid = {strlen: (str.length % 4 != 0), chars: new RegExp('[^' + chars + ']').test(str), equals: (/=/.test(str) && (/=[^=]/.test(str) || /={3}/.test(str)))};
            if (invalid.strlen || invalid.chars || invalid.equals)throw new Error('Invalid base64 data');
            var decoded = [];
            var c = 0;
            while (c < str.length) {
                var i0 = chars.indexOf(str.charAt(c++));
                var i1 = chars.indexOf(str.charAt(c++));
                var i2 = chars.indexOf(str.charAt(c++));
                var i3 = chars.indexOf(str.charAt(c++));
                var buf = (i0 << 18) + (i1 << 12) + ((i2 & 63) << 6) + (i3 & 63);
                var b0 = (buf & (255 << 16)) >> 16;
                var b1 = (i2 == 64) ? -1 : (buf & (255 << 8)) >> 8;
                var b2 = (i3 == 64) ? -1 : (buf & 255);
                decoded[decoded.length] = String.fromCharCode(b0);
                if (b1 >= 0)decoded[decoded.length] = String.fromCharCode(b1);
                if (b2 >= 0)decoded[decoded.length] = String.fromCharCode(b2)
            }
            return decoded.join('');
        }
    };
    var _encoreLoadScript = function (url, callback) {
        callback = callback || "";
        var script = document.createElement('script');
        script.type = "text/javascript";
        script.async = true;
        script.src = url;
        var entry = document.getElementsByTagName('script')[0];
        entry.parentNode.insertBefore(script, entry);
        script.onload = script.onreadystatechange = function () {
            var rdyState = script.readyState;
            if (!rdyState || /complete|loaded/.test(script.readyState)) {
                if (callback) {
                    callback();
                }
                // detach the event handler to avoid memory leaks in IE (http://mng.bz/W8fx)
                script.onload = null;
                script.onreadystatechange = null;
            }
        };
    }
    var _initEncore = function () {
        revenue._readyInterval = window.setInterval(revenue._encoreReady, 500);
    }
    /******** Load jQuery if not present *********/
    if (window.jQuery === undefined || parseInt(window.jQuery.fn.jquery.split('.').join('')) < 180) {
        _encoreLoadScript("https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js", function () {
            jQueryNC = window.jQuery.noConflict(true);
            _initEncore();
        });
    } else {
        jQueryNC = window.jQuery;
        _initEncore();
    }
})(window, undefined);