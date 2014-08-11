#!/usr/bin/env node

/* 
 * Libra Libra#push test in transaction mode
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
        // transaction commands
        , discard = commands.discard()
        , exec = commands.exec()
        , multi = commands.multi( 'channel' )
        // conditional commands, no transaction mode
        , watch = commands.watch( '*' )
        , unwatch = commands.unwatch( '*' )
        // callback that receives an Error
        , cback = function ( err, data ) {
            assert.ifError( ! err );
        }
        // un/subscription commands
        , sub = commands.subscribe( 'channel', cback )
        , unsub = commands.unsubscribe( 'channel', cback )
        , psub = commands.psubscribe( '*', cback )
        , punsub = commands.punsubscribe( '*', cback )
        , quit = commands.quit()
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- test Libra#push in transaction mode.' );

    log( '- check Libra#push(%s), command should be accepted/marked.', 'MULTI' );
    l.push( multi );
    assert.equal( l.cqueue.get( 0 ).isMulti, true );

    log( '- check Libra.status.transaction mode, should be on.' );
    assert.equal( l.status.transaction.on, true );

    log( '- check Libra#push(%s), command should be accepted/marked.', 'EXEC' );
    l.push( exec );
    assert.equal( l.cqueue.get( 1 ).isExec, true );

    log( '- check Libra.status.transaction mode, should be off.' );
    assert.equal( l.status.transaction.on, false );

    log( '- check Libra#push(%s), command should be accepted/marked.', 'MULTI' );
    l.push( multi );
    assert.equal( l.cqueue.get( 2 ).isMulti, true );

    log( '- check Libra.status.transaction mode, should be on.' );
    assert.equal( l.status.transaction.on, true );

    log( '- check Libra#push(%s), command should be accepted/marked.', 'DISCARD' );
    l.push( discard );
    assert.equal( l.cqueue.get( 3 ).isDiscard, true );

    log( '- check Libra.status.transaction mode, should be off.' );
    assert.equal( l.status.transaction.on, false );

    log( '- check Libra#push(%s), command should be accepted/marked.', 'MULTI' );
    l.push( multi );
    assert.equal( l.cqueue.get( 4 ).isMulti, true );

    // other commands should be discarded

    log( '- check Libra#push(%s) in transaction mode, command should be discarded.', 'PUBSUB CHANNELS' );
    l.push( sub );
    assert.equal( l.cqueue.get( 5 ), undefined );

    log( '- check Libra#push(%s) in transaction mode, command should be discarded.', 'PUBSUB NUMSUB' );
    l.push( unsub );
    assert.equal( l.cqueue.get( 5 ), undefined );

    log( '- check Libra#push(%s) in transaction mode, command should be discarded.', 'PUBSUB NUMPAT' );
    l.push( psub );
    assert.equal( l.cqueue.get( 5 ), undefined );

    log( '- check Libra#push(%s) in transaction mode, command should be discarded.', 'PUBSUB NUMPAT' );
    l.push( punsub );
    assert.equal( l.cqueue.get( 5 ), undefined );

    // quit should be accepted

    log( '- check Libra#push(%s) in transaction mode, command should be accepted.', 'QUIT' );
    l.push( quit );
    assert.equal( l.cqueue.get( 5 ).cmd, 'QUIT' );

    exit();
};