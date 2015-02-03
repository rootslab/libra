/*
 * ♎ Libra, module to handle bindings between commands and Redis replies.
 * Moreover, it implements an automatic rollback mechanism for subscriptions when the
 * connection goes down.
 *
 * Copyright(c) 2015 Guglielmo Ferri <44gatti@gmail.com>
 * MIT Licensed
 */

exports.version = require( '../package' ).version;
exports.Libra = ( function () {
    var Bolgia = require( 'bolgia' )
        , doString = Bolgia.doString
        , clone = Bolgia.clone
        , improve = Bolgia.improve
        , ooo = Bolgia.circles
        , oobj = ooo.obj
        , oarr = ooo.arr
        , Train = require( 'train' )
        , reset = function ( obj ) {
            var h = obj || {}
                , p = null
                , type = null
                ;
            for ( p in h ) {
                type = doString( h[ p ] );
                if ( type === oobj ) {
                    reset( h[ p ] );
                    continue;
                }
                if ( type === oarr ) {
                    h[ p ] = [];
                    continue;
                }
                h[ p ] = 0;
            }
        }
        , sendError = function ( ocmd, emsg ) {
            var err = new Error( emsg )
                ;
            ocmd.err = err;
            ocmd.data = '♎ Libra error occurs pushing command: ' + ocmd.cmd + '.';
            // execute callback
            ocmd.zn( true, err.message, ocmd.fn );
            return -1;
        }
        , sendSpecialCommand = function ( cmd ) {
            var me = this
                , status = me.status
                , ocmd = doString( cmd ) === oobj ? cmd : null
                ;
            if ( ocmd.isAuth && status.auth.push( ocmd ) ) return ocmd;
            if ( ocmd.isSelect && status.select.push( ocmd ) ) return ocmd;
        }
        , libra_opt = {
            timestamps : false
            , rollback : 64 * 1024
        }
        // Libra
        , Libra = function ( opt ) {
            var me = this
                , is = me instanceof Libra
                ;
            if ( ! is ) return new Libra( opt );
            // set options
            me.options = improve( clone( opt ), libra_opt );
            // set internal queue with limits
            me.cqueue = Train( {
                rlim : me.options.rollback
                , xlim : Infinity
            } );
            // set internal status
            me.status = {
                subscription : {
                    on : 0
                    , active : 0
                    , channels : 0
                    , patterns : 0
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
                , last_access : 0
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

    lproto.auth = sendSpecialCommand;

    lproto.select = sendSpecialCommand;

    lproto.push = function ( ocmd ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , t = status.transaction
            , m = status.monitoring
            , cqueue = me.cqueue
            , cname = ocmd.cmd
            ;
        /*
         * a MONITOR command was previously queued, only QUIT is allowed,
         * then don't write other commands to socket.
         */
        if ( m.on ) return ocmd.isQuit ?
                    cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos :
                    sendError( ocmd, 'only the QUIT command is allowed in monitor mode.' )
                    ;
        // check if a MULTI command was previously queued
        if ( t.on ) {
            // avoid Redis bug, execute callback.
            if ( ocmd.isSubscription ) return sendError( ocmd, 'PubSub commands are not allowed inside transactions.' );
            t.on = ! ocmd.isExec && ! ocmd.isDiscard;
            return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
        }
        if ( s.on ) {
            /*
             * a SUBSCRIPTION command was previously queued, from now only
             * subscriptions commands are allowed, PING and QUIT.
             */
            if ( ocmd.isPing || ocmd.isQuit ) return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
            if ( ! ocmd.isSubscription ) return sendError( ocmd, cname + ' command is not allowed in PubSub mode.' );
        }
        if ( ocmd.isMonitor ) m.on = 1;
        else if ( ocmd.isMulti ) t.on = 1;
        else if ( ocmd.isSubscription ) s.on = 1;
        /*
         * There is only a single argument to push, use the faster way to do it,
         * instead of using cqueue.push( ocmd ). See Train#fpush.
         */
        return cqueue.qtail.push( ocmd ) + cqueue.qhead.length - cqueue.hpos;
    };

    lproto.head = function ( pos ) {
        var me = this
            , status = me.status
            , tstamp = me.options.timestamps
            , auth = status.auth[ 0 ]
            , select = status.select[ 0 ]
            ;
        // update last access_time
        if ( tstamp ) status.last_access = Date.now();
        // get auth or select command if exist or current command enqueued
        return auth ? auth : ( select ? select : me.cqueue.get( + pos || 0 ) );
    };

    lproto.pop = function () {
        var me = this
            , status = me.status
            , tstamp = me.options.timestamps
            , m = status.monitoring
            , s = status.subscription
            , t = status.transaction
            , auth = status.auth[ 0 ]
            , select = status.select[ 0 ]
            , cqueue = me.cqueue
            // get auth command if exists or current command enqueued
            , curr = cqueue.get( 0 )
            ;
        // update last access_time
        if ( tstamp ) status.last_access = Date.now();
        // check auth
        if ( auth ) {
            // return stored command AUTH and reset status property
            status.auth = [];
            return auth;
        }
        // check select
        if ( select ) {
            // return stored command SELECT and reset status property
            status.select = [];
            return select;
        }
        // if no cmd was queued, a message was received
        if ( ! curr ) return;
        // check quit
        if ( curr.isQuit ) {
            /*
             * QUIT command, reset internal status
             * and disable the rollUp mechanism.
             */
            reset( status );
            cqueue.rollUp( false );
            return cqueue.shift();
        }
        if ( m.active || curr.isMonitor ) {
            m.active = 1;
            // return the current command or undefined
            return cqueue.shift();
        }
        if ( t.active ) {
            t.active = ! curr.isExec && ! curr.isDiscard;
            return cqueue.shift();
        }
        if ( curr.isMulti ) {
            t.active = 1;
            return cqueue.shift();
        }
        if ( curr.isSubscription ) {
            s.active = 1;
            // enable rollUp only if it is not yet activated
            if ( ! cqueue.roll ) cqueue.rollUp( true );
            /*
             * check if (P)UNSUBSCRIBE without arguments, set the
             * expectedMessages property to active channels or patterns.
             */
            if ( curr.bulks === 1 ) curr.expectedMessages = curr.isUnsubscribe ? 
               ( s.channels ? s.channels : 0 ) :
               ( curr.isPunsubscribe ? ( s.patterns ? s.patterns : 0 ) : 0 )
               ;
            // check for expected messages, don't pop command if !== 0
            if ( curr.expectedMessages ) return --curr.expectedMessages ? curr : cqueue.shift();
        }
        return cqueue.shift();
    };

    lproto.subs = function () {
        var me = this
            , s = me.status.subscription
            ;
        return s.on ? s.channels + s.patterns : 0;
    };

    lproto.update = function ( scmd, total_curr_subs ) {
        var me = this
            , status = me.status
            , s = status.subscription
            , tot = s.channels + s.patterns
            ;
        switch ( scmd ) {  
            case 'subscribe':
                if ( tot < total_curr_subs ) ++s.channels;
            break;
            case 'unsubscribe':
                if ( tot > total_curr_subs ) --s.channels;
            break;
            case 'psubscribe':
                if ( tot < total_curr_subs ) ++s.patterns;
            break;
            case 'punsubscribe':
                if ( tot > total_curr_subs ) --s.patterns;
            break;
            default:
            break;
        }
        tot = s.channels + s.patterns;
        s.active = s.on = + !! tot;
        // disable rollUp if pubsub mode is off
        if ( ! s.active ) me.rollUp( false );
        return tot;
    };

    // fn, scope, cback, evict
    lproto.iterate = function () {
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
        return me;
    };

    return Libra;

} )();