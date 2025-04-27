### Verify Access Token

```http
[POST] /api/oauth/verify
```

`public`  `application/json`

**Request**

```json
{
    "access_token": "string",
    "client_id": "string",
    "client_secret": "string"
}
```

**Response**

```json
{
    "sub": "string",
    "email": "string",
    "name": "string",
    "tenant": {
        "id": "string",
        "name": "string",
        "domain": "string"
    },
    "scopes": "string[]",
    "grant_type": "password | client_credential"
}
```

<hr>

### Access Token Exchange

```http
[POST] /api/oauth/exchange
```

`public`  `application/json`

**Request**

```json
{
    "access_token": "string",
    "client_id": "string | client_id of exchange tenant",
    "client_secret": "string"
}
```

**Response**

```json
{
    "grant_type": "password",
    "email": "string",
    "password": "string",
    "domain": "string"
}
```
