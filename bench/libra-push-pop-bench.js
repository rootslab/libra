#!/usr/bin/env node

var log = console.log
    , assert = require( 'assert' )
    , util = require( 'util' )
    , Libra = require( '../' )
    , l = Libra()
    , Syllabus = require( 'syllabus' )
    , syl = Syllabus()
    , commands = syl.commands
    // callback that receives an Error
    , cback = function ( err, data ) {
        assert.ifError( ! err );
    }
    , publish = commands.publish( 'channel', 'message', cback )
    , print = function ( ms, n ) {
        var avg = 1000 * n / ms;
        log( '- elements: %d.', n );
        log( '- elapsed time: %d secs.', ( ms / 1000 ).toFixed( 4 ) );
        log( '- average rate: %d Mop/sec.', ( avg / 1000 / 1000 ).toFixed( 2 ) );
    }
    , p = 24
    , k = Math.pow( 2, p )
    , i = 0
    , stime = 0
    , etime = 0
    ;

log( '- running Libra#push 2^%d times, with command:', p, util.inspect( publish, false, 3, true ) );

i = k;

stime = Date.now();

for ( ; i--; ) {
    l.push( publish );
};

etime =  Date.now() - stime;

print( etime, k );

log( '\n- check Libra internal queue size, should be:', k );
assert.equal( l.cqueue.size(), k );

log( '\n- now running Libra#pop 2^%d times', p );

i = k;

stime = Date.now();

for ( ; i--; ) {
    l.pop();
};

etime =  Date.now() - stime;

l.flush();

print( etime, k );