# Hospital Staff Portal

## Current State
New project. No existing implementation.

## Requested Changes (Diff)

### Add
- **Authentication & RBAC**: Two roles: Admin and Staff. Admins have full access; Staff see only their own data.
- **Staff Directory**: Employee records with Employee ID, Name, Department, Designation, System Role.
- **Duty Roster**: Weekly shift assignments per staff member with dates, shift timings, and ward assignments.
- **Official Orders & Notices**: Admin-published memos, circulars, policy updates visible to all staff.
- **Leave Management**: Staff can submit leave requests (type, start/end date, reason). Admins can approve/reject.
- **Document Vault**: Admin-generated official letters with unique verification IDs and QR codes for scanning/verification.

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Use `authorization` component for login and role-based access (Admin / Staff).
2. Use `qr-code` component to render verifiable QR codes on documents.
3. Backend stores: Staff profiles, Duty rosters, Notices, Leave requests, Documents.
4. Admin can create/edit all records; Staff can only read their own assigned records.
5. Document Vault entries contain a unique verification ID encoded in a QR code for authenticity.
6. Frontend: Sidebar navigation with role-aware menu items; dedicated pages per module.
