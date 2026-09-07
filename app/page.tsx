"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ================================================================
   TYPES
================================================================ */

type ProductUnit = "kg" | "piece";

type ProductSection =
  | "hot-sale"
  | "accessories"
  | "regular"
  | "offers";

type PaymentMethod =
  | "cod"
  | "bkash"
  | "nagad"
  | "rocket"
  | "";

type DeliveryArea =
  | "savar-city"
  | "outside-savar"
  | "";

type DatabaseProduct = {
  id: number;
  title?: string;
  description?: string;
  category?: string;
  image_url?: string;
  image_urls?: string[];
  regular_price?: number | string;
  discount?: number | string;
  offer_price?: number | string;
  stock?: number | string;
  has_colours?: boolean | string;
  colours?: string[];
  has_sizes?: boolean | string;
  sizes?: string[];

  is_gadget?: boolean | string;
  is_hot_sale?: boolean | string;
  is_offer?: boolean | string;

  created_at?: string;
};

type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice?: number;
  image: string;
  description: string;
  section: ProductSection;

  stock: number;

  colours: string[];
  sizes: string[];

  isGadget: boolean;
  isHotSale: boolean;
  isOffer: boolean;

  unit: ProductUnit;

  createdAt?: string;
};

type CartItem = Product & {
  quantity: number;
};

/* ================================================================
   DELIVERY SETTINGS
================================================================ */

const SAVAR_CITY_DELIVERY_CHARGE = 0;
const OUTSIDE_SAVAR_DELIVERY_CHARGE = 140;

/* ================================================================
   BASIC HELPERS
================================================================ */

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);

  return Number.isFinite(number) ? number : fallback;
}

function booleanValue(value: unknown) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value === 1;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    return (
      normalized === "true" ||
      normalized === "1" ||
      normalized === "yes" ||
      normalized === "on"
    );
  }

  return false;
}

/* ================================================================
   QUANTITY HELPERS
================================================================ */

/*
 * Food/Litter:
 * minimum 0.5 kg
 * step 0.5 kg
 *
 * Piece:
 * minimum 1 piece
 * step 1 piece
 */

function getMinimumQuantity(product: Product) {
  return product.unit === "kg" ? 0.5 : 1;
}

function getQuantityStep(product: Product) {
  return product.unit === "kg" ? 0.5 : 1;
}

/*
 * If stock is 2.3 kg, customer can select maximum 2 kg.
 * If stock is 5 kg, maximum is 5 kg.
 */
function getMaximumQuantity(product: Product) {
  if (product.stock <= 0) {
    return 0;
  }

  if (product.unit === "kg") {
    return Math.floor(product.stock * 2) / 2;
  }

  return Math.floor(product.stock);
}

/*
 * Prevent floating point values such as:
 * 0.5 + 0.5 = 1
 * 1 + 0.5 = 1.5
 */
function roundQuantity(value: number) {
  return Math.round(value * 2) / 2;
}

function formatQuantity(
  quantity: number,
  unit: ProductUnit
) {
  if (unit === "kg") {
    return Number(quantity.toFixed(1)).toString();
  }

  return String(Math.round(quantity));
}

function getProductTotal(
  product: Product,
  quantity: number
) {
  return Number(
    (product.price * quantity).toFixed(2)
  );
}

function formatPrice(value: number) {
  return Number(value.toFixed(2)).toLocaleString();
}

/* ================================================================
   IMAGE
================================================================ */

function getProductImage(product: DatabaseProduct) {
  if (
    product.image_url &&
    product.image_url.trim()
  ) {
    return product.image_url.trim();
  }

  if (
    Array.isArray(product.image_urls) &&
    product.image_urls.length > 0 &&
    product.image_urls[0]
  ) {
    return product.image_urls[0];
  }

  return "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?auto=format&fit=crop&w=900&q=85";
}

/* ================================================================
   CATEGORY
================================================================ */

