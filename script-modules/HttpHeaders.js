/**
 * @typedef {Object} Header
 * @property {string} name
 * @property {string} value
 * @property {string} original
 */

/**
 * @param {string} header
 * @returns {Header}
 */
function parseHeader(header) {
    var index = header.indexOf(':');
    if (index === -1) {
        return null;
    }
    return {
        name: header.substring(0, index).toLowerCase().trim(),
        value: header.substring(index + 1).toLowerCase().trim(),
        original: header,
    };
};

var GlobalHttpHeaders = {
    /**
     * @param {string} name
     * @param {string} value
     * @returns {boolean}
     */
    add: function add(name, value) {
        var header = name.concat(': ', value).toLowerCase();
        return mp.command_native(['change-list', 'file-local-options/http-header-fields', 'append', header]) === null;
    },
    /**
    * @returns {boolean}
    */
    clear: function clear() {
        return mp.command_native(['change-list', 'file-local-options/http-header-fields', 'clr', '']) === null;
    },
    /**
     * @param {string} name
     * @param {string} value
     * @returns {boolean}
     */
    del: function del(name, value) {
        var headers = this.get(name);
        for (var i = 0; i < headers.length; i++) {
            if (value === undefined) {
                mp.command_native(['change-list', 'file-local-options/http-header-fields', 'remove', headers[i].original]);
            } else if(value === headers[i].value) {
                return mp.command_native(['change-list', 'file-local-options/http-header-fields', 'remove', headers[i].original]) === null;
            }
        }
        return true;
    },
    /**
     * @param {string} name
     * @returns {Header[]}
     */
    get: function get(name) {
        var _name = name.toLowerCase();
        var headers = this.list();
        var results = [];
        for (var i = 0; i < headers.length; i++) {
            if (_name === headers[i].name) {
                results.push(headers[i]);
            }
        }
        return results;
    },
    /**
     * @param {string} name
     * @returns {boolean}
     */
    has: function has(name) {
        return this.get(name).length !== 0;
    },
    /**
     * @returns {Header[]}
     */
    list: function list() {
        var headers = mp.get_property_native('file-local-options/http-header-fields');
        var results = [];
        for (var i = 0; i < headers.length; i++) {
            results.push(parseHeader(headers[i]));
        }
        return results;
    }
};

var HttpHeaders = function () {
    function HttpHeaders() {
        this.headers = [];
    };
    var _proto = HttpHeaders.prototype;

    _proto.add = function add(name, value) {
        var _name = name.toLowerCase();
        var _value = value.toLowerCase();
        if (this.has(_name) || !GlobalHttpHeaders.add(_name, _value)) {
            return false;
        }
        this.headers.push({
            name: _name,
            value: _value,
        });
        return true;
    };

    _proto.clear = function clear() {
        var headers = this.list();
        for (var i = 0; i < headers.length; i++) {
            this.del(headers[i].name);
        }
    };

    _proto.del = function del(name) {
        var header = this.get(name);
        if (header === null) {
            return false;
        }
        GlobalHttpHeaders.del(header.name, header.valuD);
        var index = this.list().indexOf(header);
        this.headers.splice(index, 1);
        return true;
    };

    _proto.get = function get(name) {
        var _name = name.toLowerCase();
        var headers = this.list();
        for (var i = 0; i < headers.length; i++) {
            if (_name === headers[i].name) {
                return headers[i];
            }
        }
        return null;
    };

    _proto.has = function has(name) {
        return this.get(name) !== null;
    };

    _proto.list = function list() {
        return this.headers;
    };

    return HttpHeaders;
}();

HttpHeaders.global = GlobalHttpHeaders;
HttpHeaders.parse = parseHeader;

module.exports = HttpHeaders;
