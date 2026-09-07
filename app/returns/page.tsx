export default function ReturnsPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold">Returns & Refunds</h1>

        <p className="mb-10 leading-7 text-gray-400">
          We want you to be satisfied with your purchase. If there is a problem
          with your order, please contact us.
        </p>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Return Request</h2>
            <p className="leading-7 text-gray-400">
              If you receive a damaged, incorrect, or defective product, please
              contact us as soon as possible with your order details.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Product Condition</h2>
            <p className="leading-7 text-gray-400">
              Returned products should be in acceptable condition and include
              the relevant packaging and accessories when applicable.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Refunds</h2>
            <p className="leading-7 text-gray-400">
              Once a return is reviewed and approved, the refund process will
              be handled according to the applicable order and payment method.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Contact Us</h2>
            <p className="leading-7 text-gray-400">
              For return or refund questions, please contact our support team
              through the Contact page.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
