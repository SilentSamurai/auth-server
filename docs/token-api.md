### Verify Access Token

**POST `/api/oauth/verify`**

`public`  `application/json`

**Request Body**

```json
{
    "access_token": "string",
    "client_id": "string",
    "client_secret": "string"
}
```

**Response Body**

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

### Access Token Exchange

**POST `/api/oauth/exchange`**

`public`  `application/json`

**Request Body**

```json
{
    "access_token": "string",
    "client_id": "string | client_id of exchange tenant",
    "client_secret": "string"
}
```

**Response Body**

```json
{
    "grant_type": "password",
    "email": "string",
    "password": "string",
    "domain": "string"
}
```
