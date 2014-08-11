#!/usr/bin/env node

/* 
 * Libra MONITOR mode
 */
exports.test = function ( done ) {

    var log = console.log
        , emptyFn = function () {}
        , assert = require( 'assert' )
        , util = require( 'util' )
        , Libra = require( '../' )
        , Syllabus = require( 'syllabus' )
        , l = Libra()
        , syl = Syllabus()
        , monitor = syl.commands.monitor()
        , ping = syl.commands.ping()
        , quit = syl.commands.quit()
        , status = l.status
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- #push MONITOR command to the queue.' );
    l.push( monitor );

    log( '- #push PING command to the queue' );
    l.push( ping );

    log( '- monitoring status mode should be on, not active.' );
    assert.equal( status.monitoring.on, 1 );
    assert.equal( status.monitoring.active, 0 );

    log( '- try to #push PING command to the queue.' );
    l.push( ping );

    log( '- #push PING command to the queue, it should not be allowed.' );
    log( '- now queue size should be 1.' );
    assert.equal( l.cqueue.size(), 1 );

    log( '- now #pop MONITOR command.' );
    l.pop();

    log( '- now queue size should be 0.' );
    assert.equal( l.cqueue.size(), 0 );

    log( '- now monitoring status mode should be on and active.' );
    assert.equal( status.monitoring.on, 1 );
    assert.equal( status.monitoring.active, 1 );

    log( '- try to #push PING command to the queue.' );
    l.push( ping );

    log( '- #push PING command to the queue, it should not be allowed.' );
    log( '- now queue size should be 0.' );
    assert.equal( l.cqueue.size(), 0 );
    assert.equal( l.cqueue.get( 0 ), undefined );

    log( '- PING command should contain an error property.' );
    assert.equal( ping.err.constructor, Error );

    log( '- #push QUIT command to the queue, it should be allowed.' );
    l.push( quit )
    log( '- now queue size should be 1.' );
    assert.equal( l.cqueue.size(), 1 );

    log( '- #pop the command from the queue, should be QUIT.' );
    assert.deepEqual( l.pop(), quit );

    exit();
};