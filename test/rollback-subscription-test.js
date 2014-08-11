#!/usr/bin/env node

/* 
 * Libra rollback test in subscription mode
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
        , channels = [ 'channel-a', 'channel-b', 'channel-c' ]
        // un/subscription commands
        , sub1 = commands.subscribe( channels.slice( 0, 1 ) )
        , sub2 = commands.subscribe( channels.slice( 0, 1 ) )
        , unsub = commands.unsubscribe()
        , quit = commands.quit()
        // expected result
        , result = []
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- test Libra rollback mechanism in subscription mode.' );

    log( '- Libra#push( SUBSCRIBE ' + channels.slice( 0, 1 ) + ' ).' );
    l.push( sub1 );
    result.push( sub1 );
    assert.equal( l.cqueue.get( 0 ).isSubscription, true );

    log( '- Libra#push( SUBSCRIBE ' + channels.slice( 1 ) + ' ).' );
    l.push( sub2 );
    result.push( sub2 );
    assert.equal( l.cqueue.get( 0 ).isSubscription, true );

    log( '- mix Libra#pop and #push calls.' );
    l.pop();
    l.push( sub1 );
    result.push( sub1 );
    l.pop();
    l.push( sub2 );
    result.push( sub2 );
    l.pop();
    l.pop();

    log( '- now #rollBack(true) commands ( re-enable rollUp after operation).' );
    l.rollBack( true );
    assert.equal( l.cqueue.roll, true );

    log( '- now deep check queue, if rollback was successful.' );
    assert.deepEqual( l.cqueue.qhead, result );

    exit();
};