import type { PaymentSettings } from "@academy/db";

function cleanEnv(value: string | undefined) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}

export interface ManualPaymentConfig {
  upiId?: string;
  payeeName?: string;
  qrCodeUrl?: string;
  note?: string;
  upiIntentUrl?: string;
}

function buildConfig(base: Omit<ManualPaymentConfig, "upiIntentUrl">, amountInr?: number) {
  const { upiId, payeeName, qrCodeUrl, note } = base;

  let upiIntentUrl: string | undefined;
  if (upiId) {
    const params = new URLSearchParams({
      pa: upiId
    });

    if (payeeName) {
      params.set("pn", payeeName);
    }

    if (typeof amountInr === "number" && Number.isFinite(amountInr) && amountInr > 0) {
      params.set("am", amountInr.toFixed(2));
      params.set("cu", "INR");
    }

    if (note) {
      params.set("tn", note);
    }

    upiIntentUrl = `upi://pay?${params.toString()}`;
  }

  return {
    upiId,
    payeeName,
    qrCodeUrl,
    note,
    upiIntentUrl
  };
}

export function getManualPaymentConfig(amountInr?: number): ManualPaymentConfig {
  return buildConfig(
    {
      upiId: cleanEnv(process.env.PAYMENT_UPI_ID),
      payeeName: cleanEnv(process.env.PAYMENT_UPI_PAYEE),
      qrCodeUrl: cleanEnv(process.env.PAYMENT_UPI_QR_URL),
      note: cleanEnv(process.env.PAYMENT_UPI_NOTE)
    },
    amountInr
  );
}

export function getResolvedPaymentConfig(settings: PaymentSettings | null | undefined, amountInr?: number): ManualPaymentConfig {
  const envConfig = getManualPaymentConfig();
  return buildConfig(
    {
      upiId: settings?.upiId ?? envConfig.upiId,
      payeeName: settings?.payeeName ?? envConfig.payeeName,
      qrCodeUrl: settings?.qrCodeUrl ?? envConfig.qrCodeUrl,
      note: settings?.note ?? envConfig.note
    },
    amountInr
  );
}
