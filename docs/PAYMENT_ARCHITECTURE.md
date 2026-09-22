# Provider-Neutral Payment Architecture

Payment-provider selection is deliberately deferred. The application core depends on a `PaymentProvider` contract, never a provider SDK.

## Boundary

```text
Checkout UI -> Payment service -> PaymentProvider contract -> Provider adapter
Webhook URL -> Adapter verification -> Normalized event -> Payment service
Payment service -> Order/payment/refund repositories -> Entitlement service
```

The Phase 8 provider contract requires create checkout, verify webhook and request refund. Provider adapters translate external identifiers and statuses into internal values. A future adapter may add status-fetch/reconciliation internally without leaking provider-specific states into application services.

## Internal guarantees

- Internal order IDs remain canonical.
- Provider order, payment, event, and refund IDs are stored with the provider name.
- A provider event ID is processed at most once.
- Entitlement creation occurs in the same controlled workflow as successful payment recording.
- Existing transactions continue using their original adapter after the default provider changes.
- Secrets are server-only and validated conditionally for the selected adapter.
- A mock adapter supports deterministic local and automated testing.
- The mock adapter and authenticated mock-confirmation route refuse to run in production.

## Forbidden coupling

- Provider SDK imports outside its adapter directory.
- Provider-specific status strings in services or UI.
- Provider-generated amounts trusted over the internal order without comparison.
- Access granted from a browser redirect alone.
- Provider secrets or raw signatures stored in logs.
