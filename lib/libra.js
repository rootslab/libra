/*
 * Libra, module to handle bindings between commands and Redis replies.
 * Moreover, it uses an automatic rollback mechanism for subscriptions
 * and transactions.
 *
 * Copyright(c) 2014 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Libra = ( function () {
    var log = console.log
        , util = require( 'util' )
        , Bolgia = require( 'bolgia' )
        , toString = Bolgia.toString
        , ooo = Bolgia.circles
        , Train = require( 'train' )
        , reset = function ( obj ) {
            var me = this
                , h = obj || {}
                , p = null
                ;
            for ( p in h ) {
                if ( toString( h[ p ] ) === ooo.obj ) {
                    reset( h[ p ] );
                }
                h[ p ] = 0;
            };
        }
        // Libra
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
            };
        }
        , lproto = Libra.prototype
        ;

    lproto.flush = function () {
        var me = this
            , cqueue = me.cqueue
            , status = me.status
            ;
        cqueue.flush();
        reset( status );
        cqueue.rollUp( false );
        return me;
    };

    lproto.rollBack = function ( bool ) {
        var me = this
            , cqueue = me.cqueue
            ;
        cqueue.rollBack( bool );
        return me;
    };

    lproto.rollUp = function ( bool ) {
        var me = this
            , cqueue = me.cqueue
            ;
        cqueue.rollUp( bool );
        return me;
    };

    lproto.push = function ( ocmd ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , t = status.transaction
            , cqueue = me.cqueue
            , msg = null
            , cname = ocmd.cmd
            ;

        if ( t.on ) {
            // a MULTI command was previously queued
            if ( ocmd.isSubscription ) {
                // avoid Redis bug, execute callback.
                msg = 'pubsub commands are not allowed inside transactions.';
                ocmd.zn( new Error( msg ), ocmd );
                return;
            }
            t.on = ! ocmd.isExec && ! ocmd.isDiscard;
        } else {
            s.on = ocmd.isSubscription || 0;
            t.on = ocmd.isMulti || 0;
        }
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
            // if no cmd was queued, a message was received
            return;
        }
        if ( curr.isQuit ) {
            /*
             * QUIT command interrupts transaction
             * and pubsub mode, then reset internal
             * status and disable rollUp mechanism.
             */
            reset( status );
            cqueue.rollUp( false );
        } else if ( t.active ) {
            t.active = ! curr.isExec && ! curr.isDiscard;
            cqueue.rollUp( t.active );
        } else if ( curr.isMulti ) {
            t.active = 1;
            cqueue.rollUp( true );
        } else if ( curr.isSubscription ) {
            // enable rollUp only if it is not yet activated
            if ( ! cqueue.roll ) {
                cqueue.rollUp( true );
            }
        } else if ( curr.isMonitor ) {
            m.on = 1;
        }

        return cqueue.shift();
    };

    lproto.update = function ( scmd, channels ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , sub = ( scmd === 'subscribe' ) || ( scmd === 'unsubscribe' )
            , psub = ( scmd === 'psubscribe' ) || ( scmd === 'punsubscribe' )
            , tot = -1
            ;
        if ( sub ) {
            s.channels = channels;
        } else if ( psub ) {
            s.pchannels = channels;
        }
        tot = s.channels + s.pchannels;
        s.on = !! ( tot );
        // disable rollUp if pubsub mode is off
        if ( ! s.on ) me.rollUp( false );
        return tot;
    };

    lproto.iterate = function ( fn, scope, cback, evict ) {
        var me = this
            , cqueue = me.cqueue
            ;
        cqueue.iterate.apply( cqueue, arguments );
        return me;
    };

    return Libra;

} )();