# Webmail

## How to find avatar in minio:

go to:

https://www.md5hashgenerator.com/
and convert the email address or the domain name in hash.

or go to home of the project and:

```
node
crypto.createHash("md5").update('nicbenigni@gmail.com').digest("hex")
```
