// Utility for generating placeholder product images using Pollinations.AI
export const generateProductImage = (productTitle, productDescription = '') => {
  // Create a descriptive prompt based on the product title and description
  const prompt = `Product image for: ${productTitle}${productDescription ? ` - ${productDescription}` : ''}. Clean, professional e-commerce product photo on white background, high quality, commercial photography style`;
  
  // Pollinations.AI API endpoint (free, no API key required)
  const baseUrl = 'https://image.pollinations.ai/prompt';
  
  // Encode the prompt for URL
  const encodedPrompt = encodeURIComponent(prompt);
  
  // Return the image URL with size parameters
  return `${baseUrl}/${encodedPrompt}?width=400&height=300&nologo=true`;
};

// Fallback to a default placeholder if image generation fails
export const getProductImageUrl = (product) => {
  // If product has a thumbnail, use it
  if (product.thumbnail) {
    return product.thumbnail;
  }
  
  // Generate a placeholder image using the product title
  return generateProductImage(product.title, product.description);
};
