#!/usr/bin/env node

/* 
 * Libra SELECT mode
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
        , auth = syl.commands.auth
        , select = syl.commands.select
        , ping = syl.commands.ping
        , acmd = auth( 'foobared', emptyFn )
        , scmd = select( 0, emptyFn )
        , pcmd = ping()
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- push dummy PING command to the queue.' );
    l.push( pcmd );

    log( '- call Libra#auth with encoded AUTH command.' );
    l.auth( acmd );

    log( '- call Libra#select with encoded SELECT command.' );
    l.select( scmd );

    log( '- check if status property was correctly updated.' );
    assert.ok( l.status.auth[ 0 ] === acmd );

    log( '- check if status property was correctly updated.' );
    assert.ok( l.status.select[ 0 ] === scmd );

    log( '- call Libra#pop, result should be AUTH command and not PING.' );
    assert.ok( l.pop() === acmd );

    log( '- now Libra.status.auth should be resetted to [].', l.status.auth );
    assert.deepEqual( l.status.auth, [] );

    log( '- call Libra#pop, result should be SELECT command and not PING.' );
    assert.ok( l.pop() === scmd );

    log( '- now Libra.status.select should be resetted to [].' );
    assert.deepEqual( l.status.select, [] );

    exit();
};