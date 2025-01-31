# tsunnel

A local tunnel written in Typescript

## Useful resources

- [understanding tcp anf http](https://medium.com/@sesmiat/understanding-the-journey-of-http-requests-over-tcp-connections-39f32b1ca10d)
- [understanding tcp fragmentation](https://medium.com/@nikolaystoykov/build-custom-protocol-on-top-of-tcp-with-node-js-part-1-fda507d5a262)

## TODO

- [x] ~~Similar Tunnel for HTTP protocol~~
- [x] ~~A clean and accesible CLI~~
- [x] ~~Nice logging for served requests~~
- [x] Smarter Delimiting & Escaping for control channel
- [ ] In control channel instead of storing in string use `Buffers`
- [ ] Better logging using pino and pino-pretty
- [x] ~~TCP/HTTP: allow/deny cidr ranges~~
- [x] ~~HTTP: basic auth~~
- [x] ~~HTTP: custom headers~~
