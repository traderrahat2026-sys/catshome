import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import {
  categories,
  getProductsByCategory,
  getHotSaleProducts,
  getGadgetProducts,
} from "@/lib/products";

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;

  const currentSlug = slug.toLowerCase();

  let title = "";
  let description = "";
  let products = [];

  // HOT SALE
  if (currentSlug === "hot-sale") {
    title = "🔥 Hot Sale";
    description = "Our hottest products with special deals.";
    products = getHotSaleProducts();
  }

  // GADGETS
  else if (currentSlug === "gadgets") {
    title = "Gadgets";
    description = "Smart and useful gadgets for everyday life.";
    products = getGadgetProducts();
  }

  // NORMAL CATEGORIES
  else {
    const category = categories.find(
      (item) => item.slug === currentSlug
    );

    if (!category) {
      return (
        <main className="min-h-screen bg-zinc-50 px-4 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-3xl font-black text-zinc-900">
              Category Not Found
            </h1>

            <p className="mt-3 text-zinc-500">
              This category does not exist.
            </p>

            <Link
              href="/"
              className="mt-6 inline-flex rounded-xl bg-black px-6 py-3 font-bold text-white"
            >
              Back to Home
            </Link>
          </div>
        </main>
      );
    }

    title = category.name;
    description = `Explore our ${category.name.toLowerCase()} collection.`;
    products = getProductsByCategory(category.name);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Breadcrumb */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-sm font-semibold text-zinc-500 hover:text-black"
          >
            Home
          </Link>

          <span className="mx-2 text-zinc-400">
            /
          </span>

          <span className="text-sm font-semibold text-zinc-900">
            {title}
          </span>
        </div>

        {/* Heading */}
        <div className="mb-10">
          <h1 className="text-4xl font-black tracking-tight text-zinc-950 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-3 max-w-2xl text-zinc-500">
            {description}
          </p>
        </div>

        {/* Products */}
        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center">
            <h2 className="text-2xl font-black text-zinc-900">
              No Products Found
            </h2>

            <p className="mt-2 text-zinc-500">
              There are currently no products in this section.
            </p>
          </div>
        )}

      </div>
    </main>
  );
}