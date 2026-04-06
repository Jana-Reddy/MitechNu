import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getCourseBySlug, listOrdersForUser } from "@academy/db";
import { getCurrentUser } from "../../../lib/auth";
import { submitPaymentAction } from "../../../lib/actions";
import { formatInr } from "../../../lib/utils";

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ orderId?: string; submitted?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const { courseSlug } = await params;
  const query = await searchParams;
  const course = await getCourseBySlug(courseSlug);
  if (!course) {
    redirect("/courses");
  }

  const orders = await listOrdersForUser(user.id);
  const activeOrder = orders.find((order) => order.id === query.orderId) ?? orders.find((order) => order.course?.slug === courseSlug);

  return (
    <SectionShell>
      <div className="grid gap-8 py-14 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Manual payment checkout</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">{course.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Create your payment in any preferred rails you support, then submit the transaction reference here. Admin approval enrolls the learner automatically.
          </p>
          {query.submitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Payment proof submitted. An admin can now approve the order.
            </div>
          ) : null}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Price</p>
              <p className="mt-2 text-2xl font-bold text-slate-950">{formatInr(activeOrder?.amountInr ?? course.priceInr)}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">Order status</p>
              <p className="mt-2 text-2xl font-bold capitalize text-slate-950">{activeOrder?.status ?? "create an order first"}</p>
            </div>
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Submit payment proof</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Demo flow: use any reference string. In production, this would capture UPI/bank transfer proof or integrate a gateway later.
          </p>
          {activeOrder ? (
            <form action={submitPaymentAction} className="mt-6 space-y-4">
              <input type="hidden" name="orderId" value={activeOrder.id} />
              <input type="hidden" name="courseSlug" value={courseSlug} />
              <input name="reference" placeholder="Payment reference / UTR / UPI ID" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <textarea name="notes" rows={5} placeholder="Notes for the admin reviewer" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Submit proof
              </button>
            </form>
          ) : (
            <p className="mt-6 text-sm leading-6 text-slate-500">
              Create an order from the course detail page first, then return here to submit the payment reference.
            </p>
          )}
        </aside>
      </div>
    </SectionShell>
  );
}

