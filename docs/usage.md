# tsunnel
This works kind of like a proxy to expose your local development servers to the internet.

## Http
Simplest usecase of tsunnel can be to expose a local http server to internet.

```sh
tsunnel http 8000
```

Just running this command will return you a link. Using this link you will be able to access traffic at your local port 8000 anywhere on the internet.

### Options
Although this itself covers most of the usecases tsunnel also provides some options to customise behaviour.

#### Non local host
By default service running in localhost is forwarded. You can provide any host using the `-h` or `--host` option.
```sh
tsunnel http --host google.com 89
```
This will forward traffic from google.com

#### Allow CIDR 
By using tunnel your service will be publicly available. You can change this by blocking requests from certain ip ranges using `--allow` option.
```sh
tsunnel http 8000 --allow 192.168.0.1/24
```
Now only the machines in this ip can access your service. You can allow multiple cidr ranges by passing multiple allow options.

#### Deny CIDR 
The reverse is also possible. You can restrict certain ip ranges while allowing other by using `--deny` option.
```sh
tsunnel http 8000 --deny 192.168.0.1/24
```

And of course you can deny multiple ranges and combine allow and deny options.

#### Basic Auth
In addition to restricting ip ranges you can further enforce security by using http basic auth mechanism using the `--basic-auth` option like follows
```sh
tsunnel http 8000 --basic-auth user:password
```
Now when accessing the endpoint you will be prompted to enter the username and password and only upon entering right credentials you will be allowed to access it. You can pass multiple username/passwords.

#### Requests Headers 
You can manipulate request headers before reaching your service using `--req-headers-add` and `--req-headers-rm` options.
```sh
tsunnel http 8000 --req-headers-add X-Custom:any-value --req-headers-rm X-remove
```
Using this any incoming request will be decorated with the `X-Custom` header with the given value and `X-remove` header will be stripped.

#### Response headers
The same is also possible for response headers using `--res-headers-add` and `--res-headers-rm` options.
