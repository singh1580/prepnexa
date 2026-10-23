import { sendTransactionalEmail } from "@/features/email/sender";
import { NotificationEmail } from "@/features/email/templates";

export async function sendOperationsEmail(input: { deliveryId: string; to: string; name: string; title: string; body: string }) {
  return sendTransactionalEmail({
    to: input.to,
    subject: input.title,
    template: <NotificationEmail name={input.name} title={input.title} body={input.body}/>,
    idempotencyKey: `notification-${input.deliveryId}`,
  });
}
