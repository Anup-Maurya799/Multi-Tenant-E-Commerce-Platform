# API Documentation

Base URL

```
http://localhost:5000/api/v1
```

---

# Authentication APIs

## Register User

POST

```
/auth/register
```

### Request

```json
{
  "name": "Anup Maurya",
  "email": "anup@example.com",
  "password": "Password123",
  "role": "customer"
}
```

### Success Response

```json
{
  "message": "Account created. Please check your email to verify your account.",
  "user": {}
}
```

---

## Login

POST

```
/auth/login
```

### Request

```json
{
  "email": "anup@example.com",
  "password": "Password123"
}
```

---

## Get Current User

GET

```
/auth/me
```

Authorization

```
Bearer Token
```

---

## Refresh Token

POST

```
/auth/refresh
```

---

## Logout

POST

```
/auth/logout
```

---

## Forgot Password

POST

```
/auth/forgot-password
```

---

## Reset Password

POST

```
/auth/reset-password
```

---

## Verify Email

POST

```
/auth/verify-email
```

---

## Resend Verification Email

POST

```
/auth/resend-verification
```
