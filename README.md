# knex-stream-release
Knex aborted streams playground

## Install

Install dependencies

```js
$ npm install
```

Run server:

```bash
# Kills all long-running DB conns and start server
$ npm run start-dev
```

## Usage

- Open a browser to `http://localhost:3000`.
- Set network throttling profile as Fast 3G.
- As soon as console states that you should refresh, hit the Refresh button
  on browser. The console instructs you to refresh as soon as some part of the
  response is received.
- Do this 10 times.

## Expected results

### Using `res.write(chunk)`

```js
stream.on('data', row => {
  res.write(JSON.stringify(row) + '-|||-')
})
.on('error', error => {
  res.end()
})
.on('end', () => {
  res.end()
})
```
The used connections **increase and decrease**. It's impossible to stack up used
connections no matter how many times we refresh. It's very hard to induce
timeouts using this method.

In production, we know that this method causes severe memory spikes but does not
create timeouts.

### Using `stream.pipe(res)`

```js
stream.pipe(JSONStream.stringify()).pipe(res)
```

The used connections stack up. Each refresh creates one more used connection. **At no point do used connections decrease.**

In production, we know that this method has a stable memory usage profile but
creates timeouts.

## Working code

The following code should work reliably with the `.pipe` method:

```js
const stream = db('event_v3').select('*').where({ id_session: 'D2g845BN-' }).stream()

//@NOTE Not listening to this event will crash the process if
// `stream.destroy(err)` is called.
stream.on('error', () => {
  console.log('Fake handling of stream')
})

// @NOTE This is the missing piece of the puzzle:
// https://github.com/tgriesser/knex/wiki/Manually-Closing-Streams
req.on('close', () => {
  // @NOTE `stream.end()` doesn't seem to work, even on 0.21.3+, figure
  // out why.
  stream.destroy('err')
})

return stream.pipe(JSONStream.stringify()).pipe(res)
```

## Authors

Bitpaper LTD
