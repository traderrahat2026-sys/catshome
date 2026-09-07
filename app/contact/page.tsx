export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold">Contact Us</h1>

        <p className="mb-10 leading-7 text-gray-400">
          Have a question about an order, product, delivery, or anything else?
          Feel free to contact us.
        </p>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-lg font-semibold">Phone</h2>
            <p className="text-gray-400">+8801869506686</p>
            <p className="text-gray-400">+8801928156849</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
            <h2 className="mb-3 text-lg font-semibold">Email</h2>
            <p className="text-gray-400">forbussines@gmail.com</p>
            <p className="text-gray-400">gendatim125@gmail.com</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6 sm:col-span-2">
            <h2 className="mb-3 text-lg font-semibold">Location</h2>
            <p className="text-gray-400">Savar, Dhaka, Bangladesh</p>
          </div>
        </div>
      </div>
    </main>
  );
}
