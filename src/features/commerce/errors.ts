import { AppError } from "@/lib/errors/app-error";

export const commerceNotFound = (name: string) => new AppError("COMMERCE_NOT_FOUND", `${name} was not found.`, 404);
export const checkoutConflict = (message: string) => new AppError("CHECKOUT_CONFLICT", message, 409);
export const couponUnavailable = (message = "This coupon is not available for this purchase.") => new AppError("COUPON_UNAVAILABLE", message, 409);
export const paymentUnavailable = (message = "Payment could not be started. Please try again.") => new AppError("PAYMENT_UNAVAILABLE", message, 503);
export const paymentVerificationFailed = () => new AppError("PAYMENT_VERIFICATION_FAILED", "The payment event could not be verified.", 400);
export const invalidCommerceState = (message: string) => new AppError("INVALID_COMMERCE_STATE", message, 409);
