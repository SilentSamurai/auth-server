### OAuth Token (Password Grant Type)

```http
[POST] /api/oauth/token
```

`public`  `application/json`

**Request**

```json
{
    "grant_type": "password",
    "email": "string",
    "password": "string",
    "domain": "string"
}
```

**Response**

```json
{
    "access_token": "string",
    "token_type": "string",
    "expires_in": "string",
    "refresh_token": "string"
}
```

<hr>

### OAuth Token (Client Grant Type)

```http
[POST] /api/oauth/token
```

`public`  `application/json`

**Request**

```json
{
    "grant_type": "client_credential",
    "client_id": "string",
    "client_secret": "string"
}
```

**Response**

```json
{
    "access_token": "string",
    "token_type": "string",
    "expires_in": "string"
}
```

<HR> 

### OAuth Token (Refresh Grant Type)

```http
[POST] /api/oauth/token
```

`public`  `application/json`

**Request**

```json
{
    "grant_type": "refresh_token",
    "refresh_token": "string"
}
```

**Response**

```json
{
    "access_token": "string",
    "token_type": "string",
    "expires_in": "string"
}
```
