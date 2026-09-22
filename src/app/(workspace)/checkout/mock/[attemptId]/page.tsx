import { redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace-shell";
import { requireWorkspace } from "@/features/auth/page-access";
import { commerceIdSchema } from "@/features/commerce/validation";
import { MockPayment } from "@/features/commerce/ui/mock-payment";

export const metadata={title:"Test payment"};
export default async function Page({params}:{params:Promise<{attemptId:string}>}){const auth=await requireWorkspace();if(auth.admin)redirect("/admin");const attemptId=commerceIdSchema.parse((await params).attemptId);return <WorkspaceShell admin={false} name={auth.user.name} section="orders"><MockPayment attemptId={attemptId}/></WorkspaceShell>}
