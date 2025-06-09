import { NextRequest } from 'next/server'
import type { AuthCustomer } from './auth'

/**
 * getAuthFromRequest
 * ------------------
 * – Looks for `x-auth-id` / `x-customer-name` headers.
 * – In **dev**, if the header is missing we fall back to DEV_CUSTOMER_ID
 *   so every request hits the same tenant and old records remain visible.
 */
export function getAuthFromRequest(request: NextRequest): AuthCustomer {
   //const headerId = request.headers.get('x-auth-id');
   //hardoced the header to show the users created by other customer id as the curstomer id changes always 
   const headerId="f4ec5e01-b864-43e7-a461-bab1ec2dace2";
    return {
        //customerId: request.headers.get('x-auth-id') ?? '',
        customerId: headerId ?? process.env.DEV_CUSTOMER_ID ?? '',
        customerName: request.headers.get('x-customer-name') ?? null
    }
} 
