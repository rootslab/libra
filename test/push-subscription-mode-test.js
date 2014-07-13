#!/usr/bin/env node

/* 
 * Libra Libra#push test in subscription mode
 */

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

log( '- check Libra#push(%s) in subscription mode, command should be accepted/marked and moved to status.quit property.', 'QUIT' );
l.push( quit );
assert.equal( l.status.quit[ 0 ].cmd, 'QUIT' );
assert.equal( l.status.quit[ 0 ].isQuit, true );
