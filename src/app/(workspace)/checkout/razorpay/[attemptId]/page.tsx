import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { getRazorpayCheckout } from "@/features/commerce/service";
import { commerceIdSchema } from "@/features/commerce/validation";
import { RazorpayPayment } from "@/features/commerce/ui/razorpay-payment";

export const metadata = { title: "Secure payment" };

export default async function Page({ params }: { params: Promise<{ attemptId: string }> }) {
  const auth = await requireWorkspace();
  if (auth.admin) redirect("/admin");
  const parsed = commerceIdSchema.safeParse((await params).attemptId);
  if (!parsed.success) notFound();
  const checkout = await getRazorpayCheckout(parsed.data, { userId: auth.user.id, email: auth.user.email, name: auth.user.name, requestId: crypto.randomUUID() });
  if (checkout.paid) redirect(`/payment-success?order=${checkout.orderId}`);
  return <WorkspaceShell admin={false} name={auth.user.name} section="orders"><RazorpayPayment checkout={checkout}/></WorkspaceShell>;
}
