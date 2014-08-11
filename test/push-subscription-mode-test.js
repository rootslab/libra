#!/usr/bin/env node

/* 
 * Libra Libra#push test in subscription mode
 */
exports.test = function ( done ) {

    var log = console.log
        , assert = require( 'assert' )
        , util = require( 'util' )
        , Libra = require( '../' )
        , l = Libra()
        , Syllabus = require( 'syllabus' )
        , syl = Syllabus()
        , commands = syl.commands
        // un/subscription commands
        , sub = commands.subscribe( 'channel' )
        , unsub = commands.unsubscribe( 'channel' )
        , psub = commands.psubscribe( '*' )
        , punsub = commands.punsubscribe( '*' )
        , ping = commands.ping()
        , time = commands.time()
        // callback that receives an Error
        , cback = function ( err, data ) {
            assert.ifError( ! err );
        }
        // no un/subscriptions
        , publish = commands.publish( 'channel', 'message', cback )
        , pubsubch = commands.pubsub.channels( '*', cback )
        , pubsubns = commands.pubsub.numsub( 'channel', cback )
        , pubsubnp = commands.pubsub.numpat( cback )
        , quit = commands.quit()
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- test Libra#push in subscription mode.' );

    log( '- check Libra#push(%s), command should be accepted/marked.', 'SUBSCRIBE' );
    l.push( sub );
    assert.equal( l.cqueue.get( 0 ).isSubscription, true );

    log( '- check Libra.status.subscription mode, should be on.' );
    assert.equal( l.status.subscription.on, true );

    log( '- check Libra#push(%s) in subscription mode, command should be accepted/marked.', 'UNSUBSCRIBE' );
    l.push( unsub );
    assert.equal( l.cqueue.get( 1 ).isSubscription, true );

    log( '- check Libra#push(%s) in subscription mode, command should be accepted/marked.', 'PSUBSCRIBE' );
    l.push( psub );
    assert.equal( l.cqueue.get( 2 ).isSubscription, true );

    log( '- check Libra#push(%s) in subscription mode, command should be accepted/marked.', 'PUNSUBSCRIBE' );
    l.push( punsub );
    assert.equal( l.cqueue.get( 3 ).isSubscription, true );

    log( '- check Libra#push a non QUIT command, in subscription mode, should return an error.' );
    assert.ok( l.push( quit ) );
    assert.ok( ! ~ l.push( time ) );
    assert.ok( time.err instanceof Error );

    exit();
};