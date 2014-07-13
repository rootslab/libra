/*
 * ♎ Libra, module to handle bindings between commands and Redis replies.
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
        , oobj = ooo.obj
        , oarr = ooo.arr
        , Train = require( 'train' )
        , reset = function ( obj ) {
            var me = this
                , h = obj || {}
                , p = null
                , type = null
                ;
            for ( p in h ) {
                type = toString( h[ p ] );
                if ( type === oobj ) {
                    reset( h[ p ] );
                    continue;
                }
                if ( type === oarr ) {
                    h[ p ] = [];
                    continue;
                }
                h[ p ] = 0;
            };
        }
        , sendError = function ( ocmd, emsg ) {
            var err = new Error( emsg )
                ;
            ocmd.err = err;
            // execute callback
            ocmd.zn( true, err.message, ocmd.fn );
            return -1;
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
                    , active : 0
                }
                , auth : []
                , select : []
                , quit : []
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

    lproto.auth = function ( cmd ) {
        var me = this
            , ocmd = toString( cmd ) === oobj ? cmd : null
            ;
        return ( ( me.status.auth.push( ocmd ) ) && ocmd.isAuth ) ? ocmd : null;
    };

    lproto.select = function ( cmd ) {
        var me = this
            , ocmd = toString( cmd ) === oobj ? cmd : null
            ;
        return ( ( me.status.select.push( ocmd ) ) && ocmd.isSelect ) ? ocmd : null;
    };

    lproto.push = function ( ocmd ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , t = status.transaction
            , m = status.monitoring
            , cqueue = me.cqueue
            , cname = ocmd.cmd
            , msg = null
            , err = null
            ;

        if ( m.on ) {
            // a MONITOR command was previously queued
            msg = 'a MONITOR command was previously queued, only the QUIT command is allowed.';
            // don't write other commands to socket.
            return ocmd.isQuit ?
                   cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos :
                   sendError( ocmd, msg );
        }
        if ( t.on ) {
            // a MULTI command was previously queued
            if ( ocmd.isSubscription ) {
                // avoid Redis bug, execute callback.
                msg = 'PubSub commands are not allowed inside transactions.';
                return sendError( ocmd, msg );
            }
            t.on = ! ocmd.isExec && ! ocmd.isDiscard;
            return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
        }
        if ( s.on ) {
            // a SUBSCRIPTION command was previously queued
            if ( ocmd.isQuit ) {
                // set quitting status, don't push to queue
                status.quit.push( ocmd );
                return cqueue.size();
            }
            if ( ! ocmd.isSubscription ) {
                msg = ocmd.cmd + ' command is not allowed in PubSub mode.';
                return sendError( ocmd, msg );
            }
            return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
        }
        if ( ocmd.isMonitor ) m.on = 1;
        else if ( ocmd.isMulti ) t.on = 1;
        else if ( ocmd.isSubscription ) s.on = 1;
        /*
         * There is only a single argument to push, use
         * the faster way to do it, instead of using
         * cqueue.push( ocmd ). See Train#fpush.
         */
        return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
    };

    lproto.pop = function () {
        var me = this
            , status = me.status
            , m = status.monitoring
            , s = status.subscription
            , t = status.transaction
            , auth = status.auth[ 0 ]
            , select = status.select[ 0 ]
            , cqueue = me.cqueue
            // get auth command if exists or current command enqueued
            , curr = cqueue.get( 0 )
            ;
        if ( auth ) {
            // return stored command AUTH and reset status property
            status.auth = [];
            return auth;
        }
        if ( select ) {
            // return stored command SELECT and reset status property
            status.select = [];
            return select;
        }
        if ( ! curr ) {
            // if no cmd was queued, a message was received
            return;
        }
        if ( curr.isQuit ) {
            /*
             * QUIT command, reset internal status
             * and disable the rollUp mechanism.
             */
            reset( status );
            cqueue.rollUp( false );
        } else if ( m.active ) {
            // return the current command or undefined
            return cqueue.shift();
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
            // monitoring is on
            m.active = 1;
        }

        return cqueue.shift();
    };

    lproto.update = function ( scmd, channels ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , isOK = scmd === 'OK'
            , quit = status.quit[ 0 ]
            , sub = ! isOK && ( scmd === 'subscribe' ) || ( scmd === 'unsubscribe' )
            , psub = ! isOK && ! sub && ( scmd === 'psubscribe' ) || ( scmd === 'punsubscribe' )
            , tot = -1
            ;
        if ( isOK ) {
            /*
             * When in pubsub mode, 'OK' should be a reply to QUIT command,
             * then execute callback in libra.status.quit and return -1 for
             * signaling to close connection.
             */
            me.flush();
            // execute quit callback with OK
            quit.zn( false, 'OK', quit.fn );
            return -1;
        }
        if ( sub ) {
            s.channels = channels;
        } else if ( psub ) {
            s.pchannels = channels;
        }
        tot = s.channels + s.pchannels;
        s.on = + !! tot;
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

    lproto.reset = function () {
        var me = this
            ;
        reset( me.status );
        me.rollUp( false );
        return me;
    };

    return Libra;

} )();