### OAuth Token (Password Grant Type)

**POST `/api/oauth/token`**

`public`  `application/json`

**Request Body**

```json
{
    "grant_type": "password",
    "email": "string",
    "password": "string",
    "domain": "string"
}
```

**Response Body**

```json
{
    "access_token": "string",
    "token_type": "string",
    "expires_in": "string",
    "refresh_token": "string"
}
```

### OAuth Token (Client Grant Type)

**POST `/api/oauth/token`**

`public`  `application/json`

**Request Body**

```json
{
    "grant_type": "client_credential",
    "client_id": "string",
    "client_secret": "string"
}
```

**Response Body**

```json
{
    "access_token": "string",
    "token_type": "string",
    "expires_in": "string"
}
```

### OAuth Token (Refresh Grant Type)

**POST `/api/oauth/token`**

`public`  `application/json`

**Request Body**

```json
{
    "grant_type": "refresh_token",
    "refresh_token": "string"
}
```

**Response Body**

```json
{
    "access_token": "string",
    "token_type": "string",
    "expires_in": "string"
}
```
