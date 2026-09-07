export default function FAQPage() {
  const faqs = [
    {
      q: "How can I place an order?",
      a: "Browse our products, choose the product you want, add it to your cart, and complete the checkout process.",
    },
    {
      q: "How can I contact you?",
      a: "You can contact our support team through the Contact page. We will help you with your questions and orders.",
    },
    {
      q: "How long does delivery take?",
      a: "Delivery time depends on your location. Most orders are delivered within the estimated delivery time shown during checkout.",
    },
    {
      q: "Can I return my order?",
      a: "Yes. If your order meets our return conditions, you can request a return. Please check our Returns page for details.",
    },
    {
      q: "Can I cancel my order?",
      a: "If your order has not been shipped yet, contact us as soon as possible to request cancellation.",
    },
  ];

  return (
    <main className="min-h-screen bg-black px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-4xl font-bold">Frequently Asked Questions</h1>
        <p className="mb-10 text-gray-400">
          Find answers to some of the most common questions about our store.
        </p>

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-6"
            >
              <h2 className="mb-3 text-lg font-semibold">{faq.q}</h2>
              <p className="leading-7 text-gray-400">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
