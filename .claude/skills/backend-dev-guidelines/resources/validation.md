# Input Validation

## Zod Setup

```bash
npm install zod
```

## Schema Patterns

### Basic Schema
```typescript
// lib/validations/user.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100),
  age: z.number().int().min(0).max(150).optional(),
});

export const UpdateUserSchema = CreateUserSchema.partial();

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
```

### Common Validators
```typescript
// lib/validations/common.ts
import { z } from 'zod';

export const UUIDSchema = z.string().uuid();

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export const SortSchema = z.object({
  field: z.string(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export const DateRangeSchema = z.object({
  from: z.coerce.date(),
  to: z.coerce.date(),
}).refine(
  (data) => data.from <= data.to,
  { message: 'Start date must be before end date' }
);
```

### Nested Objects
```typescript
const AddressSchema = z.object({
  street: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(2).max(2), // ISO code
  postalCode: z.string(),
});

const UserWithAddressSchema = z.object({
  name: z.string(),
  addresses: z.array(AddressSchema).min(1).max(5),
});
```

## Validation in Routes

### Body Validation
```typescript
// app/api/users/route.ts
import { CreateUserSchema } from '@/lib/validations/user';
import { handleApiError } from '@/lib/api/error-handler';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = CreateUserSchema.parse(body);

    // validated is now typed as CreateUserInput
    const { data, error } = await supabase
      .from('users')
      .insert(validated)
      .select()
      .single();

    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Query Parameter Validation
```typescript
// app/api/users/route.ts
import { PaginationSchema } from '@/lib/validations/common';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const params = PaginationSchema.parse({
      page: searchParams.get('page'),
      limit: searchParams.get('limit'),
    });

    const { page, limit } = params;
    // Use validated pagination
  } catch (error) {
    return handleApiError(error);
  }
}
```

### Path Parameter Validation
```typescript
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const validatedId = UUIDSchema.parse(id);

    // Use validated ID
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Custom Validators

```typescript
// Email domain restriction
const CorporateEmailSchema = z.string().email().refine(
  (email) => email.endsWith('@company.com'),
  { message: 'Must use company email' }
);

// Async validation (database check)
const UniqueEmailSchema = z.string().email().refine(
  async (email) => {
    const exists = await checkEmailExists(email);
    return !exists;
  },
  { message: 'Email already in use' }
);

// Use with parseAsync
const validated = await UniqueEmailSchema.parseAsync(email);
```

## Error Messages

```typescript
const schema = z.object({
  email: z.string({
    required_error: 'Email is required',
    invalid_type_error: 'Email must be a string',
  }).email('Please enter a valid email'),
});
```
