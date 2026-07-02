┌─────────────────┐
│ Customer Arrive │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Waiter Assign   │
│ Table           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Create Order    │
│ Session         │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Add Order Items │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Kitchen Receives│
│ Order           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PREPARING       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ READY           │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Waiter Delivers │
│ Food            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ SERVED          │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Customer Wants  │
│ More Items?     │
└──────┬─────┬────┘
       │Yes  │No
       │     │
       ▼     ▼
 Add Item  Request Bill
       │         │
       └────┬────┘
            ▼
┌─────────────────┐
│ Calculate Total │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Payment         │
│ (Cashier)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ PAID            │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Close Session   │
│ Table Available │
└─────────────────┘

Ownership Tiap Role
Admin
 ├── Menus
 ├── Employees
 ├── Reports
 └── All Orders

Waiter
 ├── Tables
 ├── Orders
 ├── Order Items
 └── Bill Request

Kitchen
 ├── Preparing
 └── Ready

Cashier
 ├── Billing
 ├── Payment
 └── Receipt