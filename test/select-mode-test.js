/* 
 * Libra SELECT mode
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
    , select = syl.commands.select
    , ping = syl.commands.ping
    , acmd = auth( 'foobared', emptyFn )
    , scmd = select( 0, emptyFn )
    , pcmd = ping()
    ;

log( '- push dummy PING command to the queue.' );
l.push( pcmd );

log( '- call Libra#auth with encoded AUTH command.' );
l.auth( acmd );

log( '- call Libra#select with encoded SELECT command.' );
l.select( scmd );

log( '- check if status property was correctly updated.' );
assert.ok( l.status.auth === acmd );

log( '- check if status property was correctly updated.' );
assert.ok( l.status.select === scmd );

log( '- call Libra#pop, result should be AUTH command and not PING.' );
assert.ok( l.pop() === acmd );

log( '- now Libra.status.auth should be resetted to null.' );
assert.ok( l.status.auth === null );

log( '- call Libra#pop, result should be SELECT command and not PING.' );
assert.ok( l.pop() === scmd );

log( '- now Libra.status.select should be resetted to null.' );
assert.ok( l.status.auth === null );