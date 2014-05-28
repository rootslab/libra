###Libra
[![build status](https://secure.travis-ci.org/rootslab/libra.png?branch=master)](http://travis-ci.org/rootslab/libra) 
[![NPM version](https://badge.fury.io/js/libra.png)](http://badge.fury.io/js/libra)

[![NPM](https://nodei.co/npm/libra.png?downloads=true&stars=true)](https://nodei.co/npm/libra/)

[![NPM](https://nodei.co/npm-dl/libra.png)](https://nodei.co/npm/libra/)

> _Libra_, a module to handle bindings between commands and Redis replies.

> NOTE: It accepts only commands generated/encoded by __[Syllabus](https://github.com/rootslab/syllabus)__.

###Install

```bash
$ npm install libra [-g]
// clone repo
$ git clone git@github.com:rootslab/libra.git
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
###Constructor

> Create an instance.

```javascript
var l = Libra()
// or
var l = new Libra()
```

### Properties

```javascript
// command queue
Libra.cqueue : Train

// status properties
Libra.status : {
    subscription : {
        on : 0
        , channels : 0
        , pchannels : 0
    }
    , transaction : {
        on : 0
        , active : 0
    }
    , monitoring : {
        on : 0
    }
}
```

###Methods

> Arguments within [ ] are optional.

```javascript
/*
 * Push a Syllabus command to the internal queue.
 * It returns the number of command objects currently in the queue.
 *
 * NOTE: Only Syllabus commands are accepted.
 */
Libra#push( Object syllabus_command ) : Number

/*
 * Pop a Syllabus command from the internal queue.
 * It pops the current head of the command queue.
 */
Libra#pop() : Object

/*
 * Update internal subscription status ( using a un/subscription reply ),
 * passing the command and the number of current subscribed channels.
 */
Libra#update( subscription_command, channels_number ) : Number

/*
 * Flush the internal queue, reset all internal status properties,
 * then disable rollback mechanism.
 * It returns the current Libra instance.
 */
Libra#flush() : Libra

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