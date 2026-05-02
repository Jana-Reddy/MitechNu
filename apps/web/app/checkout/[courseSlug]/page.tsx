import { redirect } from "next/navigation";
import { SectionShell } from "@academy/ui";
import { getCourseBySlug, getPaymentSettings, listOrdersForUser } from "@academy/db";
import { getCurrentUser } from "../../../lib/auth";
import { submitPaymentAction } from "../../../lib/actions";
import { getResolvedPaymentConfig } from "../../../lib/payments";
import { formatInr } from "../../../lib/utils";

export default async function CheckoutPage({
  params,
  searchParams
}: {
  params: Promise<{ courseSlug: string }>;
  searchParams: Promise<{ error?: string; orderId?: string; submitted?: string }>;
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
  const activeOrder = orders.find((order: any) => order.id === query.orderId) ?? orders.find((order: any) => order.course?.slug === courseSlug);
  const paymentSettings = await getPaymentSettings();
  const paymentConfig = getResolvedPaymentConfig(paymentSettings, activeOrder?.amountInr ?? course.priceInr);

  const errorMessage =
    query.error === "invalid-payment"
      ? "Enter a valid UTR or UPI reference before submitting. Screenshot uploads must be PNG, JPG, or WEBP under 1 MB."
      : query.error === "invalid-order"
        ? "This order could not be matched to your account."
        : undefined;

  return (
    <SectionShell>
      <div className="grid gap-8 py-14 lg:grid-cols-[1fr_420px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-panel">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">UPI checkout</p>
          <h1 className="mt-3 text-4xl font-black text-slate-950">{course.title}</h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            Pay with any UPI app, keep your transaction reference handy, then submit it here for quick manual approval. Once approved, the course is enrolled automatically.
          </p>
          {query.submitted ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              Payment proof submitted. An admin can now approve the order.
            </div>
          ) : null}
          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
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
          {activeOrder?.payment ? (
            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Latest submitted proof</p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-slate-500">Reference</p>
                  <p className="mt-1 text-sm font-semibold text-slate-950">{activeOrder.payment.reference}</p>
                  <p className="mt-4 text-sm text-slate-500">Review status</p>
                  <p className="mt-1 text-sm font-semibold capitalize text-slate-950">{activeOrder.payment.status}</p>
                  {activeOrder.payment.notes ? (
                    <>
                      <p className="mt-4 text-sm text-slate-500">Your note</p>
                      <p className="mt-1 text-sm leading-6 text-slate-700">{activeOrder.payment.notes}</p>
                    </>
                  ) : null}
                </div>
                <div>
                  {activeOrder.payment.screenshotUrl ? (
                    <img src={activeOrder.payment.screenshotUrl} alt="Submitted payment proof" className="w-full rounded-2xl border border-slate-200 bg-white object-contain" />
                  ) : (
                    <div className="flex h-full min-h-40 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">
                      No screenshot uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
          <div className="mt-8 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-300">How to pay</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">UPI ID</p>
                <p className="mt-2 break-all text-lg font-bold text-white">{paymentConfig.upiId ?? "Add PAYMENT_UPI_ID in env"}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm text-slate-300">Payee name</p>
                <p className="mt-2 text-lg font-bold text-white">{paymentConfig.payeeName ?? "Add PAYMENT_UPI_PAYEE in env"}</p>
              </div>
            </div>
            <ol className="mt-5 space-y-2 text-sm leading-6 text-slate-200">
              <li>1. Open any UPI app like GPay, PhonePe, Paytm, or BHIM.</li>
              <li>2. Pay exactly {formatInr(activeOrder?.amountInr ?? course.priceInr)} using the UPI ID or QR code shown here.</li>
              <li>3. Copy the final UTR / transaction reference and submit it in the proof form.</li>
            </ol>
            {paymentConfig.note ? (
              <p className="mt-4 rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100">{paymentConfig.note}</p>
            ) : null}
            {paymentConfig.upiIntentUrl ? (
              <a
                href={paymentConfig.upiIntentUrl}
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-slate-200"
              >
                Open UPI app
              </a>
            ) : null}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-950">Submit UPI proof</h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">Share the UTR or app transaction reference after payment so the admin can verify and activate your access.</p>
          {paymentConfig.upiIntentUrl ? (
            <div className="mt-6 rounded-[1.75rem] border border-slate-200 bg-slate-50 p-4 text-center">
              <p className="text-sm font-semibold text-slate-700 mb-3">Scan QR to pay</p>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(paymentConfig.upiIntentUrl)}`}
                alt="UPI QR code"
                width={200}
                height={200}
                className="mx-auto rounded-xl border border-slate-200 bg-white"
              />
              <p className="mt-2 text-xs text-slate-500">Scan with any UPI app</p>
            </div>
          ) : null}
          {activeOrder ? (
            <form action={submitPaymentAction} className="mt-6 space-y-4">
              <input type="hidden" name="orderId" value={activeOrder.id} />
              <input type="hidden" name="courseSlug" value={courseSlug} />
              <input name="reference" placeholder="UTR / UPI transaction reference" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-4">
                <label className="block text-sm font-semibold text-slate-700">Upload payment screenshot</label>
                <p className="mt-1 text-xs leading-5 text-slate-500">Optional, but helpful for faster approval. PNG, JPG, or WEBP up to 1 MB.</p>
                <input
                  name="screenshotFile"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="mt-3 block w-full text-sm text-slate-600 file:mr-4 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-800"
                />
              </div>
              <textarea name="notes" rows={5} placeholder="Optional note, payer name, or app used" className="w-full rounded-2xl border border-slate-300 px-4 py-3 outline-none focus:border-slate-950" />
              <button className="w-full rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800">
                Submit UPI proof
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
