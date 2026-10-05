import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getRazorpayCheckout } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { RazorpayPayment } from "@/features/commerce/ui/razorpay-payment";
import { AppError } from "@/lib/errors/app-error";

export const metadata = { title: "Secure payment" };

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = commerceIdSchema.safeParse((await params).attemptId);
  if (!parsed.success) notFound();
  let checkout: Awaited<ReturnType<typeof getRazorpayCheckout>> | null = null;
  let unavailable = false;
  try {
    checkout = await getRazorpayCheckout(parsed.data, { userId: auth.user.id, email: auth.user.email, name: auth.user.name, phone: auth.user.phone, requestId: crypto.randomUUID() });
  } catch (error) {
    if (error instanceof AppError && error.status === 404) notFound();
    if (error instanceof AppError && error.code === "INVALID_COMMERCE_STATE") unavailable = true;
    else throw error;
  }
  if (unavailable || !checkout) redirect("/dashboard/orders?notice=checkout-unavailable");
  if (checkout.paid) redirect(`/payment-success?order=${checkout.orderId}`);
  return <WorkspaceShell admin={false} name={auth.user.name} section="orders"><RazorpayPayment checkout={checkout}/></WorkspaceShell>;
}
