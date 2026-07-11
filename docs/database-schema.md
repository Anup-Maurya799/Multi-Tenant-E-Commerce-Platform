## Users

- \_id
- name
- email
- password
- role (Admin | Vendor | Customer)
- phone
- profileImage
- isVerified
- createdAt
- updatedAt

## Stores

- \_id
- ownerId (User ID)
- storeName
- description
- logo
- address
- status
- createdAt

## Products

- \_id
- storeId
- categoryId
- title
- description
- price
- stock
- images
- createdAt

## Categories

- \_id
- name
- description

## Cart

- \_id
- userId
- products[]
- totalPrice

## Orders

- \_id
- userId
- storeId
- orderItems[]
- paymentId
- status
- totalAmount
- createdAt

## OrderItems

- \_id
- orderId
- productId
- quantity
- price

## Payments

- \_id
- orderId
- paymentMethod
- transactionId
- paymentStatus

## Reviews

- \_id
- userId
- productId
- rating
- comment
- createdAt

# Relationships

User → Store (One Vendor can own many Stores)

Store → Product (One Store has many Products)

Category → Product (One Category has many Products)

User → Cart (One User has one Cart)

Cart → Products (One Cart contains many Products)

User → Orders (One User has many Orders)

Order → OrderItems (One Order contains many Order Items)

Order → Payment (One Order has one Payment)

User → Review (One User writes many Reviews)

Product → Review (One Product has many Reviews)
