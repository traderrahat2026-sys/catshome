import Image from "next/image";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-auto bg-black text-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">

          {/* CATS HOME BRAND */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center"
              aria-label="CATS HOME"
            >
              <Image
                src="/cats-home-logo-transparent.png"
                alt="CATS HOME"
                width={145}
                height={55}
                unoptimized
                className="block h-[55px] w-auto object-contain"
              />
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-6 text-gray-400">
              Everything your cat deserves. Discover quality cat food,
              litter, toys, accessories and everyday essentials at CATS HOME.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Shop
            </h3>

            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <Link
                href="/shop"
                className="transition hover:text-white"
              >
                All Products
              </Link>

              <Link
                href="/category/cat-food"
                className="transition hover:text-white"
              >
                Cat Food
              </Link>

              <Link
                href="/category/cat-litter"
                className="transition hover:text-white"
              >
                Cat Litter
              </Link>

              <Link
                href="/category/cat-toys"
                className="transition hover:text-white"
              >
                Cat Toys
              </Link>

              <Link
                href="/special-offers"
                className="transition hover:text-white"
              >
                Special Offers
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Categories
            </h3>

            <div className="flex flex-col gap-3 text-sm text-gray-400">
              <Link
                href="/category/wet-food"
                className="transition hover:text-white"
              >
                Wet Food
              </Link>

              <Link
                href="/category/cat-accessories"
                className="transition hover:text-white"
              >
                Accessories
              </Link>

              <Link
                href="/category/grooming"
                className="transition hover:text-white"
              >
                Grooming
              </Link>

              <Link
                href="/hot-sale"
                className="transition hover:text-white"
              >
                Hot Sale
              </Link>

              <Link
                href="/categories"
                className="transition hover:text-white"
              >
                All Categories
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider">
              Contact Us
            </h3>

            <div className="space-y-3 text-sm text-gray-400">
              <a
                href="tel:+8801869506686"
                className="block transition hover:text-white"
              >
                +880 1869 506686
              </a>

              <a
                href="tel:+8801928156849"
                className="block transition hover:text-white"
              >
                +880 1928 156849
              </a>

              <a
                href="mailto:forbussines@gmail.com"
                className="block break-all transition hover:text-white"
              >
                forbussines@gmail.com
              </a>

              <a
                href="mailto:gendatim125@gmail.com"
                className="block break-all transition hover:text-white"
              >
                gendatim125@gmail.com
              </a>

              <p>Savar, Dhaka, Bangladesh</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-10 flex flex-col gap-4 border-t border-white/10 pt-6 text-sm text-gray-500 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} CATS HOME. All rights reserved.
          </p>

          <div className="flex gap-5">
            <Link
              href="/privacy-policy"
              className="transition hover:text-white"
            >
              Privacy Policy
            </Link>

            <Link
              href="/terms"
              className="transition hover:text-white"
            >
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}