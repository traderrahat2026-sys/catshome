export default function ShippingPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold">Shipping Information</h1>

        <p className="mb-10 leading-7 text-gray-400">
          We work to make sure your order reaches you safely and on time.
        </p>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Delivery Time</h2>
            <p className="leading-7 text-gray-400">
              Delivery time may vary depending on your location and product
              availability. You will receive the available delivery details
              during the ordering process.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Order Processing</h2>
            <p className="leading-7 text-gray-400">
              Orders are processed after the order information has been
              confirmed. Processing time may vary depending on the product.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Delivery Address</h2>
            <p className="leading-7 text-gray-400">
              Please make sure your delivery address and contact information
              are correct before placing your order.
            </p>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-xl font-semibold">Need Help?</h2>
            <p className="leading-7 text-gray-400">
              If you have any questions about your delivery, please contact
              our support team.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
