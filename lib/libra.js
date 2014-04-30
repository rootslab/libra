/*
 * Libra, a module to handle Redis commands/replies queues.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Libra = ( function () {
    var log = console.log
        , Libra = function () {
            var me = this
                ;
            if ( ! ( me instanceof Libra ) ) {
                return new Libra();
            }
        }
        , lproto = null
        ;

    lproto = Libra.prototype;

    lproto.pop = function () {
        var me = this
            ;
    };

    lproto.push = function () {
        var me = this
            ;
    };

    return Libra;
} )();