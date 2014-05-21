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
        , Bolgia = require( 'bolgia' )
        , toString = Bolgia.toString
        , ooo = Bolgia.circles
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
                    on : 0
                    , channels : 0
                    , pchannels : 0
                }
                , transaction : {
                    on : 0
                    , active : 0
                }
                , monitoring : {
                    on : 0
                }
            }
        }
        , lproto = null
        ;

    util.inherits( Libra, emitter );

    lproto = Libra.prototype;

    lproto.reset = function ( obj ) {
        var me = this
            , h = obj || me.status
            , p = null
            ;
        for ( p in h ) {
            if ( toString( h[ p ] ) === ooo.obj ) {
                me.reset( h[ p ] );
            }
            h[ p ] = 0;
        };
    };

    lproto.flush = function () {
        var me = this
            ;
        me.cqueue.flush();
        me.reset();
    };

    lproto.push = function ( ocmd ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , t = status.transaction
            , cqueue = me.cqueue
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
                    return;
                break;
                case 'QUIT':
                     ocmd.isQuit = true;
                break;
                default:
                    msg = 'only pubsub commands are allowed.';
                    ocmd.zn( new Error( msg ), ocmd );
                    return;
                break;
            };
            return cqueue.push( ocmd );
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
                case 'QUIT':
                     ocmd.isQuit = true;
                break;
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
            return cqueue.push( ocmd );
        }
        switch ( ocmd.cmd ) {
            case 'SUBSCRIBE':
            case 'UNSUBSCRIBE':
            case 'PSUBSCRIBE':
            case 'PUNSUBSCRIBE':
                s.on = true;
                return;
            break;
            case 'MULTI':
                t.on = true;
                ocmd.isMulti = true;
            break;
            case 'MONITOR':
                ocmd.isMonitor = true;
            break;
            case 'EXEC':
                ocmd.isExec = true;
            break;
            case 'DISCARD':
                ocmd.isDiscard = true;
            break;
            case 'QUIT':
                 ocmd.isQuit = true;
            break;
        };
        return cqueue.push( ocmd );
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

        if ( ! curr ) {
            // no cmd queued, a message was received
            return;
        }

        if ( t.active ) {
            if ( curr.isExec || curr.isDiscard ) {
                t.active = false;
                cqueue.rollUp( false );
            }
            return cqueue.shift();
        }
        if ( curr.isMulti ) {
            t.active = true;
            cqueue.rollUp();
            return cqueue.shift();
        }
        if ( curr.isMonitor ) {
            m.on = true;
            return cqueue.shift();
        }
        return cqueue.shift();
    };

    return Libra;

} )();