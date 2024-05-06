# Reverse API example

A minimal example on how to use the OpenApi42 code generator. This API does basically nothing, but it does demonstrate a minimal setup for an api.

First, start the server via `npm start`, then do the following curl request:

```
curl localhost:8080/reverse --header "content-type: text/plain" --data elmer
```

this wil print

```
remle
```
