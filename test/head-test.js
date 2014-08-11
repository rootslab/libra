#!/usr/bin/env node

/* 
 * Libra #head method
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
        , ping = syl.commands.ping
        , select = syl.commands.select
        , acmd = auth( 'foobared', emptyFn )
        , pcmd = ping()
        , scmd = select( 0, emptyFn )
        , h = null
        , p = null
        , exit = typeof done === 'function' ? done : function () {}
        ;

    log( '- push dummy PING command to the queue.' );
    l.push( pcmd );

    h = l.head();
    p = l.pop();

    log( '- now compare #pop and #head result, should be the same command:', util.inspect( p, false, 3 , true )  );
    assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

    log( '- re-push dummy PING command to the queue.' );
    l.push( pcmd );

    log( '- call #auth to push AUTH command into the queue.' );
    l.auth( acmd );

    log( '- check if status.auth  property was correctly updated.' );
    assert.ok( l.status.auth[ 0 ] === acmd );

    h = l.head();
    p = l.pop();

    log( '- now compare #pop and #head result, should be the same command (not PING):', util.inspect( p, false, 3 , true )  );
    assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

    log( '- now Libra.status.auth should be resetted to 0.' );
    assert.deepEqual( l.status.auth, [] );

    log( '- call #select to push SELECT command into the queue.' );
    l.select( scmd );

    log( '- check if status.select property was correctly updated.' );
    assert.ok( l.status.select[ 0 ] === scmd );

    h = l.head();
    p = l.pop();

    log( '- now compare #pop and #head result, should be the same command (not PING):', util.inspect( p, false, 3 , true )  );
    assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

    log( '- now #pop PING command from the queue.' );

    h = l.head();
    p = l.pop();

    log( '- now compare #pop and #head result, should be the same command (PING):', util.inspect( p, false, 3 , true )  );
    assert.ok( h === p, 'got: ' + util.inspect( h, false, 3 , true ) );

    exit();
};