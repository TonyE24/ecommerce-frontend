import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  return (
    <section>
      <h1 className="mb-6 text-3xl font-bold">Finalizar compra</h1>
      <CheckoutForm
        publishableKey={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? null}
      />
    </section>
  );
}
