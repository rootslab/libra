/* 
 * Libra Example
 */

var log = console.log
    , util = require( 'util' )
    , Libra = require( '../' )
    , l = Libra()
    ;
log( util.inspect( l, false, 3, true ) );