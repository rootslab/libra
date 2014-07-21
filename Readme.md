###♎ Libra

[![LICENSE](http://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/rootslab/libra#mit-license)

[![NPM VERSION](http://img.shields.io/npm/v/libra.svg)](https://www.npmjs.org/package/libra)
[![TRAVIS CI BUILD](http://img.shields.io/travis/rootslab/libra.svg)](http://travis-ci.org/rootslab/libra)
[![BUILD STATUS](http://img.shields.io/david/rootslab/libra.svg)](https://david-dm.org/rootslab/libra)
[![DEVDEPENDENCY STATUS](http://img.shields.io/david/dev/rootslab/spade.svg)](https://david-dm.org/rootslab/spade#info=devDependencies)

[![NPM GRAPH1](https://nodei.co/npm-dl/libra.png)](https://nodei.co/npm/libra/)

[![GITHUB tag](http://img.shields.io/github/tag/rootslab/libra.svg)](https://github.com/rootslab/libra/tags)
[![ISSUES](http://img.shields.io/github/issues/rootslab/libra.svg)](https://github.com/rootslab/libra/issues)
[![GITTIP](http://img.shields.io/gittip/rootslab.svg)](https://www.gittip.com/rootslab/)
[![NPM DOWNLOADS](http://img.shields.io/npm/dm/libra.svg)](http://npm-stat.com/charts.html?package=libra)

[![NPM GRAPH2](https://nodei.co/npm/libra.png?downloads=true&stars=true)](https://nodei.co/npm/libra/)

> _**♎ Libra**_, a module to handle bindings between commands and __Redis__ replies. Morover, it uses an __automatic rollback mechanism__ for subscriptions and transactions. It is heavily based on __[Train](https://github.com/rootslab/train)__ module, a __well-tested__ and fast __FIFO__ queue.
 
> __NOTE__: It accepts only commands generated/encoded by __[Syllabus](https://github.com/rootslab/syllabus)__.

> __NOTE__: If you need a full-featured __Redis 2.x__ client, built with the help of __[Libra](#)__ and __[Syllabus](https://github.com/rootslab/syllabus)__ modules, try __[♠ Spade](https://github.com/rootslab/spade)__.

###Install

```bash
$ npm install libra [-g]
// clone repo
$ git clone git@github.com:rootslab/libra.git
```
> __install and update devDependencies__:

```bash
 $ cd libra/
 $ npm install --dev
 # update
 $ npm update --dev
```
> __require__

```javascript
var Libra = require( 'libra' );
```
> See [examples](example/).

###Run Tests

```bash
$ cd libra/
$ npm test
```

###Run Benchmark

```bash
$ cd libra/
$ npm run bench
```
> __NOTE__: You should install _devDependencies_ (_Syllabus_) for running benchmarks.


###Constructor

> Create an instance.

```javascript
var l = Libra()
// or
var l = new Libra()
```

### Properties

> __WARNING__: Don't mess with these properties.

```javascript
// command queue
Libra.cqueue : Train

// status properties
Libra.status : {
    subscription : {
        on : 0
        , active : 0
        , channels : 0
    }
    , transaction : {
        on : 0
        , active : 0
    }
    , monitoring : {
        on : 0
        , active : 0
    }
    // it holds special AUTH command
    , auth : []
    // it holds special SELECT command
    , select : []
}
```

###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Update the current auth status property. In this way the AUTH command
 * has priority over the other commands in the queue; when #pop() will be
 * called, it will return this command regardless if the command queue is
 * empty or not.
 *
 * It returns the current auth status property ( encoded AUTH command ).
 *
 * NOTE: only Syllabus AUTH command will be accepted and stored.
 */
Libra#auth( Object syllabus_auth_command ) : Object

/*
 * Update the current select status property. In this way the SELECT command
 * has priority over the other commands in the queue (after AUTH); when #pop()
 * will be called, it will return this command regardless if the command queue
 * is empty or not.
 *
 * It returns the current select status property ( encoded SELECT command ).
 *
 * NOTE: only Syllabus SELECT command will be accepted and stored.
 */
Libra#select( Object syllabus_select_command ) : Object

/*
 * Update internal subscription status ( using a un/subscription reply ), passing the command and
 * the number of current subscribed channels, received as message reply. It returns the total number
 * of subscribed channels and patterns.
 *
 * Examples: Libra#update( 'subscribe', 5 ) or Libra#update( 'unsubscribe', 3 )
 *
 * NOTE: Except for subscription commands, QUIT is the only command accepted in pubsub mode.
 */
Libra#update( subscription_command_reply [, channels_number ] ) : Number

/*
 * Get the total number of channels/patterns in status.subscriptions
 */
Libra#subs() : Libra

/*
 * Push a Syllabus command to the internal queue.
 * It returns the number of command objects currently in the queue, or -1
 * if the command wasn't allowed/pushed.
 *
 * NOTE: only Syllabus commands are accepted.
 */
Libra#push( Object syllabus_command ) : Number

/*
 * Pop a Syllabus command from the internal queue.
 * It pops the current head of the command queue.
 */
Libra#pop() : Object

/*
 * Get a element in the command queue without popping it.
 * The default position is 0.
 */
Libra#head( [ Number pos ] ) : Object

/*
 * Start rolling up.
 * From now, all items evicted from the queue could be restored, executing #rollBack().
 * Disable rollUp passing false.
 * It returns the current Libra instance.
 */
Libra#rollUp( [ Boolean on ] ) : Libra

/*
 * Do rollback; previously evicted items are restored to the head of queue.
 * Optionally, it is possible to re-enable rollUp mechanism after the rollBack,
 * passing true.
 * It returns the current Libra instance.
 * 
 * NOTE: no rollBack will be done if rollUp was not already activated.
 */
Libra#rollBack( [ Boolean on ] ) : Libra

/*
 * Apply a fn to every element of the internal command queue;
 * fn will get 3 arguments: Object element, Number index, Function done.
 * After that every fn will have called done(), the callback will be launched
 * with an err argument ( if any has occurred ) and a number, representing
 * the total processed / iterated elements in the queue.
 *
 * If boolean "evict" was set to true, after the last fn call to done(),
 * the queue will be flushed.
 *
 * NOTE: when queue size is 0, the callback will be immediately executed
 * with arguments: ( null, 0 ).
 *
 * NOTE: on iteration, the size is fixed to the current queue size,
 * then it is possible to push other elements to the tail, these
 * added elements are not affected by iteration.
 */
Libra#iterate( Function fn [, Object scope [, Function cback [, Boolean evict ] ] ] ) : Libra

/*
 * Flush the internal queue, reset all internal status properties,
 * then disable rollback mechanism.
 * It returns the current Libra instance.
 */
Libra#flush() : Libra

/*
 * Reset all internal status properties, then disable rollback mechanism.
 * It returns the current Libra instance.
 */
Libra#reset() : Libra
```
------------------------------------------------------------------------


### MIT License

> Copyright (c) 2014 &lt; Guglielmo Ferri : 44gatti@gmail.com &gt;

> Permission is hereby granted, free of charge, to any person obtaining
> a copy of this software and associated documentation files (the
> 'Software'), to deal in the Software without restriction, including
> without limitation the rights to use, copy, modify, merge, publish,
> distribute, sublicense, and/or sell copies of the Software, and to
> permit persons to whom the Software is furnished to do so, subject to
> the following conditions:

> __The above copyright notice and this permission notice shall be
> included in all copies or substantial portions of the Software.__

> THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
> EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
> MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
> IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
> CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
> SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
