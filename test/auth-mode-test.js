/* 
 * Libra AUTH mode
 */

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
    , acmd = auth( 'foobared', emptyFn )
    , pcmd = ping()
    ;

log( '- push dummy PING command to the queue.' );
l.push( pcmd );

log( '- call Libra#auth with encoded AUTH command.' );
l.auth( acmd );

log( '- check if status property was correctly updated.' );
assert.ok( l.status.auth === acmd );

log( '- call Libra#pop, result should be AUTH command and not PING.' );
assert.ok( l.pop() === acmd );

log( '- now Libra.status.auth should be resetted to null.' );
assert.ok( l.status.auth === null );