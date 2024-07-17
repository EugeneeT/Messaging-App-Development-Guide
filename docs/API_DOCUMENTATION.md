# API Documentation

## Base URL

All endpoints are relative to: `http://localhost:5000/api`

## Endpoints

### User Management

#### Register a new user

- **URL**: `/users/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "displayName": "John Doe"
  }
  ```
- **Success Response**:
  - **Code**: 201
  - **Content**:
    ```json
    {
      "message": "You registered successfully",
      "user": {
        "_id": "mongoDBId",
        "email": "user@example.com",
        "displayName": "John Doe",
        "firebaseId": "firebaseUserId"
      }
    }
    ```
- **Error Response**:
  - **Code**: 400
  - **Content**: `{ "message": "This email is already registered" }`

#### User Login

- **URL**: `/users/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword",
    "fcmToken": "firebaseCloudMessagingToken"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "token": "jwtToken",
      "fcmToken": "firebaseCloudMessagingToken",
      "displayName": "John Doe",
      "mongoId": "mongoDBId",
      "firebaseId": "firebaseUserId"
    }
    ```
- **Error Response**:
  - **Code**: 404
  - **Content**: `{ "message": "User not found" }`
  - **Code**: 401
  - **Content**: `{ "message": "Invalid credentials" }`

#### Firebase Login

- **URL**: `/users/firelogin`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "uid": "firebaseUserId",
    "fcmToken": "firebaseCloudMessagingToken",
    "displayName": "John Doe"
  }
  ```
- **Success Response**:
  - **Code**: 200
  - **Content**:
    ```json
    {
      "token": "jwtToken",
      "fcmToken": "firebaseCloudMessagingToken",
      "displayName": "John Doe"
    }
    ```
- **Error Response**:
  - **Code**: 500
  - **Content**: `{ "message": "Internal server error" }`

## Authentication

All endpoints except `/users/register` and `/users/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <token>
```

## Error Handling

All endpoints may return a 500 Internal Server Error if an unexpected error occurs on the server.

```json
{
  "message": "Internal server error"
}
```
