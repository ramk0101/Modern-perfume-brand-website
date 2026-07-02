# Firestore Security Specification & TDD Plan

This specification outlines the data validation rules and structural invariants for Aetheria Parfums Firestore collection resources.

## 1. Data Invariants
- **Identity Invariant**: Users can only read and write their own User profile (`users/{userId}` where `userId == request.auth.uid`).
- **Owner Isolation**: Users can only read and write their own Orders (`orders/{orderId}`) and Formulas (`formulas/{formulaId}`). The `userId` field inside any Order or Formula document MUST strictly match `request.auth.uid`.
- **System Integrity**: Users are forbidden from creating orders or formulas without providing an authenticated context.
- **Immutability Invariant**: Fields like `orderId` or `userId` are strictly immutable once a document is created.
- **State Integrity**: An order's status or details cannot be altered by arbitrary other users.

## 2. The "Dirty Dozen" Attack Payloads
Here are 12 specific rogue payloads designed to break security bounds, each of which MUST return `PERMISSION_DENIED` under our security rules:

1. **Anonymous Writing to User Profile**: Attempting to write a user profile document when unauthenticated.
2. **Profile Spoofing**: Signed-in user `UserA` attempting to write a profile document under path `/users/UserB`.
3. **Privilege Injection**: Attempting to write a user profile document with an injected `isAdmin: true` field.
4. **Order Spoofing**: User `UserA` creating an order at `/orders/order123` with `userId` set to `UserB`.
5. **Formula Hijacking**: User `UserA` attempting to modify a formula belonging to `UserB` (i.e. document's `userId` field equals `UserB`).
6. **Unauthenticated Formula Creation**: Attempting to create a custom scent formula when not logged in.
7. **Junk Character ID Injection**: Creating a formula document with a 10KB special character string as the document ID (violating `isValidId`).
8. **Negative Quantity Order**: Creating an order where the product `quantity` is negative (e.g., `-5`).
9. **Fake Email Validation Spoofing**: Attempting a write when `email_verified` is false but claiming a privilege based on the email.
10. **Formulation Memory Flooding**: Writing a formula with a description field that exceeds maximum size constraints (e.g., a 10MB string).
11. **Timestamp Forgery**: Creating an order with a fabricated, future-dated client timestamp instead of the server-enforced `request.time`.
12. **Malicious Column Injection**: Inserting arbitrary fields not present in the allowed entities list into a formula document (violating schema strictness).

## 3. Test Cases (Verification Logic)
All tests in `/firestore.rules.test.ts` (or mapped in security checks) verify that:
- Reads and writes to profiles, formulas, or orders where `userId != request.auth.uid` are strictly rejected.
- Schema matching restricts properties to exactly those listed in the specification.
- `PERMISSION_DENIED` is triggered for every one of the "Dirty Dozen" payloads.
