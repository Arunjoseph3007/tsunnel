# tsunnel

A local tunnel written in Typescript. Using tsunnel you can prove that "It works on My Machine".

## Useful resources

- [understanding tcp anf http](https://medium.com/@sesmiat/understanding-the-journey-of-http-requests-over-tcp-connections-39f32b1ca10d)
- [understanding tcp fragmentation](https://medium.com/@nikolaystoykov/build-custom-protocol-on-top-of-tcp-with-node-js-part-1-fda507d5a262) - we ultimately didnt use this kind of message framing. Instead opted for a length based algorithm

## TODO

- [x] ~~Similar Tunnel for HTTP protocol~~
- [x] ~~A clean and accesible CLI~~
- [x] ~~Nice logging for served requests~~
- [x] Smarter Delimiting & Escaping for control channel
- [x] In control channel instead of storing in string use `Buffers`
- [x] Clean up message framing code. Extract to a class. Remove `smartProcessData`
- [ ] Better logging using pino and pino-pretty
- [x] ~~TCP/HTTP: allow/deny cidr ranges~~
- [x] ~~HTTP: basic auth~~
- [x] ~~HTTP: custom headers~~
- [ ] Add time out to client to prevent attacks
- [ ] Add some tests please.