function normalizeCategory(value = "") {
  return value
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

function getCategories(category: string) {
  return category
    .split(/[,|/&]+/)
    .map((item) => normalizeCategory(item))
    .filter(Boolean);
}

function hasCategory(
  product: Product,
  category: string
) {
  const target = normalizeCategory(category);
  const productCategories = getCategories(
    product.category
  );

  return productCategories.some((item) => {
    if (item === target) {
      return true;
    }

    if (
      item.includes(target) ||
      target.includes(item)
    ) {
      return true;
    }

    const compactItem = item.replace(/\s/g, "");
    const compactTarget = target.replace(/\s/g, "");

    return compactItem === compactTarget;
  });
}

function hasAnyCategory(
  product: Product,
  values: string[]
) {
  return values.some((value) =>
    hasCategory(product, value)
  );
}

/* ================================================================
   UNIT
================================================================ */

function getProductUnit(
  category = ""
): ProductUnit {
  const categories = getCategories(category);

  const weightCategories = [
    "cat food",
    "wet food",
    "cat litter",
    "food",
    "litter",
  ];

  const isWeightProduct =
    weightCategories.some(
      (weightCategory) =>
        categories.some(
          (item) =>
            item === weightCategory ||
            item.includes(weightCategory) ||
            weightCategory.includes(item)
        )
    );

  return isWeightProduct ? "kg" : "piece";
}

/* ================================================================
   PRODUCT CONVERTER
================================================================ */

function convertProduct(
  product: DatabaseProduct
): Product {
  const regularPrice = numberValue(
    product.regular_price
  );

  const offerPrice = numberValue(
    product.offer_price
  );

  const discount = numberValue(
    product.discount
  );

  let price = regularPrice;

  if (
    offerPrice > 0 &&
    offerPrice < regularPrice
  ) {
    price = offerPrice;
  } else if (
    discount > 0 &&
    regularPrice > 0
  ) {
    price = Math.round(
      regularPrice -
        (regularPrice * discount) / 100
    );
  }

  const productCategory =
    product.category?.trim() ||
    "Cat Essentials";

  const productCategories =
    getCategories(productCategory);

  const isGadget =
    booleanValue(product.is_gadget) ||
    productCategories.includes("gadget") ||
    productCategories.includes("gadgets");

  const isHotSale =
    booleanValue(product.is_hot_sale);

  const isOffer =
    booleanValue(product.is_offer) ||
    (offerPrice > 0 &&
      offerPrice < regularPrice) ||
    discount > 0;

  let section: ProductSection = "regular";

  if (isGadget) {
    section = "accessories";
  } else if (isHotSale) {
    section = "hot-sale";
  } else if (isOffer) {
    section = "offers";
  }

  return {
    id: Number(product.id),

    name:
      product.title?.trim() ||
      "Untitled Product",

    category: productCategory,

    /*
     * IMPORTANT:
     * For kg products this price is the 1 KG base price.
     */
    price,

    oldPrice:
      price < regularPrice
        ? regularPrice
        : undefined,

    image: getProductImage(product),

    description:
      product.description?.trim() ||
      "Premium product for your beloved cat.",

    section,

    /*
     * For food/litter, stock is interpreted as KG.
     * For accessories/toys, stock is pieces.
     */
    stock: numberValue(product.stock),

    colours: Array.isArray(product.colours)
      ? product.colours
      : [],

    sizes: Array.isArray(product.sizes)
      ? product.sizes
      : [],

    isGadget,

    isHotSale,

    isOffer,

    unit: getProductUnit(
      productCategory
    ),

    createdAt: product.created_at,
  };
}

/* ================================================================
   CATEGORIES
================================================================ */

const categories = [
  {
    name: "Cat Food",
    slug: "cat-food",
    description: "Nutritious everyday meals",
    image:
      "https://images.unsplash.com/photo-1548366086-7f1b76106622?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Wet Food",
    slug: "wet-food",
    description: "Delicious meals cats love",
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Cat Litter",
    slug: "cat-litter",
    description: "Fresh & clean every day",
    image:
      "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Cat Toys",
    slug: "cat-toys",
    description: "Fun, play & enrichment",
    image:
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Accessories",
    slug: "cat-accessories",
    description: "Premium essentials",
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85",
  },
  {
    name: "Grooming",
    slug: "grooming",
    description: "Care for a healthy coat",
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=900&q=85",
  },
];

/* ================================================================
   PAYMENT HELPERS
================================================================ */

function getPaymentName(
  paymentMethod: PaymentMethod
) {
  if (paymentMethod === "bkash") {
    return "bKash";
  }

  if (paymentMethod === "nagad") {
    return "Nagad";
  }

  if (paymentMethod === "rocket") {
    return "Rocket";
  }

  if (paymentMethod === "cod") {
    return "Cash on Delivery";
  }

  return "";
}

function getPaymentNumber(
  paymentMethod: PaymentMethod
) {
  if (paymentMethod === "bkash") {
    return "01869506686";
  }

  if (paymentMethod === "nagad") {
    return "01928156849";
  }

  if (paymentMethod === "rocket") {
    return "01619952823";
  }

  return "";
}

function isMobilePayment(
  paymentMethod: PaymentMethod
) {
  return (
    paymentMethod === "bkash" ||
    paymentMethod === "nagad" ||
    paymentMethod === "rocket"
  );
}

/* ================================================================
   DELIVERY HELPERS
================================================================ */

function getDeliveryCharge(
  area: DeliveryArea
) {
  if (area === "outside-savar") {
    return OUTSIDE_SAVAR_DELIVERY_CHARGE;
  }

  return SAVAR_CITY_DELIVERY_CHARGE;
}

function getDeliveryAreaName(
  area: DeliveryArea
) {
  if (area === "savar-city") {
    return "Savar City";
  }

  if (area === "outside-savar") {
    return "Outside Savar City";
  }

  return "";
}

/* ================================================================
   HOMEPAGE
================================================================ */

export default function HomePage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [categoryImages, setCategoryImages] =
    useState<Record<string, string>>({});

  const [productsLoading, setProductsLoading] =
    useState(true);

  const [productsError, setProductsError] =
    useState("");

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [search, setSearch] =
    useState("");

  const [selectedProduct, setSelectedProduct] =
    useState<Product | null>(null);

  /*
   * KG products start from 0.5.
   * Piece products start from 1.
   */
  const [productQuantity, setProductQuantity] =
    useState(0.5);

  const [cartOpen, setCartOpen] =
    useState(false);

  const [buyNowProduct, setBuyNowProduct] =
    useState<Product | null>(null);

  const [buyNowQuantity, setBuyNowQuantity] =
    useState(0.5);

  const [paymentMethod, setPaymentMethod] =
    useState<PaymentMethod>("");

  const [deliveryArea, setDeliveryArea] =
    useState<DeliveryArea>("");

  const [customerName, setCustomerName] =
    useState("");

  const [customerPhone, setCustomerPhone] =
    useState("");

  const [customerAddress, setCustomerAddress] =
    useState("");

  const [customerComment, setCustomerComment] =
    useState("");

  const [transactionId, setTransactionId] =
    useState("");

  const [orderPlaced, setOrderPlaced] =
    useState(false);

  /* ==============================================================
     LOAD CATEGORY IMAGES
  ============================================================== */

  useEffect(() => {
    async function loadCategoryImages() {
      const { data, error } = await supabase
        .from("categories")
        .select("slug,name,image_url");

      if (error) {
        console.error("CATEGORY IMAGE LOAD ERROR:", error);
        return;
      }

      const imageMap: Record<string, string> = {};

      for (const category of data || []) {
        const slug = String(category.slug || "")
          .trim()
          .toLowerCase();

        const name = String(category.name || "")
          .trim()
          .toLowerCase();

        const image = String(category.image_url || "").trim();

        if (image) {
          if (slug) imageMap[slug] = image;
          if (name) imageMap[name] = image;
        }
      }

      setCategoryImages(imageMap);
    }

    loadCategoryImages();
  }, []);

  /* ============================================================== 
     LOAD PRODUCTS
  ============================================================== */

  async function loadProducts() {
    try {
      setProductsLoading(true);
      setProductsError("");

      const response = await fetch(
        "/api/products",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const text =
        await response.text();

      let data: unknown = [];

      try {
        data = text
          ? JSON.parse(text)
          : [];
      } catch {
        throw new Error(
          "Invalid products API response."
        );
      }

      if (!response.ok) {
        if (
          typeof data === "object" &&
          data !== null &&
          "error" in data
        ) {
          throw new Error(
            String(
              (
                data as {
                  error?: string;
                }
              ).error ||
                "Failed to load products."
            )
          );
        }

        throw new Error(
          `Failed to load products. (${response.status})`
        );
      }

      let rows: DatabaseProduct[] =
        [];

      if (Array.isArray(data)) {
        rows =
          data as DatabaseProduct[];
      } else if (
        typeof data === "object" &&
        data !== null
      ) {
        const objectData =
          data as {
            products?: DatabaseProduct[];
            data?: DatabaseProduct[];
          };

        if (
          Array.isArray(
            objectData.products
          )
        ) {
          rows =
            objectData.products;
        } else if (
          Array.isArray(
            objectData.data
          )
        ) {
          rows =
            objectData.data;
        }
      }

      const converted =
        rows.map(convertProduct);

      console.log(
        "CATS HOME PRODUCTS:",
        converted
      );

      setProducts(converted);
    } catch (error) {
      console.error(
        "SHOP PRODUCTS LOAD ERROR:",
        error
      );

      setProducts([]);

      setProductsError(
        error instanceof Error
          ? error.message
          : "Failed to load products."
      );
    } finally {
      setProductsLoading(false);
    }
  }

  /* ============================================================== 
     INITIAL LOAD
  ============================================================== */

  useEffect(() => {
    loadProducts();

    const interval = setInterval(
      loadProducts,
      30000
    );

    return () =>
      clearInterval(interval);
  }, []);

  /* ============================================================== 
     CATEGORY PRODUCTS
  ============================================================== */

  const catFoodProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            hasAnyCategory(product, [
              "cat food",
              "catfood",
              "dry food",
              "dry cat food",
            ])
        ),
      [products]
    );

  const wetFoodProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            hasAnyCategory(product, [
              "wet food",
              "wetfood",
              "wet cat food",
            ])
        ),
      [products]
    );

  const catLitterProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            hasAnyCategory(product, [
              "cat litter",
              "catlitter",
              "litter",
            ])
        ),
      [products]
    );

  const catToyProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            hasAnyCategory(product, [
              "cat toys",
              "cat toy",
              "cattoys",
              "toy",
              "toys",
            ])
        ),
      [products]
    );

  const groomingProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            hasAnyCategory(product, [
              "grooming",
              "cat grooming",
              "grooming products",
            ])
        ),
      [products]
    );

  const catAccessoriesProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            hasAnyCategory(product, [
              "cat accessories",
              "cat accessory",
              "accessories",
              "accessory",
            ]) || product.isGadget
        ),
      [products]
    );

  /* ============================================================== 
     HOT SALE
  ============================================================== */

  const hotSaleProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.isHotSale
        ),
      [products]
    );

  /* ============================================================== 
     OFFERS
  ============================================================== */

  const offerProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            product.isOffer
        ),
      [products]
    );

  /* ============================================================== 
     POPULAR
  ============================================================== */

  const regularProducts =
    useMemo(
      () =>
        products.filter(
          (product) =>
            !product.isHotSale &&
            !product.isOffer
        ),
      [products]
    );

  const popularProducts =
    regularProducts.length > 0
      ? regularProducts
      : products;

  /* ============================================================== 
     SEARCH
  ============================================================== */

  const filteredProducts =
    useMemo(() => {
      const keyword =
        search
          .trim()
          .toLowerCase();

      if (!keyword) {
        return products;
      }

      return products.filter(
        (product) =>
          product.name
            .toLowerCase()
            .includes(keyword) ||
          product.category
            .toLowerCase()
            .includes(keyword) ||
          product.description
            .toLowerCase()
            .includes(keyword)
      );
    }, [products, search]);

  /* ============================================================== 
     TOTALS
  ============================================================== */

  const cartTotal =
    cart.reduce(
      (total, item) =>
        total +
        getProductTotal(
          item,
          item.quantity
        ),
      0
    );

  const cartCount =
    cart.reduce(
      (total, item) =>
        total + item.quantity,
      0
    );

  const buyNowTotal =
    buyNowProduct
      ? getProductTotal(
          buyNowProduct,
          buyNowQuantity
        )
      : 0;

  const deliveryCharge =
    getDeliveryCharge(
      deliveryArea
    );

  const orderTotal =
    buyNowTotal +
    deliveryCharge;

  /* ============================================================== 
     CART
  ============================================================== */

  function addToCart(
    product: Product,
    quantity?: number
  ) {
    const minimum =
      getMinimumQuantity(product);

    const step =
      getQuantityStep(product);

    const maximum =
      getMaximumQuantity(product);

    /*
     * Food product with less than 0.5kg
     * cannot be ordered.
     */
    if (
      product.stock < minimum ||
      maximum < minimum
    ) {
      alert(
        `This product does not have enough stock for the minimum order of ${formatQuantity(
          minimum,
          product.unit
        )} ${product.unit}.`
      );

      return;
    }

    /*
     * If no quantity is supplied:
     * kg = 0.5
     * piece = 1
     */
    const requestedQuantity =
      quantity === undefined
        ? minimum
        : quantity;

    let safeQuantity =
      roundQuantity(
        requestedQuantity
      );

    if (
      safeQuantity < minimum
    ) {
      safeQuantity = minimum;
    }

    if (
      safeQuantity > maximum
    ) {
      safeQuantity = maximum;
    }

    /*
     * Make sure kg quantity stays on
     * 0.5 increments.
     */
    if (product.unit === "kg") {
      safeQuantity =
        Math.floor(
          safeQuantity * 2
        ) / 2;
    } else {
      safeQuantity =
        Math.floor(safeQuantity);
    }

    if (
      safeQuantity < minimum
    ) {
      alert(
        "Not enough stock available."
      );

      return;
    }

    setCart(
      (currentCart) => {
        const existingItem =
          currentCart.find(
            (item) =>
              item.id ===
              product.id
          );

        if (existingItem) {
          let newQuantity =
            roundQuantity(
              existingItem.quantity +
                safeQuantity
            );

          if (
            newQuantity >
            maximum
          ) {
            newQuantity =
              maximum;
          }

          if (
            newQuantity <=
            existingItem.quantity
          ) {
            alert(
              `Maximum available stock is ${formatQuantity(
                maximum,
                product.unit
              )} ${product.unit}.`
            );

            return currentCart;
          }

          return currentCart.map(
            (item) =>
              item.id === product.id
                ? {
                    ...item,
                    quantity:
                      newQuantity,
                  }
                : item
          );
        }

        return [
          ...currentCart,
          {
            ...product,
            quantity:
              safeQuantity,
          },
        ];
      }
    );

    setCartOpen(true);
  }

  function updateCartQuantity(
    id: number,
    quantity: number
  ) {
    setCart(
      (currentCart) =>
        currentCart.flatMap(
          (item) => {
            if (
              item.id !== id
            ) {
              return [item];
            }

            const minimum =
              getMinimumQuantity(
                item
              );

            const maximum =
              getMaximumQuantity(
                item
              );

            const nextQuantity =
              roundQuantity(
                quantity
              );

            /*
             * Clicking minus below minimum
             * removes the item.
             */
            if (
              nextQuantity <
              minimum
            ) {
              return [];
            }

            if (
              maximum < minimum
            ) {
              return [];
            }

            if (
              nextQuantity >
              maximum
            ) {
              alert(
                `Only ${formatQuantity(
                  maximum,
                  item.unit
                )} ${item.unit} available.`
              );

              return [item];
            }

            return [
              {
                ...item,
                quantity:
                  nextQuantity,
              },
            ];
          }
        )
    );
  }

  function removeFromCart(
    id: number
  ) {
    setCart(
      (currentCart) =>
        currentCart.filter(
          (item) =>
            item.id !== id
        )
    );
  }

  /* ============================================================== 
     PRODUCT MODAL
  ============================================================== */

  function openProduct(
    product: Product
  ) {
    const minimum =
      getMinimumQuantity(product);

    const maximum =
      getMaximumQuantity(product);

    const initialQuantity =
      maximum >= minimum
        ? minimum
        : 0;

    setSelectedProduct(
      product
    );

    setProductQuantity(
      initialQuantity
    );
  }

  function closeProduct() {
    setSelectedProduct(null);
    setProductQuantity(0.5);
  }

  /* ============================================================== 
     BUY NOW
  ============================================================== */

  function openBuyNow(
    product: Product,
    quantity?: number
  ) {
    const minimum =
      getMinimumQuantity(product);

    const maximum =
      getMaximumQuantity(product);

    if (
      product.stock < minimum ||
      maximum < minimum
    ) {
      alert(
        `This product does not have enough stock for the minimum order of ${formatQuantity(
          minimum,
          product.unit
        )} ${product.unit}.`
      );

      return;
    }

    let safeQuantity =
      quantity === undefined
        ? minimum
        : roundQuantity(quantity);

    if (
      safeQuantity < minimum
    ) {
      safeQuantity = minimum;
    }

    if (
      safeQuantity > maximum
    ) {
      safeQuantity = maximum;
    }

    if (product.unit === "kg") {
      safeQuantity =
        Math.floor(
          safeQuantity * 2
        ) / 2;
    } else {
      safeQuantity =
        Math.floor(
          safeQuantity
        );
    }

    if (
      safeQuantity < minimum
    ) {
      alert(
        "Not enough stock available."
      );

      return;
    }

    setBuyNowProduct(
      product
    );

    setBuyNowQuantity(
      safeQuantity
    );

    setPaymentMethod("");
    setDeliveryArea("");

    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerComment("");

    setTransactionId("");

    setOrderPlaced(false);
  }

  function closeBuyNow() {
    setBuyNowProduct(null);
    setBuyNowQuantity(0.5);

    setPaymentMethod("");
    setDeliveryArea("");

    setCustomerName("");
    setCustomerPhone("");
    setCustomerAddress("");
    setCustomerComment("");

    setTransactionId("");

    setOrderPlaced(false);
  }

  /* ============================================================== 
     PLACE ORDER
  ============================================================== */

  async function placeOrder() {
    if (!buyNowProduct) {
      return;
    }

    const minimum =
      getMinimumQuantity(
        buyNowProduct
      );

    const maximum =
      getMaximumQuantity(
        buyNowProduct
      );

    if (
      buyNowQuantity <
        minimum ||
      buyNowQuantity >
        maximum
    ) {
      alert(
        `Please select a valid quantity between ${formatQuantity(
          minimum,
          buyNowProduct.unit
        )} and ${formatQuantity(
          maximum,
          buyNowProduct.unit
        )} ${buyNowProduct.unit}.`
      );

      return;
    }

    if (!deliveryArea) {
      alert(
        "Please select your delivery location."
      );

      return;
    }

    if (!paymentMethod) {
      alert(
        "Please select a payment method."
      );

      return;
    }

    if (
      !customerName.trim() ||
      !customerPhone.trim() ||
      !customerAddress.trim()
    ) {
      alert(
        "Please fill in Name, Phone and Full Delivery Address."
      );

      return;
    }

    if (
      isMobilePayment(
        paymentMethod
      ) &&
      !transactionId.trim()
    ) {
      alert(
        `Please enter your ${getPaymentName(
          paymentMethod
        )} Transaction ID.`
      );

      return;
    }

    if (
      buyNowProduct.stock > 0 &&
      buyNowQuantity >
        buyNowProduct.stock
    ) {
      alert(
        `Only ${formatQuantity(
          buyNowProduct.stock,
          buyNowProduct.unit
        )} ${buyNowProduct.unit} available.`
      );

      return;
    }

    try {
      /*
       * Backend-compatible order ID.
       * DO NOT change this to CATS HOME.
       */
      const orderId =
        `CATS HOME-${Date.now()}`;

      const selectedDeliveryArea =
        getDeliveryAreaName(
          deliveryArea
        );

      const finalAddress =
        `${selectedDeliveryArea}\n${customerAddress.trim()}`;

      const finalComment = [
        customerComment.trim(),
        `Delivery Area: ${selectedDeliveryArea}`,
        `Delivery Charge: ৳${deliveryCharge}`,
        `Quantity: ${formatQuantity(
          buyNowQuantity,
          buyNowProduct.unit
        )} ${buyNowProduct.unit}`,
        `Base Price: ৳${formatPrice(
          buyNowProduct.price
        )} per ${buyNowProduct.unit}`,
      ]
        .filter(Boolean)
        .join("\n");

      const response =
        await fetch(
          "/api/orders",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              order_id:
                orderId,

              product_id:
                buyNowProduct.id,

              product_title:
                buyNowProduct.name,

              /*
               * For food/litter this can now
               * be 0.5, 1, 1.5, 2, etc.
               */
              quantity:
                buyNowQuantity,

              customer_name:
                customerName.trim(),

              phone:
                customerPhone.trim(),

              /*
               * Product total + delivery.
               */
              amount:
                orderTotal,

              payment_status:
                "Pending",

              order_status:
                "Order Placed",

              payment_method:
                paymentMethod,

              transaction_id:
                isMobilePayment(
                  paymentMethod
                )
                  ? transactionId.trim()
                  : "",

              address:
                finalAddress,

              comment:
                finalComment,
            }),
          }
        );

      const responseText =
        await response.text();

      let data: {
        success?: boolean;
        error?: string;
      } = {};

      try {
        data = responseText
          ? JSON.parse(
              responseText
            )
          : {};
      } catch {
        console.error(
          "INVALID ORDER API RESPONSE:",
          responseText
        );

        alert(
          "Server returned an invalid response. Please check the terminal."
        );

        return;
      }

      if (!response.ok) {
        alert(
          data.error ||
            "Failed to place order."
        );

        return;
      }

      setOrderPlaced(true);

      setProducts(
        (currentProducts) =>
          currentProducts.map(
            (product) => {
              if (
                product.id !==
                buyNowProduct.id
              ) {
                return product;
              }

              return {
                ...product,

                stock:
                  product.stock > 0
                    ? Math.max(
                        0,
                        Number(
                          (
                            product.stock -
                            buyNowQuantity
                          ).toFixed(2)
                        )
                      )
                    : product.stock,
              };
            }
          )
      );
    } catch (error) {
      console.error(
        "PLACE ORDER ERROR:",
        error
      );

      alert(
        "Something went wrong while placing the order."
      );
    }
  }

  /* ============================================================== 
     UI
  ============================================================== */

  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#171717]">

      {/* ==========================================================
          NAVBAR
      ========================================================== */}

      <header className="sticky top-0 z-40 border-b border-black/10 bg-[#f8f6f1]/95 backdrop-blur-xl">

        <div className="mx-auto flex max-w-7xl items-center gap-5 px-5 py-4 lg:px-8">

          <Link
            href="/"
            className="shrink-0"
          >
            <div className="flex items-center gap-2">

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-xl">
                🐱
              </div>

              <div>

                <p className="text-xl font-black leading-none tracking-tight">
                  CATS
                  <span className="text-[#c89b3c]">
                    .
                  </span>
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-black/45">
                  HOME
                </p>

              </div>

            </div>
          </Link>

          <nav className="hidden items-center gap-5 lg:flex">

            <Link
              href="/"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Home
            </Link>

            <Link
              href="/category"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Categories
            </Link>

            <Link
              href="/category/cat-food"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Cat Food
            </Link>

            <Link
              href="/category/cat-litter"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Cat Litter
            </Link>

            <Link
              href="/category/cat-toys"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Toys
            </Link>

            <Link
              href="/category/hot-sale"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Hot Sale
            </Link>

            <Link
              href="/offers"
              className="text-sm font-bold hover:text-[#c89b3c]"
            >
              Offers
            </Link>

          </nav>

          <div className="ml-auto flex items-center gap-3">

            <div className="hidden md:block">

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Search cat products..."
                className="w-56 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[#c89b3c]"
              />

            </div>

            <button
              type="button"
              onClick={() =>
                setCartOpen(true)
              }
              className="relative rounded-full bg-black px-4 py-2.5 text-sm font-black text-white transition hover:bg-[#c89b3c] hover:text-black"
            >
              🛒

              {cartCount > 0 && (
                <span className="ml-2 rounded-full bg-[#c89b3c] px-2 py-0.5 text-xs text-black">
                  {formatQuantity(
                    cartCount,
                    "kg"
                  )}
                </span>
              )}

            </button>

          </div>

        </div>

      </header>

      {/* ==========================================================
          HERO
      ========================================================== */}

      <section className="relative overflow-hidden bg-[#111111] text-white">

        <div className="absolute -right-40 -top-40 h-96 w-96 rounded-full bg-[#c89b3c]/20 blur-3xl" />

        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-2 lg:px-8 lg:py-24">

          <div className="relative z-10">

            <p className="mb-5 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-bold uppercase tracking-[0.25em] text-[#d9b35c]">
              Premium Cat Care
            </p>

            <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight md:text-7xl">
              Everything Your Cat
              <span className="block text-[#d9b35c]">
                Deserves.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-white/60 md:text-lg">
              Premium cat food,
              litter, toys and
              accessories —
              carefully selected
              for happy, healthy
              and spoiled cats.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">

              <Link
                href="/products"
                className="rounded-full bg-[#c89b3c] px-7 py-3.5 text-sm font-black text-black transition hover:scale-105"
              >
                SHOP NOW
              </Link>

              <Link
                href="/category/cat-food"
                className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold transition hover:border-[#c89b3c] hover:text-[#c89b3c]"
              >
                EXPLORE CAT FOOD
              </Link>

            </div>

            <div className="mt-10 flex flex-wrap gap-7 text-xs font-bold text-white/50">

              <span>
                ✓ Premium Products
              </span>

              <span>
                ✓ Fast Delivery
              </span>

              <span>
                ✓ Cat-Lover Approved
              </span>

            </div>

          </div>

          <div className="relative">

            <div className="absolute -inset-10 rounded-full bg-[#c89b3c]/10 blur-3xl" />

            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-2">

              <img
                src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1400&q=90"
                alt="Beautiful cat"
                loading="eager"
                fetchPriority="high"
                className="h-[420px] w-full rounded-[1.5rem] object-cover md:h-[520px]"
              />

              <div className="absolute bottom-7 left-7 right-7 rounded-2xl border border-white/10 bg-black/65 p-5 backdrop-blur-xl">

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#d9b35c]">
                  CATS HOME
                </p>

                <p className="mt-1 text-lg font-black">
                  Made for every cat.
                </p>

              </div>

            </div>

          </div>

        </div>

      </section>

      {/* ==========================================================
          ERROR
      ========================================================== */}

      {productsError && (
        <section className="mx-auto max-w-7xl px-5 pt-10 lg:px-8">

          <div className="flex items-center justify-between rounded-2xl border border-red-200 bg-red-50 px-5 py-4">

            <div>

              <p className="font-bold text-red-700">
                Products could not be loaded
              </p>

              <p className="mt-1 text-sm text-red-600">
                {productsError}
              </p>

            </div>

            <button
              type="button"
              onClick={loadProducts}
              className="rounded-xl bg-black px-4 py-2 text-sm font-bold text-white"
            >
              Retry
            </button>

          </div>

        </section>
      )}

      {/* ==========================================================
          SEARCH
      ========================================================== */}

      {search.trim() && (
        <section className="mx-auto max-w-7xl px-5 py-14 lg:px-8">

          <div className="mb-8 flex items-end justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b58a32]">
                Search
              </p>

              <h2 className="mt-2 text-3xl font-black">
                Results for “
                {search}
                ”
              </h2>

            </div>

            <button
              type="button"
              onClick={() =>
                setSearch("")
              }
              className="text-sm font-bold underline"
            >
              Clear
            </button>

          </div>

          {productsLoading ? (
            <ProductLoadingGrid />
          ) : filteredProducts.length ===
            0 ? (
            <EmptyProducts text="No cat products found." />
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

              {filteredProducts.map(
                (product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onOpen={openProduct}
                    onBuyNow={openBuyNow}
                    onAddToCart={addToCart}
                  />
                )
              )}

            </div>
          )}

        </section>
      )}

      {/* ==========================================================
          MAIN
      ========================================================== */}

      {!search.trim() && (
        <>

          {/* CATEGORIES */}

          <section
            id="categories"
            className="mx-auto max-w-7xl px-5 py-20 lg:px-8"
          >

            <SectionHeading
              eyebrow="Shop For Your Cat"
              title="Everything They Love"
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {categories.map(
                (category) => (
                  <Link
                    key={category.slug}
                    href={`/category/${category.slug}`}
                    className="group overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                  >

                    <div className="relative overflow-hidden">

                      <img
                        src={
                          categoryImages[category.slug] ||
                          categoryImages[category.name.toLowerCase()] ||
                          category.image
                        }
                        alt={category.name}
                        loading="lazy"
                        className="h-64 w-full object-cover transition duration-700 group-hover:scale-110"
                      />

                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      <span className="absolute bottom-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-black">
                        Shop Now
                      </span>

                    </div>

                    <div className="flex items-center justify-between p-5">

                      <div>

                        <span className="font-black">
                          {category.name}
                        </span>

                        <p className="mt-1 text-xs text-black/45">
                          {category.description}
                        </p>

                      </div>

                      <span className="text-xl text-[#b58a32] transition group-hover:translate-x-1">
                        →
                      </span>

                    </div>

                  </Link>
                )
              )}

            </div>

          </section>

          {/* CAT FOOD */}

          <CategoryProductSection
            eyebrow="Nutrition First"
            title="Cat Food"
            link="/category/cat-food"
            products={catFoodProducts}
            loading={productsLoading}
            onOpen={openProduct}
            onBuyNow={openBuyNow}
            onAddToCart={addToCart}
          />

          {/* WET FOOD */}

          <section className="bg-white py-20">

            <div className="mx-auto max-w-7xl px-5 lg:px-8">

              <CategoryProductSectionInner
                eyebrow="Tasty & Hydrating"
                title="Wet Food"
                link="/category/wet-food"
                products={wetFoodProducts}
                loading={productsLoading}
                onOpen={openProduct}
                onBuyNow={openBuyNow}
                onAddToCart={addToCart}
              />

            </div>

          </section>

          {/* CAT LITTER */}

          <CategoryProductSection
            eyebrow="Clean Home"
            title="Cat Litter"
            link="/category/cat-litter"
            products={catLitterProducts}
            loading={productsLoading}
            onOpen={openProduct}
            onBuyNow={openBuyNow}
            onAddToCart={addToCart}
          />

          {/* CAT TOYS */}

          <section className="bg-white py-20">

            <div className="mx-auto max-w-7xl px-5 lg:px-8">

              <CategoryProductSectionInner
                eyebrow="Play Time"
                title="Cat Toys"
                link="/category/cat-toys"
                products={catToyProducts}
                loading={productsLoading}
                onOpen={openProduct}
                onBuyNow={openBuyNow}
                onAddToCart={addToCart}
              />

            </div>

          </section>

          {/* ACCESSORIES */}

          <CategoryProductSection
            eyebrow="Premium Essentials"
            title="Cat Accessories"
            link="/category/cat-accessories"
            products={
              catAccessoriesProducts
            }
            loading={productsLoading}
            onOpen={openProduct}
            onBuyNow={openBuyNow}
            onAddToCart={addToCart}
          />

          {/* GROOMING */}

          <section className="bg-white py-20">

            <div className="mx-auto max-w-7xl px-5 lg:px-8">

              <CategoryProductSectionInner
                eyebrow="Care & Comfort"
                title="Grooming"
                link="/category/grooming"
                products={groomingProducts}
                loading={productsLoading}
                onOpen={openProduct}
                onBuyNow={openBuyNow}
                onAddToCart={addToCart}
              />

            </div>

          </section>

          {/* HOT SALE */}

          <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">

            <SectionHeading
              eyebrow="Limited Time"
              title="Hot Sale"
              link="/category/hot-sale"
              linkText="View All"
            />

            {productsLoading ? (
              <ProductLoadingGrid />
            ) : hotSaleProducts.length ===
              0 ? (
              <EmptyProducts text="No hot sale products yet." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                {hotSaleProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpen={openProduct}
                      onBuyNow={openBuyNow}
                      onAddToCart={addToCart}
                    />
                  )
                )}

              </div>
            )}

          </section>

          {/* POPULAR */}

          <section className="bg-white py-20">

            <div className="mx-auto max-w-7xl px-5 lg:px-8">

              <SectionHeading
                eyebrow="Cat Favorites"
                title="Popular Products"
                link="/products"
                linkText="View All"
              />

              {productsLoading ? (
                <ProductLoadingGrid />
              ) : popularProducts.length ===
                0 ? (
                <EmptyProducts text="No products yet." />
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                  {popularProducts.map(
                    (product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onOpen={openProduct}
                        onBuyNow={openBuyNow}
                        onAddToCart={addToCart}
                      />
                    )
                  )}

                </div>
              )}

            </div>

          </section>

          {/* OFFERS */}

          <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">

            <SectionHeading
              eyebrow="Best Deals For Cat Parents"
              title="Special Offers"
              link="/offers"
              linkText="View All"
            />

            {productsLoading ? (
              <ProductLoadingGrid />
            ) : offerProducts.length ===
              0 ? (
              <EmptyProducts text="No special offers yet." />
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

                {offerProducts.map(
                  (product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onOpen={openProduct}
                      onBuyNow={openBuyNow}
                      onAddToCart={addToCart}
                    />
                  )
                )}

              </div>
            )}

          </section>

          {/* CTA */}

          <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">

            <div className="relative overflow-hidden rounded-[2rem] bg-black px-7 py-16 text-center text-white md:px-12">

              <div className="absolute -left-20 -top-20 h-60 w-60 rounded-full bg-[#c89b3c]/20 blur-3xl" />

              <div className="relative">

                <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#d9b35c]">
                  CATS HOME
                </p>

                <h2 className="mt-4 text-4xl font-black md:text-6xl">
                  Because They Deserve
                  <span className="block text-[#d9b35c]">
                    The Best.
                  </span>
                </h2>

                <p className="mx-auto mt-5 max-w-2xl text-white/60">
                  Premium food,
                  litter, toys and
                  everyday essentials
                  for your favorite
                  little companion.
                </p>

                <Link
                  href="/products"
                  className="mt-8 inline-flex rounded-full bg-[#c89b3c] px-8 py-4 text-sm font-black text-black transition hover:scale-105"
                >
                  SHOP CATS HOME
                </Link>

              </div>

            </div>

          </section>

        </>
      )}

      {/* ==========================================================
          FOOTER
      ========================================================== */}

      <footer className="bg-[#111111] text-white">

        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 md:grid-cols-4 lg:px-8">

          <div>

            <Link
              href="/"
              className="inline-flex items-center gap-2"
            >

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c89b3c] text-xl text-black">
                🐱
              </div>

              <div>

                <p className="text-2xl font-black">
                  CATS
                  <span className="text-[#c89b3c]">
                    .
                  </span>
                </p>

                <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-white/40">
                  HOME
                </p>

              </div>

            </Link>

            <p className="mt-5 max-w-xs text-sm leading-6 text-white/50">
              Premium cat food,
              litter, toys,
              grooming products
              and accessories for
              cats and the people
              who love them.
            </p>

          </div>

          <div>

            <h3 className="font-bold">
              Shop
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/60">

              <Link
                href="/products"
                className="block hover:text-[#c89b3c]"
              >
                All Products
              </Link>

              <Link
                href="/category/cat-food"
                className="block hover:text-[#c89b3c]"
              >
                Cat Food
              </Link>

              <Link
                href="/category/cat-litter"
                className="block hover:text-[#c89b3c]"
              >
                Cat Litter
              </Link>

              <Link
                href="/category/cat-toys"
                className="block hover:text-[#c89b3c]"
              >
                Cat Toys
              </Link>

              <Link
                href="/offers"
                className="block hover:text-[#c89b3c]"
              >
                Special Offers
              </Link>

            </div>

          </div>

          <div>

            <h3 className="font-bold">
              Categories
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/60">

              <Link
                href="/category/wet-food"
                className="block hover:text-[#c89b3c]"
              >
                Wet Food
              </Link>

              <Link
                href="/category/cat-accessories"
                className="block hover:text-[#c89b3c]"
              >
                Cat Accessories
              </Link>

              <Link
                href="/category/grooming"
                className="block hover:text-[#c89b3c]"
              >
                Grooming
              </Link>

              <Link
                href="/category/hot-sale"
                className="block hover:text-[#c89b3c]"
              >
                Hot Sale
              </Link>

            </div>

          </div>

          <div>

            <h3 className="font-bold">
              Help
            </h3>

            <div className="mt-4 space-y-3 text-sm text-white/60">

              <Link
                href="/faq"
                className="block hover:text-[#c89b3c]"
              >
                FAQ
              </Link>

              <Link
                href="/contact"
                className="block hover:text-[#c89b3c]"
              >
                Contact
              </Link>

              <Link
                href="/shipping"
                className="block hover:text-[#c89b3c]"
              >
                Shipping
              </Link>

              <Link
                href="/returns"
                className="block hover:text-[#c89b3c]"
              >
                Returns
              </Link>

            </div>

          </div>

        </div>

        <div className="border-t border-white/10">

          <div className="mx-auto max-w-7xl px-5 py-6 text-center text-xs text-white/40 lg:px-8">
            ©{" "}
            {new Date().getFullYear()}{" "}
            CATS HOME. All rights
            reserved.
          </div>

        </div>

      </footer>

      {/* ==========================================================
          PRODUCT DETAILS MODAL
      ========================================================== */}

      {selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5 backdrop-blur-sm"
          onMouseDown={
            closeProduct
          }
        >

          <div
            className="max-h-[90vh] w-full max-w-4xl overflow-auto rounded-[2rem] bg-[#f8f6f1]"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="grid md:grid-cols-2">

              <img
                src={
                  selectedProduct.image
                }
                alt={
                  selectedProduct.name
                }
                loading="eager"
                className="h-[420px] w-full object-cover md:h-full"
              />

              <div className="p-7 md:p-10">

                <button
                  type="button"
                  onClick={
                    closeProduct
                  }
                  className="ml-auto block text-3xl font-black leading-none text-black"
                  aria-label="Close product details"
                >
                  ×
                </button>

                <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#b58a32]">
                  {
                    selectedProduct.category
                  }
                </p>

                <h2 className="mt-3 text-4xl font-black leading-tight">
                  {
                    selectedProduct.name
                  }
                </h2>

                <div className="mt-5 flex flex-wrap items-baseline gap-2">

                  <span className="text-2xl font-black">
                    ৳
                    {formatPrice(
                      selectedProduct.price
                    )}
                  </span>

                  <span className="text-sm font-black text-black/70">
                    per{" "}
                    {
                      selectedProduct.unit
                    }
                  </span>

                  {selectedProduct.oldPrice && (
                    <span className="text-sm text-black/40 line-through">
                      ৳
                      {formatPrice(
                        selectedProduct.oldPrice
                      )}
                    </span>
                  )}

                </div>

                <p className="mt-6 leading-7 text-black/60">
                  {
                    selectedProduct.description
                  }
                </p>

                {selectedProduct.colours
                  .length > 0 && (
                  <div className="mt-6">

                    <p className="text-sm font-black">
                      Colours
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {selectedProduct.colours.map(
                        (colour) => (
                          <span
                            key={colour}
                            className="rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold"
                          >
                            {colour}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

                {selectedProduct.sizes
                  .length > 0 && (
                  <div className="mt-5">

                    <p className="text-sm font-black">
                      Sizes / Pack
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">

                      {selectedProduct.sizes.map(
                        (size) => (
                          <span
                            key={size}
                            className="rounded-lg border border-black/10 px-3 py-1.5 text-xs font-bold"
                          >
                            {size}
                          </span>
                        )
                      )}

                    </div>

                  </div>
                )}

                <div className="mt-5">

                  {selectedProduct.stock >=
                  getMinimumQuantity(
                    selectedProduct
                  ) ? (
                    <p className="text-sm font-bold text-green-600">
                      {formatQuantity(
                        selectedProduct.stock,
                        selectedProduct.unit
                      )}{" "}
                      {
                        selectedProduct.unit
                      }{" "}
                      in stock
                    </p>
                  ) : (
                    <p className="text-sm font-bold text-red-600">
                      Out of stock
                    </p>
                  )}

                </div>

                {/* QUANTITY */}

                <div className="mt-8 rounded-2xl border-2 border-black/15 bg-white p-4 shadow-md">

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>

                      <span className="text-base font-black text-black">
                        Quantity
                      </span>

                      {selectedProduct.unit ===
                      "kg" ? (
                        <p className="mt-1 text-xs font-bold text-black/60">
                          Minimum 0.5 kg ·
                          increase by 0.5 kg
                        </p>
                      ) : (
                        <p className="mt-1 text-xs font-bold text-black/60">
                          Select quantity
                          in pieces
                        </p>
                      )}

                    </div>

                    <div className="flex items-center justify-between gap-3">

                      <button
                        type="button"
                        onClick={() => {
                          const minimum =
                            getMinimumQuantity(
                              selectedProduct
                            );

                          const step =
                            getQuantityStep(
                              selectedProduct
                            );

                          const next =
                            roundQuantity(
                              productQuantity -
                                step
                            );

                          setProductQuantity(
                            Math.max(
                              minimum,
                              next
                            )
                          );
                        }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-2xl font-black leading-none text-white shadow-md transition hover:bg-[#c89b3c] hover:text-black active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>

                      <div className="flex min-w-[120px] items-center justify-center rounded-xl border-2 border-black bg-white px-4 py-2.5">

                        <span className="text-xl font-black leading-none text-black">
                          {formatQuantity(
                            productQuantity,
                            selectedProduct.unit
                          )}
                        </span>

                        <span className="ml-1.5 text-sm font-black text-black">
                          {
                            selectedProduct.unit
                          }
                        </span>

                      </div>

                      <button
                        type="button"
                        disabled={
                          productQuantity >=
                          getMaximumQuantity(
                            selectedProduct
                          )
                        }
                        onClick={() => {
                          const step =
                            getQuantityStep(
                              selectedProduct
                            );

                          const maximum =
                            getMaximumQuantity(
                              selectedProduct
                            );

                          const next =
                            roundQuantity(
                              productQuantity +
                                step
                            );

                          setProductQuantity(
                            Math.min(
                              maximum,
                              next
                            )
                          );
                        }}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-2xl font-black leading-none text-white shadow-md transition hover:bg-[#c89b3c] hover:text-black active:scale-95 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>

                    </div>

                  </div>

                </div>

                <div className="mt-4 flex items-center justify-between rounded-xl bg-black px-5 py-4 text-white">

                  <div>

                    <span className="text-sm font-bold text-white/70">
                      Subtotal
                    </span>

                    {selectedProduct.unit ===
                      "kg" && (
                      <p className="mt-1 text-xs text-white/45">
                        ৳
                        {formatPrice(
                          selectedProduct.price
                        )}{" "}
                        ×{" "}
                        {formatQuantity(
                          productQuantity,
                          "kg"
                        )} kg
                      </p>
                    )}

                  </div>

                  <span className="text-xl font-black text-[#d9b35c]">
                    ৳
                    {formatPrice(
                      getProductTotal(
                        selectedProduct,
                        productQuantity
                      )
                    )}
                  </span>

                </div>

                <div className="mt-6 grid gap-3">

                  <button
                    type="button"
                    disabled={
                      selectedProduct.stock <
                      getMinimumQuantity(
                        selectedProduct
                      )
                    }
                    onClick={() => {
                      const product =
                        selectedProduct;

                      const quantity =
                        productQuantity;

                      closeProduct();

                      openBuyNow(
                        product,
                        quantity
                      );
                    }}
                    className="rounded-2xl bg-[#c89b3c] px-5 py-4 text-sm font-black text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    BUY NOW
                  </button>

                  <button
                    type="button"
                    disabled={
                      selectedProduct.stock <
                      getMinimumQuantity(
                        selectedProduct
                      )
                    }
                    onClick={() => {
                      const product =
                        selectedProduct;

                      const quantity =
                        productQuantity;

                      addToCart(
                        product,
                        quantity
                      );

                      closeProduct();
                    }}
                    className="rounded-2xl bg-black px-5 py-4 text-sm font-black text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ADD TO CART
                  </button>

                </div>

              </div>

            </div>

          </div>

        </div>
      )}

      {/* ==========================================================
          CART
      ========================================================== */}

      {cartOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50"
          onMouseDown={() =>
            setCartOpen(false)
          }
        >

          <aside
            className="absolute right-0 top-0 h-full w-full max-w-md overflow-auto bg-[#f8f6f1] p-6 shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            <div className="flex items-center justify-between">

              <div>

                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b58a32]">
                  CATS HOME
                </p>

                <h2 className="mt-1 text-2xl font-black">
                  Shopping Cart
                </h2>

              </div>

              <button
                type="button"
                onClick={() =>
                  setCartOpen(false)
                }
                className="text-3xl font-black leading-none"
                aria-label="Close cart"
              >
                ×
              </button>

            </div>

            {cart.length === 0 ? (
              <div className="mt-16 text-center">

                <div className="text-5xl">
                  🐱
                </div>

                <p className="mt-5 font-bold">
                  Your cart is empty.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setCartOpen(false)
                  }
                  className="mt-5 rounded-full bg-black px-6 py-3 text-sm font-bold text-white"
                >
                  Continue Shopping
                </button>

              </div>
            ) : (
              <>

                <div className="mt-8 space-y-4">

                  {cart.map(
                    (item) => (
                      <div
                        key={item.id}
                        className="rounded-2xl bg-white p-3"
                      >

                        <div className="flex gap-4">

                          <img
                            src={
                              item.image
                            }
                            alt={
                              item.name
                            }
                            loading="lazy"
                            className="h-20 w-20 rounded-xl object-cover"
                          />

                          <div className="min-w-0 flex-1">

                            <p className="truncate font-bold">
                              {
                                item.name
                              }
                            </p>

                            <p className="mt-1 text-sm text-black/60">
                              ৳
                              {formatPrice(
                                item.price
                              )}{" "}
                              <span className="font-black text-black/70">
                                per{" "}
                                {
                                  item.unit
                                }
                              </span>
                            </p>

                            <p className="mt-1 text-xs font-bold text-black/40">
                              Total: ৳
                              {formatPrice(
                                getProductTotal(
                                  item,
                                  item.quantity
                                )
                              )}
                            </p>

                            <div className="mt-3 flex items-center gap-3">

                              <button
                                type="button"
                                onClick={() =>
                                  updateCartQuantity(
                                    item.id,
                                    item.quantity -
                                      getQuantityStep(
                                        item
                                      )
                                  )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-xl font-black leading-none text-white shadow-md transition hover:bg-[#c89b3c] hover:text-black"
                                aria-label="Decrease cart quantity"
                              >
                                −
                              </button>

                              <span className="flex min-w-[85px] items-center justify-center rounded-xl border-2 border-black bg-white px-3 py-2 text-base font-black text-black">

                                {formatQuantity(
                                  item.quantity,
                                  item.unit
                                )}

                                <span className="ml-1 text-xs font-black text-black">
                                  {
                                    item.unit
                                  }
                                </span>

                              </span>

                              <button
                                type="button"
                                disabled={
                                  item.quantity >=
                                  getMaximumQuantity(
                                    item
                                  )
                                }
                                onClick={() =>
                                  updateCartQuantity(
                                    item.id,
                                    item.quantity +
                                      getQuantityStep(
                                        item
                                      )
                                  )
                                }
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-xl font-black leading-none text-white shadow-md transition hover:bg-[#c89b3c] hover:text-black disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600"
                                aria-label="Increase cart quantity"
                              >
                                +
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  removeFromCart(
                                    item.id
                                  )
                                }
                                className="ml-auto text-xs font-bold text-red-500"
                              >
                                Remove
                              </button>

                            </div>

                          </div>

                        </div>

                      </div>
                    )
                  )}

                </div>

                <div className="mt-8 border-t border-black/10 pt-6">

                  <div className="flex items-center justify-between">

                    <span className="font-bold">
                      Total
                    </span>

                    <span className="text-2xl font-black">
                      ৳
                      {formatPrice(
                        cartTotal
                      )}
                    </span>

                  </div>

                  <p className="mt-4 rounded-2xl bg-white p-4 text-xs leading-5 text-black/60">
                    ADD TO CART saves
                    products in your
                    cart. To place an
                    order and choose a
                    payment method, use
                    BUY NOW.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const firstItem =
                        cart[0];

                      if (
                        firstItem
                      ) {
                        setCartOpen(
                          false
                        );

                        openBuyNow(
                          firstItem,
                          firstItem.quantity
                        );
                      }
                    }}
                    className="mt-5 w-full rounded-2xl bg-[#c89b3c] px-5 py-4 text-sm font-black text-black"
                  >
                    BUY NOW
                  </button>

                </div>

              </>
            )}

          </aside>

        </div>
      )}

      {/* ==========================================================
          BUY NOW CHECKOUT
      ========================================================== */}

      {buyNowProduct && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-3 backdrop-blur-md sm:p-5"
          onMouseDown={
            closeBuyNow
          }
        >

          <div
            className="max-h-[94vh] w-full max-w-2xl overflow-auto rounded-[2rem] border border-black/10 bg-[#f8f6f1] shadow-2xl"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >

            {!orderPlaced ? (
              <>

                {/* CHECKOUT HEADER */}

                <div className="sticky top-0 z-10 border-b border-black/10 bg-[#f8f6f1]/95 px-5 py-5 backdrop-blur-xl sm:px-7">

                  <div className="flex items-center justify-between">

                    <div>

                      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#b58a32]">
                        CATS HOME
                      </p>

                      <h2 className="mt-1 text-2xl font-black sm:text-3xl">
                        Quick Checkout
                      </h2>

                    </div>

                    <button
                      type="button"
                      onClick={
                        closeBuyNow
                      }
                      className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-black bg-white text-2xl font-black leading-none text-black transition hover:bg-black hover:text-white"
                      aria-label="Close checkout"
                    >
                      ×
                    </button>

                  </div>

                </div>

                <div className="p-5 sm:p-7">

                  {/* PRODUCT SUMMARY */}

                  <div className="overflow-hidden rounded-2xl border-2 border-black/10 bg-white shadow-sm">

                    <div className="flex gap-4 p-4">

                      <img
                        src={
                          buyNowProduct.image
                        }
                        alt={
                          buyNowProduct.name
                        }
                        loading="eager"
                        className="h-24 w-24 shrink-0 rounded-xl object-cover sm:h-28 sm:w-28"
                      />

                      <div className="min-w-0 flex-1">

                        <p className="text-lg font-black leading-tight">
                          {
                            buyNowProduct.name
                          }
                        </p>

                        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-black/45">
                          {
                            buyNowProduct.category
                          }
                        </p>

                        <p className="mt-2 text-sm font-black text-black">
                          ৳
                          {formatPrice(
                            buyNowProduct.price
                          )}

                          <span className="ml-1 text-xs text-black/60">
                            per{" "}
                            {
                              buyNowProduct.unit
                            }
                          </span>
                        </p>

                      </div>

                    </div>

                    {/* QUANTITY */}

                    <div className="border-t-2 border-black/10 bg-[#f8f6f1] p-4">

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <div>

                          <p className="text-sm font-black text-black">
                            Quantity
                          </p>

                          {buyNowProduct.unit ===
                          "kg" ? (
                            <p className="mt-0.5 text-xs font-bold text-black/50">
                              0.5 kg minimum ·
                              +0.5 kg each step
                            </p>
                          ) : (
                            <p className="mt-0.5 text-xs font-bold text-black/50">
                              1 piece minimum
                            </p>
                          )}

                        </div>

                        <div className="flex items-center gap-3">

                          <button
                            type="button"
                            onClick={() => {
                              const minimum =
                                getMinimumQuantity(
                                  buyNowProduct
                                );

                              const step =
                                getQuantityStep(
                                  buyNowProduct
                                );

                              const next =
                                roundQuantity(
                                  buyNowQuantity -
                                    step
                                );

                              setBuyNowQuantity(
                                Math.max(
                                  minimum,
                                  next
                                )
                              );
                            }}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-2xl font-black leading-none text-white shadow-md transition hover:bg-[#c89b3c] hover:text-black active:scale-95"
                            aria-label="Decrease checkout quantity"
                          >
                            −
                          </button>

                          <div className="flex min-w-[120px] items-center justify-center rounded-xl border-2 border-black bg-white px-4 py-2.5 shadow-sm">

                            <span className="text-xl font-black leading-none text-black">
                              {formatQuantity(
                                buyNowQuantity,
                                buyNowProduct.unit
                              )}
                            </span>

                            <span className="ml-1.5 text-sm font-black text-black">
                              {
                                buyNowProduct.unit
                              }
                            </span>

                          </div>

                          <button
                            type="button"
                            disabled={
                              buyNowQuantity >=
                              getMaximumQuantity(
                                buyNowProduct
                              )
                            }
                            onClick={() => {
                              const step =
                                getQuantityStep(
                                  buyNowProduct
                                );

                              const maximum =
                                getMaximumQuantity(
                                  buyNowProduct
                                );

                              const next =
                                roundQuantity(
                                  buyNowQuantity +
                                    step
                                );

                              setBuyNowQuantity(
                                Math.min(
                                  maximum,
                                  next
                                )
                              );
                            }}
                            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-black bg-black text-2xl font-black leading-none text-white shadow-md transition hover:bg-[#c89b3c] hover:text-black active:scale-95 disabled:cursor-not-allowed disabled:border-zinc-300 disabled:bg-zinc-300 disabled:text-zinc-600"
                            aria-label="Increase checkout quantity"
                          >
                            +
                          </button>

                        </div>

                      </div>

                      <div className="mt-4 flex items-center justify-between rounded-xl bg-black px-4 py-3 text-white">

                        <div>

                          <span className="text-xs font-bold text-white/60">
                            Product Total
                          </span>

                          {buyNowProduct.unit ===
                            "kg" && (
                            <p className="mt-1 text-[11px] text-white/40">
                              ৳
                              {formatPrice(
                                buyNowProduct.price
                              )}{" "}
                              ×{" "}
                              {formatQuantity(
                                buyNowQuantity,
                                "kg"
                              )} kg
                            </p>
                          )}

                        </div>

                        <span className="text-lg font-black text-[#d9b35c]">
                          ৳
                          {formatPrice(
                            buyNowTotal
                          )}
                        </span>

                      </div>

                    </div>

                  </div>

                  {/* DELIVERY LOCATION */}

                  <div className="mt-7">

                    <label
                      htmlFor="delivery-location"
                      className="text-sm font-black"
                    >
                      Delivery Location *
                    </label>

                    <select
                      id="delivery-location"
                      value={
                        deliveryArea
                      }
                      onChange={(event) =>
                        setDeliveryArea(
                          event.target
                            .value as DeliveryArea
                        )
                      }
                      className="mt-3 w-full rounded-2xl border-2 border-black/10 bg-white px-4 py-4 text-sm font-bold outline-none transition focus:border-[#c89b3c]"
                    >

                      <option value="">
                        Select delivery location
                      </option>

                      <option value="savar-city">
                        Savar City — FREE Delivery
                      </option>

                      <option value="outside-savar">
                        Outside Savar City — Delivery ৳140
                      </option>

                    </select>

                    {deliveryArea && (
                      <div
                        className={`mt-3 rounded-xl px-4 py-3 text-sm font-bold ${
                          deliveryArea ===
                          "savar-city"
                            ? "bg-green-50 text-green-700"
                            : "bg-[#fff8e8] text-[#8a681f]"
                        }`}
                      >
                        {deliveryArea ===
                        "savar-city" ? (
                          <>
                            ✓ Savar City
                            selected —
                            Delivery is
                            FREE.
                          </>
                        ) : (
                          <>
                            ✓ Outside Savar
                            City selected —
                            ৳140 delivery
                            charge added.
                          </>
                        )}
                      </div>
                    )}

                  </div>

                  {/* PAYMENT METHOD */}

                  <div className="mt-7">

                    <label className="text-sm font-black">
                      Payment Method *
                    </label>

                    <div className="mt-3 grid gap-3 sm:grid-cols-2">

                      {/* COD */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "cod"
                          )
                        }
                        className={`rounded-2xl border-2 p-5 text-left transition ${
                          paymentMethod ===
                          "cod"
                            ? "border-[#c89b3c] bg-[#fffaf0] shadow-md"
                            : "border-black/10 bg-white hover:border-black/30"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <p className="font-black">
                            Cash on Delivery
                          </p>

                          {paymentMethod ===
                            "cod" && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c89b3c] text-xs font-black">
                              ✓
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-black/50">
                          Pay when your
                          order arrives.
                        </p>

                      </button>

                      {/* BKASH */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "bkash"
                          )
                        }
                        className={`rounded-2xl border-2 p-5 text-left transition ${
                          paymentMethod ===
                          "bkash"
                            ? "border-[#c89b3c] bg-[#fffaf0] shadow-md"
                            : "border-black/10 bg-white hover:border-black/30"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <p className="font-black">
                            bKash
                          </p>

                          {paymentMethod ===
                            "bkash" && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c89b3c] text-xs font-black">
                              ✓
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-black/50">
                          Send Money
                        </p>

                        <p className="mt-2 font-black">
                          01869506686
                        </p>

                      </button>

                      {/* NAGAD */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "nagad"
                          )
                        }
                        className={`rounded-2xl border-2 p-5 text-left transition ${
                          paymentMethod ===
                          "nagad"
                            ? "border-[#c89b3c] bg-[#fffaf0] shadow-md"
                            : "border-black/10 bg-white hover:border-black/30"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <p className="font-black">
                            Nagad
                          </p>

                          {paymentMethod ===
                            "nagad" && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c89b3c] text-xs font-black">
                              ✓
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-black/50">
                          Send Money
                        </p>

                        <p className="mt-2 font-black">
                          01928156849
                        </p>

                      </button>

                      {/* ROCKET */}

                      <button
                        type="button"
                        onClick={() =>
                          setPaymentMethod(
                            "rocket"
                          )
                        }
                        className={`rounded-2xl border-2 p-5 text-left transition ${
                          paymentMethod ===
                          "rocket"
                            ? "border-[#c89b3c] bg-[#fffaf0] shadow-md"
                            : "border-black/10 bg-white hover:border-black/30"
                        }`}
                      >

                        <div className="flex items-center justify-between">

                          <p className="font-black">
                            Rocket
                          </p>

                          {paymentMethod ===
                            "rocket" && (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#c89b3c] text-xs font-black">
                              ✓
                            </span>
                          )}

                        </div>

                        <p className="mt-1 text-sm text-black/50">
                          Send Money
                        </p>

                        <p className="mt-2 font-black">
                          01619952823
                        </p>

                      </button>

                    </div>

                  </div>

                  {/* MOBILE PAYMENT */}

                  {isMobilePayment(
                    paymentMethod
                  ) && (
                    <div className="mt-5 rounded-2xl border-2 border-[#c89b3c]/50 bg-[#fffaf0] p-5">

                      <p className="text-base font-black">
                        {
                          getPaymentName(
                            paymentMethod
                          )
                        }{" "}
                        Payment
                      </p>

                      <p className="mt-1 text-sm text-black/60">
                        নিচের নম্বরে Send
                        Money করে
                        Transaction ID
                        দিন।
                      </p>

                      <div className="mt-4 space-y-3">

                        <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-4">

                          <span className="text-sm text-black/50">
                            Send Money
                          </span>

                          <span className="text-base font-black">
                            {
                              getPaymentNumber(
                                paymentMethod
                              )
                            }
                          </span>

                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-black/5 bg-white px-4 py-4">

                          <span className="text-sm text-black/50">
                            Amount
                          </span>

                          <span className="text-base font-black">
                            ৳
                            {formatPrice(
                              orderTotal
                            )}
                          </span>

                        </div>

                      </div>

                      <div className="mt-5">

                        <label className="mb-2 block text-sm font-bold">
                          {
                            getPaymentName(
                              paymentMethod
                            )
                          }{" "}
                          Transaction ID *
                        </label>

                        <input
                          type="text"
                          value={
                            transactionId
                          }
                          onChange={(event) =>
                            setTransactionId(
                              event.target
                                .value
                            )
                          }
                          placeholder="Enter Transaction ID"
                          className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3.5 text-sm font-bold outline-none transition focus:border-[#c89b3c]"
                        />

                      </div>

                      <div className="mt-4 rounded-xl border border-black/5 bg-white p-4 text-sm text-black/60">

                        <p className="font-bold text-black">
                          Payment Instructions
                        </p>

                        <ol className="mt-2 list-decimal space-y-1 pl-5">

                          <li>
                            Open your{" "}
                            {
                              getPaymentName(
                                paymentMethod
                              )
                            }{" "}
                            app.
                          </li>

                          <li>
                            Select Send
                            Money.
                          </li>

                          <li>
                            Send ৳
                            {formatPrice(
                              orderTotal
                            )}{" "}
                            to{" "}
                            {
                              getPaymentNumber(
                                paymentMethod
                              )
                            }
                            .
                          </li>

                          <li>
                            Enter the
                            Transaction ID
                            above.
                          </li>

                        </ol>

                      </div>

                    </div>
                  )}

                  {/* CUSTOMER */}

                  <div className="mt-7">

                    <label className="text-sm font-black">
                      Customer Details
                    </label>

                    <div className="mt-3 grid gap-4">

                      <input
                        type="text"
                        value={
                          customerName
                        }
                        onChange={(event) =>
                          setCustomerName(
                            event.target
                              .value
                          )
                        }
                        placeholder="Full Name *"
                        className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3.5 text-sm font-medium outline-none transition focus:border-[#c89b3c]"
                      />

                      <input
                        type="tel"
                        value={
                          customerPhone
                        }
                        onChange={(event) =>
                          setCustomerPhone(
                            event.target
                              .value
                          )
                        }
                        placeholder="Phone Number *"
                        className="w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3.5 text-sm font-medium outline-none transition focus:border-[#c89b3c]"
                      />

                      <div>

                        <label className="mb-2 block text-sm font-bold">
                          Full Delivery Address *
                        </label>

                        <textarea
                          value={
                            customerAddress
                          }
                          onChange={(event) =>
                            setCustomerAddress(
                              event.target
                                .value
                            )
                          }
                          placeholder="House/Road, Area, Thana, District — enter your full delivery address"
                          rows={4}
                          className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-3.5 text-sm font-medium outline-none transition focus:border-[#c89b3c]"
                        />

                        <p className="mt-2 text-xs leading-5 text-black/45">
                          Please provide
                          your complete
                          delivery address
                          so our delivery
                          team can find you
                          easily.
                        </p>

                      </div>

                      <textarea
                        value={
                          customerComment
                        }
                        onChange={(event) =>
                          setCustomerComment(
                            event.target
                              .value
                          )
                        }
                        placeholder="Comment (Optional)"
                        rows={2}
                        className="w-full resize-none rounded-xl border-2 border-black/10 bg-white px-4 py-3.5 text-sm font-medium outline-none transition focus:border-[#c89b3c]"
                      />

                    </div>

                  </div>

                  {/* FINAL TOTAL */}

                  <div className="mt-7 rounded-2xl bg-black p-5 text-white shadow-lg">

                    <div className="space-y-3">

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-bold text-white/60">
                          Product Total
                        </span>

                        <span className="font-black">
                          ৳
                          {formatPrice(
                            buyNowTotal
                          )}
                        </span>

                      </div>

                      <div className="flex items-center justify-between">

                        <span className="text-sm font-bold text-white/60">
                          Delivery
                          <span className="ml-1 text-xs text-white/40">
                            (
                            {
                              getDeliveryAreaName(
                                deliveryArea
                              ) ||
                                "Select location"
                            }
                            )
                          </span>
                        </span>

                        <span className="font-black">
                          {deliveryArea ===
                          "savar-city"
                            ? "FREE"
                            : deliveryArea ===
                              "outside-savar"
                            ? "৳140"
                            : "—"}
                        </span>

                      </div>

                      <div className="border-t border-white/10 pt-4">

                        <div className="flex items-center justify-between">

                          <div>

                            <span className="text-sm font-bold text-white/70">
                              Order Total
                            </span>

                            <p className="mt-1 text-xs font-bold text-white/50">
                              {formatQuantity(
                                buyNowQuantity,
                                buyNowProduct.unit
                              )}{" "}
                              {
                                buyNowProduct.unit
                              }
                            </p>

                          </div>

                          <span className="text-3xl font-black text-[#d9b35c]">
                            ৳
                            {formatPrice(
                              orderTotal
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={
                      placeOrder
                    }
                    className="mt-5 w-full rounded-2xl bg-[#c89b3c] px-5 py-4 text-sm font-black text-black shadow-lg transition hover:scale-[1.01] hover:brightness-105 active:scale-[0.99]"
                  >
                    PLACE ORDER
                  </button>

                  <p className="mt-3 text-center text-xs text-black/40">
                    By placing your
                    order, you agree
                    to our Terms &
                    Conditions.
                  </p>

                </div>

              </>
            ) : (

              /* ==================================================
                 ORDER SUCCESS
              ================================================== */

              <div className="p-7 py-14 text-center sm:p-12">

                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[#c89b3c] text-4xl font-black text-black shadow-lg">
                  ✓
                </div>

                <p className="mt-7 text-xs font-bold uppercase tracking-[0.2em] text-[#b58a32]">
                  CATS HOME
                </p>

                <h2 className="mt-3 text-4xl font-black">
                  Order Received!
                </h2>

                <p className="mx-auto mt-4 max-w-md leading-7 text-black/60">
                  Thank you for
                  shopping with
                  CATS HOME. Your
                  order has been
                  submitted
                  successfully. We
                  will contact you
                  on your provided
                  phone number to
                  confirm the order.
                </p>

                <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-black/10 bg-white p-5 text-left">

                  <div className="flex items-center justify-between">

                    <span className="text-sm text-black/50">
                      Delivery Location
                    </span>

                    <strong className="text-sm">
                      {
                        getDeliveryAreaName(
                          deliveryArea
                        )
                      }
                    </strong>

                  </div>

                  <div className="mt-3 flex items-center justify-between">

                    <span className="text-sm text-black/50">
                      Quantity
                    </span>

                    <strong className="text-sm">
                      {formatQuantity(
                        buyNowQuantity,
                        buyNowProduct.unit
                      )}{" "}
                      {
                        buyNowProduct.unit
                      }
                    </strong>

                  </div>

                  <div className="mt-3 flex items-center justify-between">

                    <span className="text-sm text-black/50">
                      Delivery Charge
                    </span>

                    <strong className="text-sm">
                      {deliveryArea ===
                      "savar-city"
                        ? "FREE"
                        : "৳140"}
                    </strong>

                  </div>

                  <div className="mt-3 flex items-center justify-between border-t border-black/10 pt-3">

                    <span className="font-bold">
                      Total
                    </span>

                    <strong className="text-xl font-black">
                      ৳
                      {formatPrice(
                        orderTotal
                      )}
                    </strong>

                  </div>

                </div>

                {isMobilePayment(
                  paymentMethod
                ) && (
                  <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-[#c89b3c]/30 bg-[#fffaf0] p-5 text-left">

                    <p className="text-sm font-bold">
                      {
                        getPaymentName(
                          paymentMethod
                        )
                      }{" "}
                      Payment
                    </p>

                    <p className="mt-2 text-sm text-black/60">
                      Send Money:{" "}
                      <strong className="text-black">
                        {
                          getPaymentNumber(
                            paymentMethod
                          )
                        }
                      </strong>
                    </p>

                    <p className="mt-1 text-sm text-black/60">
                      Amount:{" "}
                      <strong className="text-black">
                        ৳
                        {formatPrice(
                          orderTotal
                        )}
                      </strong>
                    </p>

                    <p className="mt-1 text-sm text-black/60">
                      Transaction ID:{" "}
                      <strong className="text-black">
                        {
                          transactionId
                        }
                      </strong>
                    </p>

                  </div>
                )}

                {paymentMethod ===
                  "cod" && (
                  <div className="mx-auto mt-6 max-w-md rounded-2xl border-2 border-[#c89b3c]/30 bg-[#fffaf0] p-5 text-left">

                    <p className="text-sm font-bold">
                      Cash on Delivery
                    </p>

                    <p className="mt-2 text-sm text-black/60">
                      Amount to pay:{" "}
                      <strong className="text-black">
                        ৳
                        {formatPrice(
                          orderTotal
                        )}
                      </strong>
                    </p>

                    <p className="mt-1 text-sm text-black/60">
                      Please pay when
                      your order
                      arrives.
                    </p>

                  </div>
                )}

                <button
                  type="button"
                  onClick={
                    closeBuyNow
                  }
                  className="mt-8 rounded-full bg-black px-8 py-3.5 text-sm font-black text-white transition hover:bg-[#c89b3c] hover:text-black"
                >
                  CONTINUE SHOPPING
                </button>

              </div>

            )}

          </div>

        </div>
      )}

    </main>
  );
}

/* ================================================================
   SECTION HEADING
================================================================ */

function SectionHeading({
  eyebrow,
  title,
  link,
  linkText,
}: {
  eyebrow: string;
  title: string;
  link?: string;
  linkText?: string;
}) {
  return (
    <div className="mb-9 flex items-end justify-between gap-5">

      <div>

        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b58a32]">
          {eyebrow}
        </p>

        <h2 className="mt-2 text-4xl font-black tracking-tight">
          {title}
        </h2>

      </div>

      {link && (
        <Link
          href={link}
          className="shrink-0 text-sm font-bold underline underline-offset-4 hover:text-[#b58a32]"
        >
          {linkText ||
            "View All"}
        </Link>
      )}

    </div>
  );
}

/* ================================================================
   CATEGORY PRODUCT SECTION
================================================================ */

function CategoryProductSection({
  eyebrow,
  title,
  link,
  products,
  loading,
  onOpen,
  onBuyNow,
  onAddToCart,
}: {
  eyebrow: string;
  title: string;
  link: string;
  products: Product[];
  loading: boolean;
  onOpen: (
    product: Product
  ) => void;
  onBuyNow: (
    product: Product,
    quantity?: number
  ) => void;
  onAddToCart: (
    product: Product,
    quantity?: number
  ) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-5 py-20 lg:px-8">

      <CategoryProductSectionInner
        eyebrow={eyebrow}
        title={title}
        link={link}
        products={products}
        loading={loading}
        onOpen={onOpen}
        onBuyNow={onBuyNow}
        onAddToCart={onAddToCart}
      />

    </section>
  );
}

/* ================================================================
   CATEGORY PRODUCT INNER
================================================================ */

function CategoryProductSectionInner({
  eyebrow,
  title,
  link,
  products,
  loading,
  onOpen,
  onBuyNow,
  onAddToCart,
}: {
  eyebrow: string;
  title: string;
  link: string;
  products: Product[];
  loading: boolean;
  onOpen: (
    product: Product
  ) => void;
  onBuyNow: (
    product: Product,
    quantity?: number
  ) => void;
  onAddToCart: (
    product: Product,
    quantity?: number
  ) => void;
}) {
  return (
    <>
      <SectionHeading
        eyebrow={eyebrow}
        title={title}
        link={link}
        linkText="View All"
      />

      {loading ? (
        <ProductLoadingGrid />
      ) : products.length ===
        0 ? (
        <EmptyProducts
          text={`No ${title.toLowerCase()} products yet.`}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

          {products.map(
            (product) => (
              <ProductCard
                key={product.id}
                product={product}
                onOpen={onOpen}
                onBuyNow={onBuyNow}
                onAddToCart={
                  onAddToCart
                }
              />
            )
          )}

        </div>
      )}
    </>
  );
}

/* ================================================================
   LOADING
================================================================ */

function ProductLoadingGrid() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">

      {Array.from({
        length: 4,
      }).map((_, index) => (
        <div
          key={index}
          className="overflow-hidden rounded-3xl bg-white"
        >

          <div className="h-80 animate-pulse bg-black/5" />

          <div className="space-y-3 p-5">

            <div className="h-3 w-20 animate-pulse rounded bg-black/5" />

            <div className="h-5 w-40 animate-pulse rounded bg-black/5" />

            <div className="h-4 w-24 animate-pulse rounded bg-black/5" />

          </div>

        </div>
      ))}

    </div>
  );
}

/* ================================================================
   EMPTY
================================================================ */

function EmptyProducts({
  text,
}: {
  text: string;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-black/10 bg-white p-12 text-center">

      <div className="text-4xl">
        🐱
      </div>

      <p className="mt-4 font-bold">
        {text}
      </p>

    </div>
  );
}

/* ================================================================
   PRODUCT CARD
================================================================ */

function ProductCard({
  product,
  onOpen,
  onBuyNow,
  onAddToCart,
}: {
  product: Product;

  onOpen: (
    product: Product
  ) => void;

  onBuyNow: (
    product: Product,
    quantity?: number
  ) => void;

  onAddToCart: (
    product: Product,
    quantity?: number
  ) => void;
}) {
  const discount =
    product.oldPrice &&
    product.oldPrice > product.price
      ? Math.round(
          ((product.oldPrice -
            product.price) /
            product.oldPrice) *
            100
        )
      : 0;

  const minimum =
    getMinimumQuantity(product);

  const maximum =
    getMaximumQuantity(product);

  /*
   * A kg product needs at least 0.5 kg
   * to be orderable.
   */
  const outOfStock =
    product.stock < minimum ||
    maximum < minimum;

  return (
    <article className="group overflow-hidden rounded-[1.75rem] border border-black/5 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">

      <button
        type="button"
        onClick={() =>
          onOpen(product)
        }
        className="block w-full text-left"
      >

        <div className="relative overflow-hidden">

          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="h-80 w-full object-cover transition duration-700 group-hover:scale-105"
          />

          {discount > 0 && (
            <span className="absolute left-4 top-4 rounded-full bg-[#c89b3c] px-3 py-1.5 text-xs font-black text-black">
              -{discount}%
            </span>
          )}

          {product.isGadget && (
            <span className="absolute bottom-4 left-4 rounded-full bg-black px-3 py-1.5 text-xs font-black text-white">
              ACCESSORY
            </span>
          )}

          {outOfStock && (
            <span className="absolute right-4 top-4 rounded-full bg-red-600 px-3 py-1.5 text-xs font-black text-white">
              OUT OF STOCK
            </span>
          )}

          {product.isHotSale && (
            <span className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1.5 text-xs font-black text-black">
              HOT
            </span>
          )}

        </div>

      </button>

      <div className="p-5">

        <p className="text-xs font-bold uppercase tracking-[0.15em] text-black/40">
          {
            product.category
          }
        </p>

        <button
          type="button"
          onClick={() =>
            onOpen(product)
          }
          className="mt-2 text-left text-lg font-black leading-tight hover:text-[#b58a32]"
        >
          {product.name}
        </button>

        <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1">

          <span className="text-lg font-black">
            ৳
            {formatPrice(
              product.price
            )}
          </span>

          <span className="text-xs font-black text-black/70">
            per{" "}
            {product.unit}
          </span>

          {product.oldPrice && (
            <span className="text-sm text-black/40 line-through">
              ৳
              {formatPrice(
                product.oldPrice
              )}
            </span>
          )}

        </div>

        {!outOfStock && (
          <p className="mt-2 text-xs font-bold text-green-600">
            {formatQuantity(
              product.stock,
              product.unit
            )}{" "}
            {product.unit}{" "}
            in stock
          </p>
        )}

        {product.unit ===
          "kg" &&
          !outOfStock && (
            <p className="mt-1 text-[11px] font-bold text-black/40">
              Minimum order:
              0.5 kg · +0.5 kg
            </p>
          )}

        <div className="mt-5 grid gap-2">

          <button
            type="button"
            disabled={
              outOfStock
            }
            onClick={() =>
              onBuyNow(
                product,
                minimum
              )
            }
            className="rounded-xl bg-[#c89b3c] px-4 py-3 text-xs font-black text-black transition hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            BUY NOW
          </button>

          <button
            type="button"
            disabled={
              outOfStock
            }
            onClick={() =>
              onAddToCart(
                product,
                minimum
              )
            }
            className="rounded-xl bg-black px-4 py-3 text-xs font-black text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-40"
          >
            ADD TO CART
          </button>

        </div>

      </div>

    </article>
  );
}
