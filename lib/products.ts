export type Product = {
  id: number;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  image: string;
  description: string;
  isGadget?: boolean;
  isHotSale?: boolean;
  isOffer?: boolean;
};

export const products: Product[] = [
  {
    id: 1,
    name: "Premium Dry Cat Food",
    category: "Cat Food",
    price: 899,
    oldPrice: 1199,
    image:
      "https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=1000&q=85",
    description:
      "Nutritious premium dry cat food made with quality ingredients for healthy and happy cats.",
    isOffer: true,
  },

  {
    id: 2,
    name: "Premium Wet Cat Food",
    category: "Wet Food",
    price: 249,
    oldPrice: 299,
    image:
      "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1000&q=85",
    description:
      "Delicious wet cat food with a tasty texture that cats love, perfect for everyday feeding.",
    isHotSale: true,
    isOffer: true,
  },

  {
    id: 3,
    name: "Premium Clumping Cat Litter",
    category: "Cat Litter",
    price: 699,
    oldPrice: 899,
    image:
      "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=1000&q=85",
    description:
      "Fast-clumping cat litter designed for excellent odor control and easy daily cleaning.",
    isOffer: true,
  },

  {
    id: 4,
    name: "Interactive Cat Toy Set",
    category: "Cat Toys",
    price: 499,
    oldPrice: 699,
    image:
      "https://images.unsplash.com/photo-1545249390-6bdfa286032f?auto=format&fit=crop&w=1000&q=85",
    description:
      "Fun interactive toys designed to keep your cat active, entertained and mentally stimulated.",
    isHotSale: true,
  },

  {
    id: 5,
    name: "Cat Grooming Brush",
    category: "Grooming",
    price: 349,
    oldPrice: 499,
    image:
      "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1000&q=85",
    description:
      "Gentle grooming brush for removing loose fur while keeping your cat's coat clean and healthy.",
    isHotSale: true,
    isOffer: true,
  },

  {
    id: 6,
    name: "Premium Cat Feeding Bowl",
    category: "Bowls & Feeders",
    price: 599,
    oldPrice: 799,
    image:
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=1000&q=85",
    description:
      "Stylish and practical feeding bowl designed for comfortable everyday meals.",
    isHotSale: true,
  },

  {
    id: 7,
    name: "Cozy Cat Bed",
    category: "Beds & Furniture",
    price: 1299,
    oldPrice: 1699,
    image:
      "https://images.unsplash.com/photo-1548366086-7f1b76106622?auto=format&fit=crop&w=1000&q=85",
    description:
      "Soft and cozy cat bed that gives your cat a comfortable place to relax and sleep.",
    isOffer: true,
  },

  {
    id: 8,
    name: "Premium Cat Collar",
    category: "Cat Accessories",
    price: 399,
    oldPrice: 599,
    image:
      "https://images.unsplash.com/photo-1592194996308-7b43878e84a6?auto=format&fit=crop&w=1000&q=85",
    description:
      "Comfortable and stylish cat collar made for everyday use with a lightweight design.",
    isHotSale: true,
  },
];

export const categories = [
  {
    name: "Cat Food",
    icon: "🐱",
    slug: "cat-food",
  },
  {
    name: "Wet Food",
    icon: "🥫",
    slug: "wet-food",
  },
  {
    name: "Cat Litter",
    icon: "🧼",
    slug: "cat-litter",
  },
  {
    name: "Cat Toys",
    icon: "🧶",
    slug: "cat-toys",
  },
  {
    name: "Grooming",
    icon: "🪮",
    slug: "grooming",
  },
  {
    name: "Cat Accessories",
    icon: "🐾",
    slug: "cat-accessories",
  },
  {
    name: "Beds & Furniture",
    icon: "🛏️",
    slug: "beds-furniture",
  },
  {
    name: "Bowls & Feeders",
    icon: "🥣",
    slug: "bowls-feeders",
  },
];

export function getProductById(id: number) {
  return products.find((product) => product.id === id);
}

export function getProductsByCategory(category: string) {
  return products.filter(
    (product) =>
      product.category.toLowerCase() === category.toLowerCase()
  );
}

export function getHotSaleProducts() {
  return products.filter(
    (product) => product.isHotSale
  );
}

export function getOfferProducts() {
  return products.filter(
    (product) => product.isOffer
  );
}

export function getGadgetProducts() {
  return products.filter(
    (product) => product.isGadget
  );
}