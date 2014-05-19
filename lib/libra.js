/*
 * Libra, a module to handle Redis commands/replies queues.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Libra = ( function () {
    var log = console.log
        , emitter = require( 'events' ).EventEmitter
        , util = require( 'util' )
        , Train = require( 'train' )
        , Libra = function () {
            var me = this
                ;
            if ( ! ( me instanceof Libra ) ) {
                return new Libra();
            }
            me.cqueue = Train();
            me.status = {
                subscription : {
                    on : false
                }
                , transaction : {
                    on : false
                    , active : false
                }
                , monitoring : {
                    on : false
                }
            }
        }
        , lproto = null
        ;

    util.inherits( Libra, emitter );

    lproto = Libra.prototype;

    lproto.flush = function () {
        var me = this
            ;
        me.cqueue.flush();
    };

    lproto.pop = function () {
        var me = this
            , status = me.status
            , m = status.monitoring
            , s = status.subscription
            , t = status.transaction
            , cqueue = me.cqueue
            , curr = cqueue.get( 0 )
            ;

        log( 'LIBRA POP - TODO -', curr );

        if ( ! curr ) {
            // no cmd queued, a message was received
            return;
        }
        if ( t.active ) {
            log( ' POP TRANSACTION - TODO' );
            return me.cqueue.shift();
        }
        if ( curr.isMulti ) {
            log( ' POP MULTI - TODO' );
            t.active = true;
            cqueue.rollUp();
            return me.cqueue.shift();
        }
        if ( curr.isMonitor ) {
            log( ' POP MONITOR - TODO' );
            return me.cqueue.shift();
        }
        return me.cqueue.shift();
    };

    lproto.push = function ( ocmd ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , t = status.transaction
            , msg = null
            ;

        if ( s.on ) {
            /*
             * When in pubsub mode, except for the QUIT
             * command, all other commands will be discarded.
             */
            switch ( ocmd.cmd ) {
                case 'SUBSCRIBE':
                case 'UNSUBSCRIBE':
                case 'PSUBSCRIBE':
                case 'PUNSUBSCRIBE':
                     ocmd.isSubscription = true;
                case 'QUIT':
                break;
                default:
                    msg = 'only pubsub commands are allowed.';
                    ocmd.zn( new Error( msg ), ocmd );
                    return;
                break;
            };
            return me.cqueue.push( ocmd );
        }
        if ( t.on ) {
            // a MULTI command was previously queued
            switch ( ocmd.cmd ) {
                case 'EXEC':
                    // transaction will be completed or aborted
                    t.on = false;
                    ocmd.isExec = true;
                break;
                case 'DISCARD':
                    t.on = false;
                    ocmd.isDiscard = true;
                break;
                case 'MONITOR':
                    ocmd.isMonitor = true;
                break;
                // case 'QUIT':
                // break;
                case 'SUBSCRIBE':
                case 'UNSUBSCRIBE':
                case 'PSUBSCRIBE':
                case 'PUNSUBSCRIBE':
                    ocmd.isSubscription = true;
                    msg = 'pubsub commands are not allowed inside transactions.';
                    // avoid Redis bug, execute callback.
                    ocmd.zn( new Error( msg ), ocmd );
                    return;
                break;
            };
            return me.cqueue.push( ocmd );
        }
        switch ( ocmd.cmd ) {
            case 'SUBSCRIBE':
            case 'UNSUBSCRIBE':
            case 'PSUBSCRIBE':
            case 'PUNSUBSCRIBE':
                s.on = true;
                ocmd.isSubscription = true;
            break;
            case 'MULTI':
                t.on = true;
                ocmd.isMulti = true;
            break;
            case 'MONITOR':
                ocmd.isMonitor = true;
            break;
            case 'EXEC':
                //ocmd.isExec = true;
            break;
            case 'DISCARD':
                //ocmd.isDiscard = true;
            break;
        };
        return me.cqueue.push( ocmd );
    };

    return Libra;
} )();